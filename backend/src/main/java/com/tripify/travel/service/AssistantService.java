package com.tripify.travel.service;

import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;
import com.tripify.travel.service.port.AssistantServicePort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssistantService {

    private final AssistantServicePort assistantServicePort;

    public AssistantService(AssistantServicePort assistantServicePort) {
        this.assistantServicePort = assistantServicePort;
    }

    public AssistantPlanResponse buildPlan(AssistantPlanRequest request) {
        validateRequest(request);
        return assistantServicePort.buildPlan(request);
    }

    private void validateRequest(AssistantPlanRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (request.destination() == null || request.destination().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destination is required");
        }
        if (request.days() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Days must be greater than zero");
        }
        if (request.people() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "People must be greater than zero");
        }
    }
}
