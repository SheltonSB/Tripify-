package com.tripify.travel.integration.amadeus;

import com.tripify.travel.dto.pricing.PriceQuote;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class StubAmadeusClient implements AmadeusClient {

    private static final Logger logger = LoggerFactory.getLogger(StubAmadeusClient.class);

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;

    public StubAmadeusClient(
        RestClient.Builder restClientBuilder,
        @Value("${tripify.providers.amadeus.base-url:https://test.api.amadeus.com}") String baseUrl,
        @Value("${TRIPIFY_AMADEUS_CLIENT_ID:}") String clientId,
        @Value("${TRIPIFY_AMADEUS_CLIENT_SECRET:}") String clientSecret) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public List<PriceQuote> searchTravelCosts(String origin, String destination, int travelers) {
        double fallbackFlightAmount = 175 + (travelers * 94);
        double fallbackHotelAmount = 145 + (travelers * 28);

        if (!clientId.isBlank() && !clientSecret.isBlank()) {
            try {
                String token = fetchAccessToken();
                String originCode = resolveLocationCode(token, origin);
                String destinationCode = resolveLocationCode(token, destination);
                PriceQuote flightQuote = originCode != null && destinationCode != null
                    ? fetchFlightQuote(token, originCode, destinationCode)
                    : null;
                PriceQuote hotelQuote = destinationCode != null
                    ? fetchHotelQuote(token, destinationCode, travelers)
                    : null;

                List<PriceQuote> liveQuotes = new ArrayList<>();
                liveQuotes.add(flightQuote != null
                    ? flightQuote
                    : new PriceQuote("amadeus", "flight", "USD", fallbackFlightAmount, origin + "-" + destination + "-economy"));
                liveQuotes.add(hotelQuote != null
                    ? hotelQuote
                    : new PriceQuote("amadeus", "hotel", "USD", fallbackHotelAmount, destination + "-standard"));
                return liveQuotes;
            } catch (RuntimeException exception) {
                logger.warn("Amadeus pricing lookup failed origin={} destination={}, falling back to synthetic quote", origin, destination, exception);
            }
        }

        return List.of(
            new PriceQuote("amadeus", "flight", "USD", fallbackFlightAmount, origin + "-" + destination + "-economy"),
            new PriceQuote("amadeus", "hotel", "USD", fallbackHotelAmount, destination + "-standard"));
    }

    private String fetchAccessToken() {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
            .uri("/v1/security/oauth2/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body("grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret)
            .retrieve()
            .body(Map.class);
        return response == null ? null : String.valueOf(response.get("access_token"));
    }

    private String resolveLocationCode(String token, String query) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/v1/reference-data/locations")
                .queryParam("keyword", query)
                .queryParam("subType", "CITY,AIRPORT")
                .queryParam("page[limit]", 1)
                .build())
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(Map.class);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = response == null
            ? List.of()
            : (List<Map<String, Object>>) response.getOrDefault("data", List.of());
        if (data.isEmpty()) {
            return null;
        }
        Object iataCode = data.get(0).get("iataCode");
        return iataCode == null ? null : String.valueOf(iataCode);
    }

    private PriceQuote fetchFlightQuote(String token, String originCode, String destinationCode) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/v1/shopping/flight-dates")
                .queryParam("origin", originCode)
                .queryParam("destination", destinationCode)
                .queryParam("oneWay", true)
                .build())
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(Map.class);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = response == null
            ? List.of()
            : (List<Map<String, Object>>) response.getOrDefault("data", List.of());
        if (data.isEmpty()) {
            return null;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> price = (Map<String, Object>) data.get(0).get("price");
        if (price == null) {
            return null;
        }

        String currency = String.valueOf(price.getOrDefault("currency", "USD"));
        double amount = Double.parseDouble(String.valueOf(price.getOrDefault("total", "0")));
        return new PriceQuote("amadeus", "flight", currency, amount, originCode + "-" + destinationCode);
    }

    private PriceQuote fetchHotelQuote(String token, String destinationCode, int travelers) {
        @SuppressWarnings("unchecked")
        Map<String, Object> hotelDirectoryResponse = restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/v1/reference-data/locations/hotels/by-city")
                .queryParam("cityCode", destinationCode)
                .build())
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(Map.class);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> hotels = hotelDirectoryResponse == null
            ? List.of()
            : (List<Map<String, Object>>) hotelDirectoryResponse.getOrDefault("data", List.of());
        if (hotels.isEmpty()) {
            return null;
        }

        String hotelIds = hotels.stream()
            .limit(3)
            .map(hotel -> String.valueOf(hotel.getOrDefault("hotelId", "")))
            .filter(id -> !id.isBlank())
            .reduce((left, right) -> left + "," + right)
            .orElse("");
        if (hotelIds.isBlank()) {
            return null;
        }

        LocalDate checkInDate = LocalDate.now().plusWeeks(2);
        LocalDate checkOutDate = checkInDate.plusDays(1);

        @SuppressWarnings("unchecked")
        Map<String, Object> offersResponse = restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/v3/shopping/hotel-offers")
                .queryParam("hotelIds", hotelIds)
                .queryParam("adults", Math.max(travelers, 1))
                .queryParam("roomQuantity", 1)
                .queryParam("checkInDate", checkInDate)
                .queryParam("checkOutDate", checkOutDate)
                .queryParam("bestRateOnly", true)
                .build())
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(Map.class);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> offerHotels = offersResponse == null
            ? List.of()
            : (List<Map<String, Object>>) offersResponse.getOrDefault("data", List.of());
        if (offerHotels.isEmpty()) {
            return null;
        }

        Map<String, Object> hotelEntry = offerHotels.get(0);
        @SuppressWarnings("unchecked")
        Map<String, Object> hotel = (Map<String, Object>) hotelEntry.getOrDefault("hotel", Map.of());
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> offers = (List<Map<String, Object>>) hotelEntry.getOrDefault("offers", List.of());
        if (offers.isEmpty()) {
            return null;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> price = (Map<String, Object>) offers.get(0).get("price");
        if (price == null) {
            return null;
        }

        String hotelName = String.valueOf(hotel.getOrDefault("name", destinationCode + "-hotel"));
        String currency = String.valueOf(price.getOrDefault("currency", "USD"));
        double amount = Double.parseDouble(String.valueOf(price.getOrDefault("total", "0")));
        return new PriceQuote("amadeus", "hotel", currency, amount, hotelName);
    }
}
