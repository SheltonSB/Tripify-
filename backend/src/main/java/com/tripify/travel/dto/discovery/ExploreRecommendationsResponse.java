package com.tripify.travel.dto.discovery;

import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.dto.weather.WeatherSnapshot;
import java.util.List;

public record ExploreRecommendationsResponse(
    String destination,
    String vibe,
    double budget,
    double fixedCost,
    double remainingBudget,
    WeatherSnapshot weather,
    List<PriceQuote> priceQuotes,
    List<RecommendedPlaceResponse> places) {
}
