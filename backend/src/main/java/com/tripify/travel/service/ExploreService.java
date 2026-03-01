package com.tripify.travel.service;

import com.tripify.travel.dto.discovery.DestinationPhotoResponse;
import com.tripify.travel.dto.discovery.ExploreRecommendationsResponse;
import com.tripify.travel.dto.discovery.LiveEventResponse;
import com.tripify.travel.dto.discovery.RecommendedPlaceResponse;
import com.tripify.travel.dto.places.PlaceCandidate;
import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.dto.weather.WeatherSnapshot;
import com.tripify.travel.model.User;
import com.tripify.travel.repository.UserRepository;
import com.tripify.travel.service.port.PlacesServicePort;
import com.tripify.travel.service.port.PricingServicePort;
import com.tripify.travel.service.port.WeatherServicePort;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class ExploreService {

    private static final Logger logger = LoggerFactory.getLogger(ExploreService.class);

    private final RestClient googlePlacesClient;
    private final RestClient ticketmasterClient;
    private final String googlePlacesApiKey;
    private final String ticketmasterApiKey;
    private final PricingServicePort pricingServicePort;
    private final WeatherServicePort weatherServicePort;
    private final PlacesServicePort placesServicePort;
    private final PlaceRankingService placeRankingService;
    private final UserRepository userRepository;

    public ExploreService(
        RestClient.Builder restClientBuilder,
        PricingServicePort pricingServicePort,
        WeatherServicePort weatherServicePort,
        PlacesServicePort placesServicePort,
        PlaceRankingService placeRankingService,
        UserRepository userRepository,
        @Value("${tripify.providers.google-places.base-url:https://places.googleapis.com}") String googlePlacesBaseUrl,
        @Value("${tripify.providers.ticketmaster.base-url:https://app.ticketmaster.com}") String ticketmasterBaseUrl,
        @Value("${TRIPIFY_GOOGLE_PLACES_API_KEY:}") String googlePlacesApiKey,
        @Value("${TRIPIFY_TICKETMASTER_API_KEY:}") String ticketmasterApiKey) {
        this.googlePlacesClient = restClientBuilder.baseUrl(resolveBaseUrl(googlePlacesBaseUrl, "https://places.googleapis.com")).build();
        this.ticketmasterClient = restClientBuilder.baseUrl(resolveBaseUrl(ticketmasterBaseUrl, "https://app.ticketmaster.com")).build();
        this.googlePlacesApiKey = googlePlacesApiKey;
        this.ticketmasterApiKey = ticketmasterApiKey;
        this.pricingServicePort = pricingServicePort;
        this.weatherServicePort = weatherServicePort;
        this.placesServicePort = placesServicePort;
        this.placeRankingService = placeRankingService;
        this.userRepository = userRepository;
    }

    public ExploreRecommendationsResponse getRecommendations(
        String destination,
        double budget,
        int days,
        int people,
        Long userId,
        String vibe,
        Double latitude,
        Double longitude) {
        String resolvedDestination = destination == null ? "" : destination.trim();
        String resolvedVibe = resolveVibe(userId, vibe);

        CompletableFuture<List<PriceQuote>> priceQuotesFuture = CompletableFuture.supplyAsync(
            () -> pricingServicePort.getTripPricing("Current location", resolvedDestination, Math.max(people, 1)));
        CompletableFuture<WeatherSnapshot> weatherFuture = CompletableFuture.supplyAsync(
            () -> weatherServicePort.getCurrentWeather(resolvedDestination));
        CompletableFuture<List<PlaceCandidate>> placesFuture = CompletableFuture.supplyAsync(
            () -> placesServicePort.findActivities(resolvedDestination, resolvedVibe, latitude, longitude));

        CompletableFuture.allOf(priceQuotesFuture, weatherFuture, placesFuture).join();

        List<PriceQuote> priceQuotes = priceQuotesFuture.join();
        WeatherSnapshot weather = weatherFuture.join();
        List<PlaceCandidate> places = placesFuture.join();
        List<PlaceCandidate> rankedPlaces = placeRankingService.rankPlaces(
            budget,
            days,
            people,
            resolvedVibe,
            priceQuotes,
            weather,
            places);

        double fixedCost = priceQuotes.stream()
            .filter(quote -> quote.category() != null)
            .filter(quote -> {
                String category = quote.category().trim().toLowerCase();
                return category.equals("flight") || category.equals("lodging") || category.equals("hotel");
            })
            .mapToDouble(PriceQuote::amount)
            .sum();

        return new ExploreRecommendationsResponse(
            resolvedDestination,
            resolvedVibe,
            budget,
            fixedCost,
            Math.max(0, budget - fixedCost),
            weather,
            priceQuotes,
            rankedPlaces.stream().map(RecommendedPlaceResponse::fromPlace).toList());
    }

    private String resolveVibe(Long userId, String requestedVibe) {
        if (requestedVibe != null && !requestedVibe.isBlank()) {
            return requestedVibe.trim();
        }

        if (userId != null) {
            String profileVibe = userRepository.findById(userId)
                .map(this::inferVibeFromProfile)
                .orElse("");
            if (!profileVibe.isBlank()) {
                return profileVibe;
            }
        }

        return "balanced";
    }

    private String inferVibeFromProfile(User user) {
        if (user == null) {
            return "";
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

        return "";
    }

    private String lower(String value) {
        return value == null ? "" : value.toLowerCase();
    }

    public DestinationPhotoResponse getDestinationPhotos(String destination) {
        if (destination == null || destination.isBlank() || googlePlacesApiKey.isBlank()) {
            return new DestinationPhotoResponse(destination, List.of());
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = googlePlacesClient.post()
                .uri("/v1/places:searchText")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Goog-Api-Key", googlePlacesApiKey)
                .header("X-Goog-FieldMask", "places.photos.name")
                .body(Map.of("textQuery", "best landmarks and scenic attractions in " + destination))
                .retrieve()
                .body(Map.class);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> places = response == null
                ? List.of()
                : (List<Map<String, Object>>) response.getOrDefault("places", List.of());

            Set<String> photoUrls = new LinkedHashSet<>();
            for (Map<String, Object> place : places) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> photos = (List<Map<String, Object>>) place.getOrDefault("photos", List.of());
                for (Map<String, Object> photo : photos) {
                    Object photoName = photo.get("name");
                    if (photoName == null) {
                        continue;
                    }
                    String photoUrl = resolvePhotoUrl(String.valueOf(photoName));
                    if (photoUrl != null && !photoUrl.isBlank()) {
                        photoUrls.add(photoUrl);
                    }
                    if (photoUrls.size() >= 4) {
                        return new DestinationPhotoResponse(destination, List.copyOf(photoUrls));
                    }
                }
            }
            return new DestinationPhotoResponse(destination, List.copyOf(photoUrls));
        } catch (RuntimeException exception) {
            logger.warn("Google destination photo lookup failed destination={}", destination, exception);
            return new DestinationPhotoResponse(destination, List.of());
        }
    }

    public List<LiveEventResponse> getLiveEvents(
        String destination,
        String area,
        Double latitude,
        Double longitude,
        int radiusMiles) {
        if (destination == null || destination.isBlank() || ticketmasterApiKey.isBlank()) {
            return List.of();
        }

        try {
            int resolvedRadiusMiles = Math.max(1, Math.min(radiusMiles, 50));
            String keyword = area != null && !area.isBlank()
                ? area.trim() + " " + destination.trim()
                : destination.trim();

            @SuppressWarnings("unchecked")
            Map<String, Object> response = ticketmasterClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/discovery/v2/events.json")
                    .queryParam("apikey", ticketmasterApiKey)
                    .queryParam("keyword", keyword)
                    .queryParam("sort", "date,asc")
                    .queryParam("size", 6)
                    .queryParamIfPresent("latlong", latitude != null && longitude != null
                        ? java.util.Optional.of(latitude + "," + longitude)
                        : java.util.Optional.empty())
                    .queryParamIfPresent("radius", latitude != null && longitude != null
                        ? java.util.Optional.of(resolvedRadiusMiles)
                        : java.util.Optional.empty())
                    .queryParamIfPresent("unit", latitude != null && longitude != null
                        ? java.util.Optional.of("miles")
                        : java.util.Optional.empty())
                    .build())
                .retrieve()
                .body(Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> embedded = response == null
                ? Map.of()
                : (Map<String, Object>) response.getOrDefault("_embedded", Map.of());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> events = (List<Map<String, Object>>) embedded.getOrDefault("events", List.of());

            List<LiveEventResponse> results = new ArrayList<>();
            for (Map<String, Object> event : events) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> images = (List<Map<String, Object>>) event.getOrDefault("images", List.of());
                @SuppressWarnings("unchecked")
                Map<String, Object> dates = (Map<String, Object>) event.getOrDefault("dates", Map.of());
                @SuppressWarnings("unchecked")
                Map<String, Object> start = (Map<String, Object>) dates.getOrDefault("start", Map.of());
                @SuppressWarnings("unchecked")
                Map<String, Object> eventEmbedded = (Map<String, Object>) event.getOrDefault("_embedded", Map.of());
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> venues = (List<Map<String, Object>>) eventEmbedded.getOrDefault("venues", List.of());
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> priceRanges = (List<Map<String, Object>>) event.getOrDefault("priceRanges", List.of());

                Map<String, Object> venue = venues.isEmpty() ? Map.of() : venues.get(0);
                Map<String, Object> city = venue.get("city") instanceof Map<?, ?> cityMap
                    ? (Map<String, Object>) cityMap
                    : Map.of();
                Map<String, Object> venueLocation = venue.get("location") instanceof Map<?, ?> locationMap
                    ? (Map<String, Object>) locationMap
                    : Map.of();
                Map<String, Object> priceRange = priceRanges.isEmpty() ? Map.of() : priceRanges.get(0);
                Double eventDistanceMeters = distanceMeters(
                    latitude,
                    longitude,
                    asDouble(venueLocation.get("latitude")),
                    asDouble(venueLocation.get("longitude")));

                results.add(new LiveEventResponse(
                    String.valueOf(event.getOrDefault("id", "")),
                    String.valueOf(event.getOrDefault("name", "Live event")),
                    String.valueOf(venue.getOrDefault("name", "")),
                    String.valueOf(city.getOrDefault("name", destination)),
                    buildStartDateTime(start),
                    bestImage(images),
                    String.valueOf(event.getOrDefault("url", "")),
                    asDouble(priceRange.get("min")),
                    String.valueOf(priceRange.getOrDefault("currency", "")),
                    eventDistanceMeters));
            }

            return results;
        } catch (RuntimeException exception) {
            logger.warn("Ticketmaster event lookup failed destination={} area={}", destination, area, exception);
            return List.of();
        }
    }

    private String resolvePhotoUrl(String photoName) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = googlePlacesClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/v1/" + photoName + "/media")
                .queryParam("maxWidthPx", 1400)
                .queryParam("skipHttpRedirect", true)
                .build())
            .header("X-Goog-Api-Key", googlePlacesApiKey)
            .retrieve()
            .body(Map.class);
        return response == null ? null : String.valueOf(response.getOrDefault("photoUri", ""));
    }

    private String buildStartDateTime(Map<String, Object> start) {
        String dateTime = String.valueOf(start.getOrDefault("dateTime", ""));
        if (!dateTime.isBlank()) {
            return dateTime;
        }
        String localDate = String.valueOf(start.getOrDefault("localDate", ""));
        String localTime = String.valueOf(start.getOrDefault("localTime", ""));
        if (!localDate.isBlank() && !localTime.isBlank()) {
            return localDate + "T" + localTime;
        }
        return localDate;
    }

    private String bestImage(List<Map<String, Object>> images) {
        return images.stream()
            .map(image -> String.valueOf(image.getOrDefault("url", "")))
            .filter(url -> !url.isBlank())
            .findFirst()
            .orElse("");
    }

    private Double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value instanceof String text) {
            try {
                return Double.parseDouble(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Double distanceMeters(Double originLatitude, Double originLongitude, Double targetLatitude, Double targetLongitude) {
        if (originLatitude == null || originLongitude == null || targetLatitude == null || targetLongitude == null) {
            return null;
        }

        double earthRadiusMeters = 6_371_000;
        double latDistance = Math.toRadians(targetLatitude - originLatitude);
        double lonDistance = Math.toRadians(targetLongitude - originLongitude);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(originLatitude))
            * Math.cos(Math.toRadians(targetLatitude))
            * Math.sin(lonDistance / 2)
            * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private String resolveBaseUrl(String configuredValue, String fallback) {
        return configuredValue == null || configuredValue.isBlank() ? fallback : configuredValue;
    }
}
