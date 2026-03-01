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

    public AssistantService(
        AssistantServicePort assistantServicePort,
        UserRepository userRepository,
        TripRepository tripRepository,
        AssistantPlanRepository assistantPlanRepository,
        PricingServicePort pricingServicePort,
        WeatherServicePort weatherServicePort,
        PlacesServicePort placesServicePort) {
        this.assistantServicePort = assistantServicePort;
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.assistantPlanRepository = assistantPlanRepository;
        this.pricingServicePort = pricingServicePort;
        this.weatherServicePort = weatherServicePort;
        this.placesServicePort = placesServicePort;
    }

    @Transactional
    public AssistantPlanResponse buildPlan(AssistantPlanRequest request) {
        validateRequest(request);
        User user = userRepository.findById(request.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Trip trip = resolveTrip(request, user);
        AssistantPlanRequest enrichedRequest = enrichRequest(request, trip);

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

    private AssistantPlanRequest enrichRequest(AssistantPlanRequest request, Trip trip) {
        String destination = hasText(request.destination())
            ? request.destination().trim()
            : trip.getLocation();
        String origin = hasText(request.origin()) ? request.origin() : "Current location";
        String vibe = hasText(request.vibe()) ? request.vibe() : inferVibe(request.prompt());
        List<PriceQuote> priceQuotes = request.priceQuotes() == null || request.priceQuotes().isEmpty()
            ? pricingServicePort.getTripPricing(origin, destination, request.people())
            : request.priceQuotes();
        WeatherSnapshot weather = request.weather() != null
            ? request.weather()
            : weatherServicePort.getCurrentWeather(destination);
        List<PlaceCandidate> places = request.places() == null || request.places().isEmpty()
            ? placesServicePort.findActivities(destination, vibe)
            : request.places();

        return new AssistantPlanRequest(
            request.userId(),
            trip.getId(),
            destination,
            request.budget(),
            request.days(),
            request.people(),
            request.prompt(),
            origin,
            vibe,
            priceQuotes,
            weather,
            places);
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
}
