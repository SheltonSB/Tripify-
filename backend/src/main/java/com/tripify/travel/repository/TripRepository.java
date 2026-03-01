package com.tripify.travel.repository;

import com.tripify.travel.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripRepository extends JpaRepository<Trip, Long> {
}