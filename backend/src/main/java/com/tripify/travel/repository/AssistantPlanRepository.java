package com.tripify.travel.repository;

import com.tripify.travel.model.AssistantPlan;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssistantPlanRepository extends JpaRepository<AssistantPlan, Long> {

    List<AssistantPlan> findAllByTripIdOrderByCreatedAtDesc(Long tripId);

    List<AssistantPlan> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
