package com.tripify.travel.dto.discovery;

import com.tripify.travel.dto.places.PlaceCandidate;

public record RecommendedPlaceResponse(
    String name,
    String category,
    double estimatedCost,
    String provider,
    Double distanceMeters,
    String note) {

    public static RecommendedPlaceResponse fromPlace(PlaceCandidate place) {
        String note;
        if (place.distanceMeters() != null && place.distanceMeters() <= 2_000) {
            note = "Close by and easy to reach.";
        } else if (place.estimatedCost() <= 20) {
            note = "Budget-friendly option.";
        } else if (place.estimatedCost() <= 50) {
            note = "Balanced value for the price.";
        } else {
            note = "Higher-cost option, best if it strongly matches the trip vibe.";
        }

        return new RecommendedPlaceResponse(
            place.name(),
            place.category(),
            place.estimatedCost(),
            place.provider(),
            place.distanceMeters(),
            note);
    }
}
