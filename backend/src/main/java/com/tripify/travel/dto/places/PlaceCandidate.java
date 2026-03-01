package com.tripify.travel.dto.places;

public record PlaceCandidate(
    String name,
    String category,
    String vibe,
    double estimatedCost,
    String provider,
    Double distanceMeters,
    Double latitude,
    Double longitude) {
}
