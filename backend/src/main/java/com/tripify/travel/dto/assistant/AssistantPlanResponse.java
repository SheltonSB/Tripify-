package com.tripify.travel.dto.assistant;

import com.tripify.travel.dto.pricing.PriceQuote;
import java.util.List;

public record AssistantPlanResponse(
    String destination,
    String summary,
    List<AssistantStep> steps,
    List<RecommendedPlace> recommendations,
    List<PriceQuote> priceQuotes,
    Double fixedCost,
    Double remainingBudget) {
}
