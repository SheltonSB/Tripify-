package com.tripify.travel.dto.assistant;

import java.util.List;

public record AssistantPlanResponse(
    String destination,
    String summary,
    List<AssistantStep> steps) {
}
