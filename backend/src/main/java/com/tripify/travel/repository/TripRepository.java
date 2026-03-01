package com.tripify.travel.repository;

import com.tripify.travel.model.Trip;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findByIdAndUserId(Long tripId, Long userId);

    Optional<Trip> findFirstByUserIdAndLocationIgnoreCaseOrderByIdDesc(Long userId, String location);

    Optional<Trip> findFirstByUserIdOrderByIdDesc(Long userId);
}
