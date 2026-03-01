package com.tripify.travel.integration.ai;

import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;
import com.tripify.travel.exception.IntegrationException;
import com.tripify.travel.service.port.AssistantServicePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class FastApiAssistantClient implements AssistantClient, AssistantServicePort {

    private final RestClient restClient;

    public FastApiAssistantClient(
        RestClient.Builder restClientBuilder,
        @Value("${tripify.ai.base-url:http://localhost:8001}") String baseUrl) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
    }

    @Override
    public AssistantPlanResponse buildPlan(AssistantPlanRequest request) {
        return generatePlan(request);
    }

    @Override
    public AssistantPlanResponse generatePlan(AssistantPlanRequest request) {
        try {
            AssistantPlanResponse response = restClient.post()
                .uri("/internal/assistant/plan")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(AssistantPlanResponse.class);

            if (response == null) {
                throw new IntegrationException("AI service returned an empty response");
            }

            return response;
        } catch (RestClientException exception) {
            throw new IntegrationException("AI planning service is unavailable", exception);
        }
    }
}
