package com.tripify.travel.controller;

import com.tripify.travel.dto.TripRequest;
import com.tripify.travel.dto.TripResponse;
import com.tripify.travel.service.TripService;
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

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping("/generate")
    public ResponseEntity<TripResponse> generateTrip(@RequestBody TripRequest tripRequest) {
        return ResponseEntity.ok(TripResponse.fromEntity(tripService.generateTrip(tripRequest)));
    }

    @PostMapping("/confirm/{tripId}")
    public ResponseEntity<TripResponse> confirmTrip(@PathVariable Long tripId) {
        return ResponseEntity.ok(TripResponse.fromEntity(tripService.confirmTrip(tripId)));
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<TripResponse> getTrip(@PathVariable Long tripId) {
        return ResponseEntity.ok(TripResponse.fromEntity(tripService.getTrip(tripId)));
    }
}
