package com.tripify.travel.integration.weather;

import com.tripify.travel.dto.weather.WeatherSnapshot;

public interface OpenWeatherClient {

    WeatherSnapshot fetchWeather(String city);
}
