package com.tripify.travel.integration.weather;

import com.tripify.travel.dto.weather.WeatherSnapshot;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class StubOpenWeatherClient implements OpenWeatherClient {

    private static final Logger logger = LoggerFactory.getLogger(StubOpenWeatherClient.class);

    private final RestClient restClient;
    private final String apiKey;

    public StubOpenWeatherClient(
        RestClient.Builder restClientBuilder,
        @Value("${tripify.providers.openweather.base-url:https://api.weatherapi.com}") String baseUrl,
        @Value("${TRIPIFY_OPENWEATHER_API_KEY:}") String apiKey) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    @Override
    public WeatherSnapshot fetchWeather(String city) {
        if (!apiKey.isBlank()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                        .path("/v1/current.json")
                        .queryParam("q", city)
                        .queryParam("key", apiKey)
                        .queryParam("aqi", "no")
                        .build())
                    .retrieve()
                    .body(Map.class);

                if (response != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> current = (Map<String, Object>) response.get("current");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> condition = current == null ? null : (Map<String, Object>) current.get("condition");
                    String summary = condition == null
                        ? "Current conditions"
                        : String.valueOf(condition.getOrDefault("text", "Current conditions"));
                    double temperature = current != null && current.get("temp_c") instanceof Number temp
                        ? temp.doubleValue()
                        : 0;
                    String normalized = summary.toLowerCase();
                    boolean alertActive = normalized.contains("storm")
                        || normalized.contains("snow")
                        || normalized.contains("rain")
                        || normalized.contains("thunder")
                        || normalized.contains("ice");
                    return new WeatherSnapshot(city, summary, temperature, alertActive);
                }
            } catch (RuntimeException exception) {
                logger.warn("WeatherAPI lookup failed for city={}, returning no live weather", city, exception);
            }
        }

        return null;
    }
}
