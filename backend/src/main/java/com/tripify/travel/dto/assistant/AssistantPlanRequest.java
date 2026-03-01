package com.tripify.travel.dto.assistant;

public record AssistantPlanRequest(
    Long userId,
    Long tripId,
    String destination,
    double budget,
    int days,
    int people,
    String prompt) {
}
