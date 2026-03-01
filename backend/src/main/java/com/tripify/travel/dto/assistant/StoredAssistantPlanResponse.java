package com.tripify.travel.dto.assistant;

import com.tripify.travel.model.AssistantPlan;
import java.time.Instant;
import java.util.List;

public record StoredAssistantPlanResponse(
    Long id,
    Long userId,
    Long tripId,
    String destination,
    String summary,
    Instant createdAt,
    List<AssistantStep> steps) {

    public static StoredAssistantPlanResponse fromEntity(AssistantPlan plan) {
        return new StoredAssistantPlanResponse(
            plan.getId(),
            plan.getUser().getId(),
            plan.getTrip().getId(),
            plan.getDestination(),
            plan.getSummary(),
            plan.getCreatedAt(),
            plan.getSteps().stream()
                .map(step -> new AssistantStep(step.getTitle(), step.getDescription(), step.getDayNumber()))
                .toList());
    }
}
