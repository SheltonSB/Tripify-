package com.tripify.travel.integration.places;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
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
    public List<PlaceCandidate> searchPlaces(String city, String vibe, Double latitude, Double longitude) {
        if (!apiKey.isBlank()) {
            try {
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("textQuery", buildQuery(city, vibe));
                if (latitude != null && longitude != null) {
                    payload.put("locationBias", Map.of(
                        "circle", Map.of(
                            "center", Map.of("latitude", latitude, "longitude", longitude),
                            "radius", 25000.0)));
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> response = restClient.post()
                    .uri("/v1/places:searchText")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", "places.displayName,places.primaryTypeDisplayName,places.priceLevel,places.location")
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> places = response == null
                    ? List.of()
                    : (List<Map<String, Object>>) response.getOrDefault("places", List.of());
                if (!places.isEmpty()) {
                    return places.stream().limit(4).map(place -> {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> displayName = (Map<String, Object>) place.get("displayName");
                        @SuppressWarnings("unchecked")
                        Map<String, Object> primaryType = (Map<String, Object>) place.get("primaryTypeDisplayName");
                        String name = displayName == null ? city + " activity" : String.valueOf(displayName.getOrDefault("text", city + " activity"));
                        String category = primaryType == null ? "activity" : String.valueOf(primaryType.getOrDefault("text", "activity"));
                        @SuppressWarnings("unchecked")
                        Map<String, Object> location = (Map<String, Object>) place.get("location");
                        double estimatedCost = estimateActivityCost(category, place.get("priceLevel"));
                        Double distanceMeters = distanceMeters(latitude, longitude, location);
                        Double placeLatitude = asDouble(location == null ? null : location.get("latitude"));
                        Double placeLongitude = asDouble(location == null ? null : location.get("longitude"));
                        return new PlaceCandidate(name, category, vibe, estimatedCost, "google-places", distanceMeters, placeLatitude, placeLongitude);
                    }).toList();
                }
            } catch (RuntimeException exception) {
                logger.warn("Google Places lookup failed for city={}, returning no live places", city, exception);
            }
        }

        return List.of();
    }

    private String buildQuery(String city, String vibe) {
        String normalized = vibe == null ? "" : vibe.toLowerCase();

        if (normalized.contains("food")) {
            return "best restaurants, cafes, and food markets in " + city;
        }

        if (normalized.contains("music") || normalized.contains("night")) {
            return "top live music venues, cocktail bars, and nightlife in " + city;
        }

        if (normalized.contains("family")) {
            return "top family-friendly attractions and activities in " + city;
        }

        if (normalized.contains("luxury")) {
            return "top upscale attractions, fine dining, and premium experiences in " + city;
        }

        return "top attractions, restaurants, and things to do in " + city;
    }

    private double estimateActivityCost(String category, Object priceLevelValue) {
        double base = switch (mapPriceLevel(priceLevelValue)) {
            case 0 -> 0;
            case 1 -> 15;
            case 2 -> 35;
            case 3 -> 70;
            case 4 -> 120;
            default -> 20;
        };

        String normalizedCategory = category == null ? "" : category.toLowerCase();
        if (normalizedCategory.contains("museum") || normalizedCategory.contains("gallery")) {
            return base == 0 ? 12 : base * 0.8;
        }
        if (normalizedCategory.contains("amusement") || normalizedCategory.contains("theme park")) {
            return Math.max(base, 55);
        }
        if (normalizedCategory.contains("tour") || normalizedCategory.contains("activity")) {
            return Math.max(base, 25);
        }
        if (normalizedCategory.contains("restaurant") || normalizedCategory.contains("food") || normalizedCategory.contains("cafe")) {
            return Math.max(base, 18);
        }
        return base;
    }

    private int mapPriceLevel(Object priceLevelValue) {
        if (priceLevelValue instanceof Number number) {
            return number.intValue();
        }
        if (priceLevelValue instanceof String text) {
            return switch (text) {
                case "PRICE_LEVEL_FREE" -> 0;
                case "PRICE_LEVEL_INEXPENSIVE" -> 1;
                case "PRICE_LEVEL_MODERATE" -> 2;
                case "PRICE_LEVEL_EXPENSIVE" -> 3;
                case "PRICE_LEVEL_VERY_EXPENSIVE" -> 4;
                default -> 1;
            };
        }
        return 1;
    }

    private Double distanceMeters(Double latitude, Double longitude, Map<String, Object> location) {
        if (latitude == null || longitude == null || location == null) {
            return null;
        }

        Double placeLatitude = asDouble(location.get("latitude"));
        Double placeLongitude = asDouble(location.get("longitude"));
        if (placeLatitude == null || placeLongitude == null) {
            return null;
        }

        double earthRadiusMeters = 6_371_000;
        double latDistance = Math.toRadians(placeLatitude - latitude);
        double lonDistance = Math.toRadians(placeLongitude - longitude);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(latitude))
            * Math.cos(Math.toRadians(placeLatitude))
            * Math.sin(lonDistance / 2)
            * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
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
}
