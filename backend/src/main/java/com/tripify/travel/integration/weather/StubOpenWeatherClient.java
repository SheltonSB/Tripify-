package com.tripify.travel.integration.weather;

import com.tripify.travel.dto.weather.WeatherSnapshot;
import org.springframework.stereotype.Component;

@Component
public class StubOpenWeatherClient implements OpenWeatherClient {

    @Override
    public WeatherSnapshot fetchWeather(String city) {
        int hash = Math.abs(city.toLowerCase().hashCode());
        double temperature = 10 + (hash % 18);
        boolean alertActive = hash % 5 == 0;
        String summary = alertActive ? "Wind advisory in effect" : "Mild conditions with light clouds";
        return new WeatherSnapshot(city, summary, temperature, alertActive);
    }
}
