package com.tripify.travel.integration.places;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.ArrayList;
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
                        return new PlaceCandidate(name, category, vibe, estimatedCost, "google-places", distanceMeters);
                    }).toList();
                }
            } catch (RuntimeException exception) {
                logger.warn("Google Places lookup failed for city={}, falling back to synthetic places", city, exception);
            }
        }

        return fallbackPlaces(city, vibe);
    }

    private List<PlaceCandidate> fallbackPlaces(String city, String vibe) {
        String normalizedCity = city == null ? "" : city.trim().toLowerCase();
        String normalizedVibe = vibe == null ? "" : vibe.trim().toLowerCase();
        String safeCity = city == null || city.isBlank() ? "Destination" : city.trim();

        if (normalizedCity.contains("antarctica")) {
            return List.of(
                new PlaceCandidate("Antarctica Research Visitor Centre", "education", vibe, 12, "synthetic-fallback", 900.0),
                new PlaceCandidate("Polar Observation Deck", "sightseeing", vibe, 18, "synthetic-fallback", 1600.0),
                new PlaceCandidate("Polar History Exhibit", "museum", vibe, 10, "synthetic-fallback", 2400.0),
                new PlaceCandidate("Ice Shelf Scenic Point", "outdoor", vibe, 0, "synthetic-fallback", 4200.0));
        }

        if (normalizedCity.contains("kyoto")) {
            return fallbackFromTemplates(vibe, List.of(
                new FallbackTemplate("Fushimi Inari Shrine Path", "historic", 0),
                new FallbackTemplate("Nishiki Market Tastings", "dining", 24),
                new FallbackTemplate("Kiyomizu-dera District Walk", "sightseeing", 16),
                new FallbackTemplate("Arashiyama Bamboo Grove", "outdoor", 0)), safeCity);
        }

        if (normalizedCity.contains("chicago")) {
            return fallbackFromTemplates(vibe, List.of(
                new FallbackTemplate("Art Institute of Chicago", "museum", 32),
                new FallbackTemplate("West Loop Food Crawl", "dining", 28),
                new FallbackTemplate("Architecture River Cruise", "tour", 44),
                new FallbackTemplate("Millennium Park Loop", "outdoor", 0)), safeCity);
        }

        if (normalizedCity.contains("london")) {
            return fallbackFromTemplates(vibe, List.of(
                new FallbackTemplate("British Museum Visit", "museum", 0),
                new FallbackTemplate("Borough Market Bites", "dining", 24),
                new FallbackTemplate("South Bank Walk", "sightseeing", 0),
                new FallbackTemplate("Tower Bridge & Riverside", "historic", 14)), safeCity);
        }

        if (normalizedVibe.contains("food")) {
            return fallbackFromTemplates(vibe, List.of(
                new FallbackTemplate(safeCity + " Local Market", "dining", 22),
                new FallbackTemplate(safeCity + " Street Food Hall", "dining", 26),
                new FallbackTemplate(safeCity + " Chef Counter", "restaurant", 38),
                new FallbackTemplate(safeCity + " Coffee & Bakery Trail", "cafe", 16)), safeCity);
        }

        if (normalizedVibe.contains("night")) {
            return fallbackFromTemplates(vibe, List.of(
                new FallbackTemplate(safeCity + " Live Music Venue", "nightlife", 32),
                new FallbackTemplate(safeCity + " Rooftop Lounge", "drinks", 36),
                new FallbackTemplate(safeCity + " Sunset District Walk", "sightseeing", 0),
                new FallbackTemplate(safeCity + "Late Bistro", "restaurant", 30)), safeCity);
        }

        if (normalizedVibe.contains("family")) {
            return fallbackFromTemplates(vibe, List.of(
                new FallbackTemplate(safeCity + " Science Center", "family", 20),
                new FallbackTemplate(safeCity + " Family Park", "outdoor", 8),
                new FallbackTemplate(safeCity + " Children's Museum", "museum", 18),
                new FallbackTemplate(safeCity + " Urban Aquarium", "education", 26)), safeCity);
        }

        return fallbackFromTemplates(vibe, List.of(
            new FallbackTemplate(safeCity + " Cultural Center", "activity", 15),
            new FallbackTemplate(safeCity + " Historic District Walk", "sightseeing", 10),
            new FallbackTemplate(safeCity + " Central Museum", "museum", 18),
            new FallbackTemplate(safeCity + " Community Food Court", "dining", 20)), safeCity);
    }

    private List<PlaceCandidate> fallbackFromTemplates(String vibe, List<FallbackTemplate> templates, String city) {
        List<PlaceCandidate> candidates = new ArrayList<>();
        int seed = Math.abs((city == null ? "" : city.toLowerCase()).hashCode());
        for (int index = 0; index < templates.size(); index++) {
            FallbackTemplate template = templates.get(index);
            double distance = estimateFallbackDistance(seed, index);
            candidates.add(new PlaceCandidate(
                template.name(),
                template.category(),
                vibe,
                template.estimatedCost(),
                "synthetic-fallback",
                distance));
        }
        return candidates;
    }

    private double estimateFallbackDistance(int seed, int index) {
        int base = 650 + ((seed + (index * 997)) % 5200);
        return (double) base;
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

    private record FallbackTemplate(String name, String category, double estimatedCost) {
    }
}
