package com.tripify.travel.integration.ai;

import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;

public interface AssistantClient {

    AssistantPlanResponse generatePlan(AssistantPlanRequest request);
}
