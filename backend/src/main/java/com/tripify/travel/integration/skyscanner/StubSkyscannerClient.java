package com.tripify.travel.integration.skyscanner;

import com.tripify.travel.dto.pricing.PriceQuote;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class StubSkyscannerClient implements SkyscannerClient {

    private static final Logger logger = LoggerFactory.getLogger(StubSkyscannerClient.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String apiHost;
    private final String searchPath;

    public StubSkyscannerClient(
        RestClient.Builder restClientBuilder,
        @Value("${tripify.providers.skyscanner.base-url:https://partners.api.skyscanner.net}") String baseUrl,
        @Value("${tripify.providers.skyscanner.search-path:/apiservices/v3/flights/indicative/search}") String searchPath,
        @Value("${TRIPIFY_SKYSCANNER_API_KEY:}") String apiKey,
        @Value("${TRIPIFY_SKYSCANNER_API_HOST:}") String apiHost) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.searchPath = searchPath;
        this.apiKey = apiKey;
        this.apiHost = apiHost;
    }

    @Override
    public List<PriceQuote> searchTravelCosts(String origin, String destination, int travelers) {
        if (!apiKey.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restClient.post()
                    .uri(searchPath)
                    .headers(headers -> {
                        headers.set("x-api-key", apiKey);
                        if (!apiHost.isBlank()) {
                            headers.set("x-rapidapi-host", apiHost);
                        }
                    })
                    .body(buildRequest(origin, destination, travelers))
                    .retrieve()
                    .body(Map.class);

                Double amount = findAmount(response);
                if (amount != null) {
                    String currency = findCurrency(response);
                    return List.of(
                        new PriceQuote("skyscanner", "flight", currency, amount, origin + "-" + destination + "-live"),
                        new PriceQuote("skyscanner", "lodging", currency, 132 + (travelers * 24), destination + "-central"));
                }
            } catch (RuntimeException exception) {
                logger.warn(
                    "Skyscanner pricing lookup failed origin={} destination={}, falling back to synthetic quote",
                    origin,
                    destination,
                    exception);
            }
        }

        double base = 160 + (travelers * 102);
        return List.of(
            new PriceQuote("skyscanner", "flight", "USD", base, origin + "-" + destination + "-best"),
            new PriceQuote("skyscanner", "lodging", "USD", 132 + (travelers * 24), destination + "-central"));
    }

    private Map<String, Object> buildRequest(String origin, String destination, int travelers) {
        return Map.of(
            "query", Map.of(
                "market", "US",
                "locale", "en-US",
                "currency", "USD",
                "adults", travelers,
                "queryLegs", List.of(Map.of(
                    "originPlace", Map.of("name", origin),
                    "destinationPlace", Map.of("name", destination)))));
    }

    private Double findAmount(Object value) {
        if (value instanceof Number number) {
            double amount = number.doubleValue();
            return amount > 0 ? amount : null;
        }
        if (value instanceof Map<?, ?> map) {
            Object amountValue = map.get("amount");
            if (amountValue instanceof Number amountNumber && amountNumber.doubleValue() > 0) {
                return amountNumber.doubleValue();
            }
            Object minPriceValue = map.get("minPrice");
            Double minPrice = findAmount(minPriceValue);
            if (minPrice != null) {
                return minPrice;
            }
            Object priceValue = map.get("price");
            Double price = findAmount(priceValue);
            if (price != null) {
                return price;
            }
            Object rawPriceValue = map.get("rawPrice");
            Double rawPrice = findAmount(rawPriceValue);
            if (rawPrice != null) {
                return rawPrice;
            }
            for (Object nested : map.values()) {
                Double nestedAmount = findAmount(nested);
                if (nestedAmount != null) {
                    return nestedAmount;
                }
            }
        }
        if (value instanceof List<?> list) {
            for (Object item : list) {
                Double amount = findAmount(item);
                if (amount != null) {
                    return amount;
                }
            }
        }
        return null;
    }

    private String findCurrency(Object value) {
        if (value instanceof Map<?, ?> map) {
            Object directCurrency = map.get("currency");
            if (directCurrency != null && !String.valueOf(directCurrency).isBlank()) {
                return String.valueOf(directCurrency);
            }
            Object currencyCode = map.get("currencyCode");
            if (currencyCode != null && !String.valueOf(currencyCode).isBlank()) {
                return String.valueOf(currencyCode);
            }
            for (Object nested : map.values()) {
                String nestedCurrency = findCurrency(nested);
                if (nestedCurrency != null) {
                    return nestedCurrency;
                }
            }
        }
        if (value instanceof List<?> list) {
            for (Object item : list) {
                String currency = findCurrency(item);
                if (currency != null) {
                    return currency;
                }
            }
        }
        return "USD";
    }
}
