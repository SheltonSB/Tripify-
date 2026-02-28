package com.tripify.travel.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {

    // Step 1: User submits constraints
    @PostMapping("/generate")
    public ResponseEntity<String> generateTrip(@RequestBody String tripRequest) {

        // TODO:
        // - Call AI recommendation service
        // - Validate budget feasibility
        // - Return trip options

        return ResponseEntity.ok("Trip options generated");
    }

    // Step 2: User selects a specific trip
    @PostMapping("/confirm/{tripId}")
    public ResponseEntity<String> confirmTrip(@PathVariable Long tripId) {

        // TODO:
        // - Save confirmed trip to DB
        // - Lock selected destinations
        // - Return itinerary

        return ResponseEntity.ok("Trip confirmed with ID: " + tripId);
    }

    // Step 3: Get specific trip
    @GetMapping("/{tripId}")
    public ResponseEntity<String> getTrip(@PathVariable Long tripId) {

        return ResponseEntity.ok("Trip details for ID: " + tripId);
    }
}