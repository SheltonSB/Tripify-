package com.tripify.travel.integration.places;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class StubYelpClient implements YelpClient {

    private static final Logger logger = LoggerFactory.getLogger(StubYelpClient.class);

    private final RestClient restClient;
    private final String apiKey;

    public StubYelpClient(
        RestClient.Builder restClientBuilder,
        @Value("${tripify.providers.yelp.base-url:https://api.yelp.com}") String baseUrl,
        @Value("${TRIPIFY_YELP_API_KEY:}") String apiKey) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    @Override
    public List<PlaceCandidate> searchPlaces(String city, String vibe) {
        if (!apiKey.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                        .path("/v3/businesses/search")
                        .queryParam("location", city)
                        .queryParam("term", vibe)
                        .queryParam("limit", 2)
                        .build())
                    .header("Authorization", "Bearer " + apiKey)
                    .retrieve()
                    .body(Map.class);

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> businesses = response == null
                    ? List.of()
                    : (List<Map<String, Object>>) response.getOrDefault("businesses", List.of());
                if (!businesses.isEmpty()) {
                    return businesses.stream().limit(2).map(business -> {
                        String name = String.valueOf(business.getOrDefault("name", city + " activity"));
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> categories = (List<Map<String, Object>>) business.getOrDefault("categories", List.of());
                        String category = categories.isEmpty()
                            ? "activity"
                            : String.valueOf(categories.get(0).getOrDefault("title", "activity"));
                        double estimatedCost = business.get("price") instanceof String price
                            ? price.length() * 15
                            : 25;
                        return new PlaceCandidate(name, category, vibe, estimatedCost, "yelp");
                    }).toList();
                }
            } catch (RuntimeException exception) {
                logger.warn("Yelp lookup failed for city={}, falling back to synthetic places", city, exception);
            }
        }

        return List.of(
            new PlaceCandidate(city + " Jazz Bar", "nightlife", vibe, 35, "yelp"),
            new PlaceCandidate(city + " Rooftop Lounge", "drinks", vibe, 42, "yelp"));
    }
}
