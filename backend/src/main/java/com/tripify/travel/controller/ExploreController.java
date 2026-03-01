package com.tripify.travel.controller;

import com.tripify.travel.dto.discovery.DestinationPhotoResponse;
import com.tripify.travel.dto.discovery.ExploreRecommendationsResponse;
import com.tripify.travel.dto.discovery.LiveEventResponse;
import com.tripify.travel.service.ExploreService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/explore")
@CrossOrigin(origins = "*")
public class ExploreController {

    private final ExploreService exploreService;

    public ExploreController(ExploreService exploreService) {
        this.exploreService = exploreService;
    }

    @GetMapping("/photos")
    public ResponseEntity<DestinationPhotoResponse> getDestinationPhotos(@RequestParam String destination) {
        return ResponseEntity.ok(exploreService.getDestinationPhotos(destination));
    }

    @GetMapping("/events")
    public ResponseEntity<List<LiveEventResponse>> getLiveEvents(@RequestParam String destination) {
        return ResponseEntity.ok(exploreService.getLiveEvents(destination));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ExploreRecommendationsResponse> getRecommendations(
        @RequestParam String destination,
        @RequestParam(defaultValue = "1500") double budget,
        @RequestParam(defaultValue = "3") int days,
        @RequestParam(defaultValue = "2") int people,
        @RequestParam(required = false) Long userId,
        @RequestParam(defaultValue = "") String vibe,
        @RequestParam(required = false) Double latitude,
        @RequestParam(required = false) Double longitude) {
        return ResponseEntity.ok(exploreService.getRecommendations(destination, budget, days, people, userId, vibe, latitude, longitude));
    }
}
