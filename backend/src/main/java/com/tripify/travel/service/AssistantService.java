package com.tripify.travel.service;

import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;
import com.tripify.travel.dto.assistant.AssistantStep;
import com.tripify.travel.model.AssistantPlan;
import com.tripify.travel.model.AssistantPlanStep;
import com.tripify.travel.model.Trip;
import com.tripify.travel.model.User;
import com.tripify.travel.repository.AssistantPlanRepository;
import com.tripify.travel.repository.TripRepository;
import com.tripify.travel.repository.UserRepository;
import com.tripify.travel.service.port.AssistantServicePort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssistantService {

    private final AssistantServicePort assistantServicePort;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final AssistantPlanRepository assistantPlanRepository;

    public AssistantService(
        AssistantServicePort assistantServicePort,
        UserRepository userRepository,
        TripRepository tripRepository,
        AssistantPlanRepository assistantPlanRepository) {
        this.assistantServicePort = assistantServicePort;
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.assistantPlanRepository = assistantPlanRepository;
    }

    @Transactional
    public AssistantPlanResponse buildPlan(AssistantPlanRequest request) {
        validateRequest(request);
        User user = userRepository.findById(request.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Trip trip = resolveTrip(request, user);

        AssistantPlanResponse response = assistantServicePort.buildPlan(request);
        assistantPlanRepository.save(toEntity(response, user, trip));
        return response;
    }

    private void validateRequest(AssistantPlanRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (request.userId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
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

    private Trip resolveTrip(AssistantPlanRequest request, User user) {
        if (request.tripId() != null) {
            return tripRepository.findByIdAndUserId(request.tripId(), user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found for user"));
        }

        return tripRepository.findFirstByUserIdAndLocationIgnoreCaseOrderByIdDesc(user.getId(), request.destination())
            .or(() -> tripRepository.findFirstByUserIdOrderByIdDesc(user.getId()))
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Create a trip before generating an assistant plan"));
    }

    private AssistantPlan toEntity(AssistantPlanResponse response, User user, Trip trip) {
        AssistantPlan plan = new AssistantPlan();
        plan.setDestination(response.destination());
        plan.setSummary(response.summary());
        plan.setUser(user);
        plan.setTrip(trip);

        for (AssistantStep step : response.steps()) {
            AssistantPlanStep planStep = new AssistantPlanStep();
            planStep.setTitle(step.title());
            planStep.setDescription(step.description());
            planStep.setDayNumber(step.dayNumber());
            plan.addStep(planStep);
        }

        return plan;
    }
}
