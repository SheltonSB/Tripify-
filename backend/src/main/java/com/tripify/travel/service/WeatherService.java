package com.tripify.travel.service;

import com.tripify.travel.dto.weather.WeatherSnapshot;
import com.tripify.travel.integration.weather.OpenWeatherClient;
import com.tripify.travel.service.port.WeatherServicePort;
import org.springframework.stereotype.Service;

@Service
public class WeatherService implements WeatherServicePort {

    private final OpenWeatherClient openWeatherClient;

    public WeatherService(OpenWeatherClient openWeatherClient) {
        this.openWeatherClient = openWeatherClient;
    }

    @Override
    public WeatherSnapshot getCurrentWeather(String city) {
        return openWeatherClient.fetchWeather(city);
    }
}
