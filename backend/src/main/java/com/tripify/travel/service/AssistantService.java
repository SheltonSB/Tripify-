package com.tripify.travel.service;

import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;
import com.tripify.travel.dto.assistant.AssistantStep;
import com.tripify.travel.dto.assistant.StoredAssistantPlanResponse;
import com.tripify.travel.dto.places.PlaceCandidate;
import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.dto.weather.WeatherSnapshot;
import com.tripify.travel.model.AssistantPlan;
import com.tripify.travel.model.AssistantPlanStep;
import com.tripify.travel.model.Trip;
import com.tripify.travel.model.User;
import com.tripify.travel.repository.AssistantPlanRepository;
import com.tripify.travel.repository.TripRepository;
import com.tripify.travel.repository.UserRepository;
import com.tripify.travel.service.port.AssistantServicePort;
import com.tripify.travel.service.port.PlacesServicePort;
import com.tripify.travel.service.port.PricingServicePort;
import com.tripify.travel.service.port.WeatherServicePort;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);

    private final AssistantServicePort assistantServicePort;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final AssistantPlanRepository assistantPlanRepository;
    private final PricingServicePort pricingServicePort;
    private final WeatherServicePort weatherServicePort;
    private final PlacesServicePort placesServicePort;
    private final PlaceRankingService placeRankingService;

    public AssistantService(
        AssistantServicePort assistantServicePort,
        UserRepository userRepository,
        TripRepository tripRepository,
        AssistantPlanRepository assistantPlanRepository,
        PricingServicePort pricingServicePort,
        WeatherServicePort weatherServicePort,
        PlacesServicePort placesServicePort,
        PlaceRankingService placeRankingService) {
        this.assistantServicePort = assistantServicePort;
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.assistantPlanRepository = assistantPlanRepository;
        this.pricingServicePort = pricingServicePort;
        this.weatherServicePort = weatherServicePort;
        this.placesServicePort = placesServicePort;
        this.placeRankingService = placeRankingService;
    }

    @Transactional
    public AssistantPlanResponse buildPlan(AssistantPlanRequest request) {
        validateRequest(request);
        User user = userRepository.findById(request.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Trip trip = resolveTrip(request, user);
        AssistantPlanRequest enrichedRequest = enrichRequest(request, user, trip);

        logger.info(
            "Building AI plan userId={} tripId={} destination={} quotes={} places={} weather={}",
            enrichedRequest.userId(),
            trip.getId(),
            enrichedRequest.destination(),
            enrichedRequest.priceQuotes().size(),
            enrichedRequest.places().size(),
            enrichedRequest.weather() != null ? enrichedRequest.weather().summary() : "none");

        AssistantPlanResponse response = assistantServicePort.buildPlan(enrichedRequest);
        assistantPlanRepository.save(toEntity(response, user, trip));
        logger.info(
            "Persisted AI plan userId={} tripId={} destination={} steps={}",
            user.getId(),
            trip.getId(),
            response.destination(),
            response.steps().size());
        return response;
    }

    @Transactional(readOnly = true)
    public List<StoredAssistantPlanResponse> getPlansForTrip(Long tripId) {
        return assistantPlanRepository.findAllByTripIdOrderByCreatedAtDesc(tripId).stream()
            .map(StoredAssistantPlanResponse::fromEntity)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<StoredAssistantPlanResponse> getPlansForUser(Long userId) {
        return assistantPlanRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(StoredAssistantPlanResponse::fromEntity)
            .toList();
    }

    private void validateRequest(AssistantPlanRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (request.userId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        if (request.destination() == null || request.destination().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destination is required");
        }
        if (request.days() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Days must be greater than zero");
        }
        if (request.people() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "People must be greater than zero");
        }
        if (request.latitude() != null && (request.latitude() < -90 || request.latitude() > 90)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Latitude must be between -90 and 90");
        }
        if (request.longitude() != null && (request.longitude() < -180 || request.longitude() > 180)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Longitude must be between -180 and 180");
        }
    }

    private Trip resolveTrip(AssistantPlanRequest request, User user) {
        if (request.tripId() != null) {
            return tripRepository.findByIdAndUserId(request.tripId(), user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found for user"));
        }

        return tripRepository.findFirstByUserIdAndLocationIgnoreCaseOrderByIdDesc(user.getId(), request.destination())
            .or(() -> tripRepository.findFirstByUserIdOrderByIdDesc(user.getId()))
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Create a trip before generating an assistant plan"));
    }

    private AssistantPlan toEntity(AssistantPlanResponse response, User user, Trip trip) {
        AssistantPlan plan = new AssistantPlan();
        plan.setDestination(response.destination());
        plan.setSummary(response.summary());
        plan.setUser(user);
        plan.setTrip(trip);

        for (AssistantStep step : response.steps()) {
            AssistantPlanStep planStep = new AssistantPlanStep();
            planStep.setTitle(step.title());
            planStep.setDescription(step.description());
            planStep.setDayNumber(step.dayNumber());
            plan.addStep(planStep);
        }

        return plan;
    }

    private AssistantPlanRequest enrichRequest(AssistantPlanRequest request, User user, Trip trip) {
        String destination = hasText(request.destination())
            ? request.destination().trim()
            : trip.getLocation();
        String origin = hasText(request.origin()) ? request.origin().trim() : "Current location";
        String vibe = resolveVibe(request, user);
        String prompt = buildPromptWithIntent(request.prompt(), user, vibe);
        List<PriceQuote> priceQuotes = request.priceQuotes() == null || request.priceQuotes().isEmpty()
            ? pricingServicePort.getTripPricing(origin, destination, request.people())
            : request.priceQuotes();
        WeatherSnapshot weather = request.weather() != null
            ? request.weather()
            : weatherServicePort.getCurrentWeather(destination);
        List<PlaceCandidate> places = request.places() == null || request.places().isEmpty()
            ? placesServicePort.findActivities(destination, vibe, request.latitude(), request.longitude())
            : request.places();
        List<PlaceCandidate> rankedPlaces = placeRankingService.rankPlaces(
            request.budget(),
            request.days(),
            request.people(),
            vibe,
            priceQuotes,
            weather,
            places);

        return new AssistantPlanRequest(
            request.userId(),
            trip.getId(),
            destination,
            request.budget(),
            request.days(),
            request.people(),
            prompt,
            origin,
            request.latitude(),
            request.longitude(),
            vibe,
            priceQuotes,
            weather,
            rankedPlaces);
    }

    private String resolveVibe(AssistantPlanRequest request, User user) {
        if (hasText(request.vibe())) {
            return request.vibe().trim();
        }
        String profileVibe = inferVibeFromProfile(user);
        if (hasText(profileVibe)) {
            return profileVibe;
        }
        return inferVibe(request.prompt());
    }

    private String inferVibeFromProfile(User user) {
        if (user == null) {
            return null;
        }

        String tripCategory = lower(user.getTripCategory());
        if (tripCategory.contains("romantic")) {
            return "romantic";
        }
        if (tripCategory.contains("family")) {
            return "family";
        }
        if (tripCategory.contains("friends")) {
            return "social";
        }

        String personality = lower(user.getPersonalityType());
        if (personality.contains("extrovert")) {
            return "nightlife";
        }
        if (personality.contains("introvert")) {
            return "relaxed";
        }

        String foodPreference = lower(user.getDietaryPreference()) + " " + lower(user.getFoodPreferences());
        if (foodPreference.contains("vegan") || foodPreference.contains("food")) {
            return "foodie";
        }

        return null;
    }

    private String buildPromptWithIntent(String prompt, User user, String vibe) {
        String basePrompt = hasText(prompt) ? prompt.trim() : "Plan a practical trip with strong value.";
        if (user == null) {
            return basePrompt;
        }

        String dietary = firstText(user.getDietaryPreference(), user.getFoodPreferences(), "Not specified");
        String tripCategory = firstText(user.getTripCategory(), "Not specified");
        String personality = firstText(user.getPersonalityType(), "Not specified");
        String allergies = firstText(user.getAllergies(), "None");
        String lactose = yesNo(user.getLactoseIntolerant());
        String drinking = yesNo(user.getDrinksAlcohol());
        String smoking = yesNo(user.getSmokes());
        String vibeText = firstText(vibe, "balanced");

        StringBuilder enriched = new StringBuilder(basePrompt);
        enriched.append("\n\nUser intent context:");
        enriched.append("\n- Vibe: ").append(vibeText);
        enriched.append("\n- Trip category: ").append(tripCategory);
        enriched.append("\n- Personality: ").append(personality);
        enriched.append("\n- Dietary preference: ").append(dietary);
        enriched.append("\n- Lactose intolerant: ").append(lactose);
        enriched.append("\n- Allergies: ").append(allergies);
        enriched.append("\n- Drinks alcohol: ").append(drinking);
        enriched.append("\n- Smokes: ").append(smoking);
        enriched.append("\nUse this context when choosing and explaining recommendations.");
        return enriched.toString();
    }

    private String inferVibe(String prompt) {
        String normalized = prompt == null ? "" : prompt.toLowerCase();
        if (normalized.contains("food")) {
            return "foodie";
        }
        if (normalized.contains("music")) {
            return "music";
        }
        if (normalized.contains("luxury")) {
            return "luxury";
        }
        if (normalized.contains("night")) {
            return "nightlife";
        }
        return "balanced";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String lower(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String yesNo(Boolean value) {
        if (value == null) {
            return "Not specified";
        }
        return value ? "Yes" : "No";
    }

    private String firstText(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }
}
