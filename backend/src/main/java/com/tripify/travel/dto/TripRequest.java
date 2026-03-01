package com.tripify.travel.dto;

public record TripRequest(Long userId, String location, double budget, int days, int people) {
}
