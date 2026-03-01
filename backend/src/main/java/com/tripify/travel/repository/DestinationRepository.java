package com.tripify.travel.repository;

import com.tripify.travel.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DestinationRepository extends JpaRepository<Destination, Long> {
}