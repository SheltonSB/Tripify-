package com.tripify.travel.service.port;

import com.tripify.travel.dto.assistant.AssistantChatRequest;
import com.tripify.travel.dto.assistant.AssistantChatResponse;
import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;

public interface AssistantServicePort {

    AssistantPlanResponse buildPlan(AssistantPlanRequest request);

    AssistantChatResponse chat(AssistantChatRequest request);
}
