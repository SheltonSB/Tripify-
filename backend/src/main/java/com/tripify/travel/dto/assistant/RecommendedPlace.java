package com.tripify.travel.dto.assistant;

public record RecommendedPlace(
    String name,
    String category,
    double estimatedCost,
    Double distanceMeters,
    String provider,
    String reason) {
}
