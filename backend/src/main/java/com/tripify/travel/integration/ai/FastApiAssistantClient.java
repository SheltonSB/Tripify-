package com.tripify.travel.integration.ai;

import com.tripify.travel.dto.assistant.AssistantChatRequest;
import com.tripify.travel.dto.assistant.AssistantChatResponse;
import io.micrometer.core.instrument.MeterRegistry;
import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;
import com.tripify.travel.exception.IntegrationException;
import com.tripify.travel.service.AiErrorTracker;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import com.tripify.travel.service.port.AssistantServicePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
public class FastApiAssistantClient implements AssistantClient, AssistantServicePort {

    private static final Logger logger = LoggerFactory.getLogger(FastApiAssistantClient.class);

    private final RestClient restClient;
    private final MeterRegistry meterRegistry;
    private final AiErrorTracker aiErrorTracker;

    public FastApiAssistantClient(
        RestClient.Builder restClientBuilder,
        MeterRegistry meterRegistry,
        AiErrorTracker aiErrorTracker,
        @Value("${tripify.ai.base-url:http://localhost:8001}") String baseUrl) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.meterRegistry = meterRegistry;
        this.aiErrorTracker = aiErrorTracker;
    }

    @Override
    public AssistantPlanResponse buildPlan(AssistantPlanRequest request) {
        return generatePlan(request);
    }

    @Override
    public AssistantChatResponse chat(AssistantChatRequest request) {
        try {
            AssistantChatResponse response = restClient.post()
                .uri("/internal/assistant/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(toChatPayload(request))
                .retrieve()
                .body(AssistantChatResponse.class);

            if (response == null) {
                throw new IntegrationException("AI chat returned an empty response");
            }
            return response;
        } catch (RestClientResponseException exception) {
            throw new IntegrationException(
                "AI chat service returned " + exception.getStatusCode() + ": " + exception.getResponseBodyAsString(),
                exception);
        } catch (RestClientException exception) {
            throw new IntegrationException("AI chat service is unavailable", exception);
        }
    }

    @Override
    public AssistantPlanResponse generatePlan(AssistantPlanRequest request) {
        long startTime = System.nanoTime();
        logger.info(
            "Dispatching AI request userId={} tripId={} destination={} quotes={} places={} weather={}",
            request.userId(),
            request.tripId(),
            request.destination(),
            request.priceQuotes() == null ? 0 : request.priceQuotes().size(),
            request.places() == null ? 0 : request.places().size(),
            request.weather() != null ? request.weather().summary() : "none");
        try {
            AssistantPlanResponse response = restClient.post()
                .uri("/internal/assistant/plan")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(toPayload(request))
                .retrieve()
                .body(AssistantPlanResponse.class);

            if (response == null) {
                throw new IntegrationException("AI service returned an empty response");
            }

            recordMetrics("success", startTime);
            logger.info(
                "AI response received tripId={} destination={} steps={} summaryLength={}",
                request.tripId(),
                response.destination(),
                response.steps().size(),
                response.summary() == null ? 0 : response.summary().length());
            return response;
        } catch (RestClientResponseException exception) {
            recordFailure("http_error", startTime, request, exception);
            throw new IntegrationException(
                "AI planning service returned " + exception.getStatusCode() + ": " + exception.getResponseBodyAsString(),
                exception);
        } catch (RestClientException exception) {
            recordFailure("transport_error", startTime, request, exception);
            throw new IntegrationException("AI planning service is unavailable", exception);
        }
    }

    private Map<String, Object> toPayload(AssistantPlanRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", request.userId());
        if (request.tripId() != null) {
            payload.put("tripId", request.tripId());
        }
        payload.put("destination", request.destination());
        payload.put("budget", request.budget());
        payload.put("days", request.days());
        payload.put("people", request.people());
        payload.put("prompt", request.prompt() == null ? "" : request.prompt());
        if (request.origin() != null) {
            payload.put("origin", request.origin());
        }
        if (request.latitude() != null) {
            payload.put("latitude", request.latitude());
        }
        if (request.longitude() != null) {
            payload.put("longitude", request.longitude());
        }
        if (request.vibe() != null) {
            payload.put("vibe", request.vibe());
        }
        if (request.priceQuotes() != null && !request.priceQuotes().isEmpty()) {
            payload.put("priceQuotes", request.priceQuotes());
        }
        if (request.weather() != null) {
            payload.put("weather", request.weather());
        }
        if (request.places() != null && !request.places().isEmpty()) {
            payload.put("places", request.places());
        }
        return payload;
    }

    private Map<String, Object> toChatPayload(AssistantChatRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("destination", request.destination());
        payload.put("message", request.message());
        if (request.userId() != null) {
            payload.put("userId", request.userId());
        }
        if (request.areaName() != null && !request.areaName().isBlank()) {
            payload.put("areaName", request.areaName());
        }
        if (request.vibe() != null && !request.vibe().isBlank()) {
            payload.put("vibe", request.vibe());
        }
        if (request.latitude() != null) {
            payload.put("latitude", request.latitude());
        }
        if (request.longitude() != null) {
            payload.put("longitude", request.longitude());
        }
        return payload;
    }

    private void recordMetrics(String outcome, long startTime) {
        meterRegistry.counter("tripify.ai.requests", "outcome", outcome).increment();
        meterRegistry.timer("tripify.ai.request.duration", "outcome", outcome)
            .record(System.nanoTime() - startTime, TimeUnit.NANOSECONDS);
    }

    private void recordFailure(String reason, long startTime, AssistantPlanRequest request, Exception exception) {
        recordMetrics("failure", startTime);
        Map<String, Object> context = Map.of(
            "reason", reason,
            "userId", request.userId(),
            "tripId", request.tripId(),
            "destination", request.destination());
        aiErrorTracker.capture("ai_request_failed", exception, context);
        logger.warn("AI request failed context={}", context, exception);
    }
}
