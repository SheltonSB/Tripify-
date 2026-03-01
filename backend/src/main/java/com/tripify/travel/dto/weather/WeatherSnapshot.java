package com.tripify.travel.dto.weather;

public record WeatherSnapshot(
    String city,
    String summary,
    double temperatureCelsius,
    boolean alertActive) {
}
