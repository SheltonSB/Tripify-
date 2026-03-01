package com.tripify.travel.integration.amadeus;

import com.tripify.travel.dto.pricing.PriceQuote;
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
        if (!clientId.isBlank() && !clientSecret.isBlank()) {
            try {
                String token = fetchAccessToken();
                String originCode = resolveLocationCode(token, origin);
                String destinationCode = resolveLocationCode(token, destination);
                if (originCode != null && destinationCode != null) {
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
                    if (!data.isEmpty()) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> price = (Map<String, Object>) data.get(0).get("price");
                        String currency = String.valueOf(price.getOrDefault("currency", "USD"));
                        double amount = Double.parseDouble(String.valueOf(price.getOrDefault("total", "0")));
                        return List.of(
                            new PriceQuote("amadeus", "flight", currency, amount, originCode + "-" + destinationCode),
                            new PriceQuote("amadeus", "lodging", currency, 145 + (travelers * 28), destination + "-boutique"));
                    }
                }
            } catch (RuntimeException exception) {
                logger.warn("Amadeus pricing lookup failed origin={} destination={}, falling back to synthetic quote", origin, destination, exception);
            }
        }

        double base = 175 + (travelers * 94);
        return List.of(
            new PriceQuote("amadeus", "flight", "USD", base, origin + "-" + destination + "-economy"),
            new PriceQuote("amadeus", "lodging", "USD", 145 + (travelers * 28), destination + "-boutique"));
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
}
