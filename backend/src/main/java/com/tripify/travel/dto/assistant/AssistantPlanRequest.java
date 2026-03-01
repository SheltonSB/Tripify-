package com.tripify.travel.dto.assistant;

import com.tripify.travel.dto.places.PlaceCandidate;
import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.dto.weather.WeatherSnapshot;
import java.util.List;

public record AssistantPlanRequest(
    Long userId,
    Long tripId,
    String destination,
    double budget,
    int days,
    int people,
    String prompt,
    String origin,
    String vibe,
    List<PriceQuote> priceQuotes,
    WeatherSnapshot weather,
    List<PlaceCandidate> places) {
}
