package com.tripify.travel.integration.weather;

import com.tripify.travel.dto.weather.WeatherSnapshot;
import java.util.List;
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
        @Value("${tripify.providers.openweather.base-url:https://api.openweathermap.org}") String baseUrl,
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
                        .path("/data/2.5/weather")
                        .queryParam("q", city)
                        .queryParam("appid", apiKey)
                        .queryParam("units", "metric")
                        .build())
                    .retrieve()
                    .body(Map.class);

                if (response != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> weather = (List<Map<String, Object>>) response.get("weather");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> main = (Map<String, Object>) response.get("main");
                    String summary = weather != null && !weather.isEmpty()
                        ? String.valueOf(weather.get(0).getOrDefault("description", "Current conditions"))
                        : "Current conditions";
                    double temperature = main != null && main.get("temp") instanceof Number temp
                        ? temp.doubleValue()
                        : 0;
                    boolean alertActive = summary.toLowerCase().contains("storm")
                        || summary.toLowerCase().contains("snow")
                        || summary.toLowerCase().contains("rain");
                    return new WeatherSnapshot(city, summary, temperature, alertActive);
                }
            } catch (RuntimeException exception) {
                logger.warn("OpenWeather lookup failed for city={}, falling back to synthetic weather", city, exception);
            }
        }

        int hash = Math.abs(city.toLowerCase().hashCode());
        double temperature = 10 + (hash % 18);
        boolean alertActive = hash % 5 == 0;
        String summary = alertActive ? "Wind advisory in effect" : "Mild conditions with light clouds";
        return new WeatherSnapshot(city, summary, temperature, alertActive);
    }
}
