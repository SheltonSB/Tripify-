package com.tripify.travel.service.port;

import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;

public interface AssistantServicePort {

    AssistantPlanResponse buildPlan(AssistantPlanRequest request);
}
