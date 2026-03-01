package com.tripify.travel.service;

import com.tripify.travel.dto.places.PlaceCandidate;
import com.tripify.travel.integration.places.GooglePlacesClient;
import com.tripify.travel.service.port.PlacesServicePort;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PlacesService implements PlacesServicePort {

    private final GooglePlacesClient googlePlacesClient;

    public PlacesService(GooglePlacesClient googlePlacesClient) {
        this.googlePlacesClient = googlePlacesClient;
    }

    @Override
    public List<PlaceCandidate> findActivities(String city, String vibe, Double latitude, Double longitude) {
        return googlePlacesClient.searchPlaces(city, vibe, latitude, longitude);
    }
}
