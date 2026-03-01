package com.tripify.travel.controller;

import com.tripify.travel.dto.assistant.AssistantChatRequest;
import com.tripify.travel.dto.assistant.AssistantChatResponse;
import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;
import com.tripify.travel.dto.assistant.StoredAssistantPlanResponse;
import java.util.List;
import com.tripify.travel.service.AssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
@CrossOrigin(origins = "*")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/plan")
    public ResponseEntity<AssistantPlanResponse> buildPlan(@RequestBody AssistantPlanRequest request) {
        return ResponseEntity.ok(assistantService.buildPlan(request));
    }

    @PostMapping("/chat")
    public ResponseEntity<AssistantChatResponse> chat(@RequestBody AssistantChatRequest request) {
        return ResponseEntity.ok(assistantService.chat(request));
    }

    @GetMapping("/trips/{tripId}")
    public ResponseEntity<List<StoredAssistantPlanResponse>> getPlansForTrip(@PathVariable Long tripId) {
        return ResponseEntity.ok(assistantService.getPlansForTrip(tripId));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<StoredAssistantPlanResponse>> getPlansForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(assistantService.getPlansForUser(userId));
    }
}
