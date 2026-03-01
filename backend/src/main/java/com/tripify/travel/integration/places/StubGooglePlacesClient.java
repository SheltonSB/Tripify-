package com.tripify.travel.integration.places;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Component
public class StubGooglePlacesClient implements GooglePlacesClient {

    private static final Logger logger = LoggerFactory.getLogger(StubGooglePlacesClient.class);

    private final RestClient restClient;
    private final String apiKey;

    public StubGooglePlacesClient(
        RestClient.Builder restClientBuilder,
        @Value("${tripify.providers.google-places.base-url:https://places.googleapis.com}") String baseUrl,
        @Value("${TRIPIFY_GOOGLE_PLACES_API_KEY:}") String apiKey) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    @Override
    public List<PlaceCandidate> searchPlaces(String city, String vibe) {
        if (!apiKey.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restClient.post()
                    .uri("/v1/places:searchText")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", "places.displayName,places.primaryTypeDisplayName,places.priceLevel")
                    .body(Map.of("textQuery", vibe + " activities in " + city))
                    .retrieve()
                    .body(Map.class);

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> places = response == null
                    ? List.of()
                    : (List<Map<String, Object>>) response.getOrDefault("places", List.of());
                if (!places.isEmpty()) {
                    return places.stream().limit(2).map(place -> {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> displayName = (Map<String, Object>) place.get("displayName");
                        @SuppressWarnings("unchecked")
                        Map<String, Object> primaryType = (Map<String, Object>) place.get("primaryTypeDisplayName");
                        String name = displayName == null ? city + " activity" : String.valueOf(displayName.getOrDefault("text", city + " activity"));
                        String category = primaryType == null ? "activity" : String.valueOf(primaryType.getOrDefault("text", "activity"));
                        double estimatedCost = place.get("priceLevel") instanceof Number priceLevel
                            ? priceLevel.doubleValue() * 15
                            : 0;
                        return new PlaceCandidate(name, category, vibe, estimatedCost, "google-places");
                    }).toList();
                }
            } catch (RuntimeException exception) {
                logger.warn("Google Places lookup failed for city={}, falling back to synthetic places", city, exception);
            }
        }

        return List.of(
            new PlaceCandidate(city + " Riverwalk", "sightseeing", vibe, 0, "google-places"),
            new PlaceCandidate(city + " Food Hall", "dining", vibe, 28, "google-places"));
    }
}
