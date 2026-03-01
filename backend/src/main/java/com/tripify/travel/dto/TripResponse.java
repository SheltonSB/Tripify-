package com.tripify.travel.dto;

import com.tripify.travel.model.Trip;

public record TripResponse(
    Long id,
    Long userId,
    String location,
    double budget,
    int days,
    int people,
    boolean confirmed) {

    public static TripResponse fromEntity(Trip trip) {
        return new TripResponse(
            trip.getId(),
            trip.getUser() != null ? trip.getUser().getId() : null,
            trip.getLocation(),
            trip.getBudget(),
            trip.getDays(),
            trip.getPeople(),
            trip.isConfirmed());
    }
}
