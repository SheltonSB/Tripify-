package com.tripify.travel.service.port;

import com.tripify.travel.dto.weather.WeatherSnapshot;

public interface WeatherServicePort {

    WeatherSnapshot getCurrentWeather(String city);
}
