package com.tripify.travel.service;

import com.tripify.travel.dto.places.PlaceCandidate;
import com.tripify.travel.integration.places.GooglePlacesClient;
import com.tripify.travel.integration.places.YelpClient;
import com.tripify.travel.service.port.PlacesServicePort;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PlacesService implements PlacesServicePort {

    private final GooglePlacesClient googlePlacesClient;
    private final YelpClient yelpClient;

    public PlacesService(GooglePlacesClient googlePlacesClient, YelpClient yelpClient) {
        this.googlePlacesClient = googlePlacesClient;
        this.yelpClient = yelpClient;
    }

    @Override
    public List<PlaceCandidate> findActivities(String city, String vibe) {
        List<PlaceCandidate> places = new ArrayList<>();
        places.addAll(googlePlacesClient.searchPlaces(city, vibe));
        places.addAll(yelpClient.searchPlaces(city, vibe));
        places.sort(Comparator.comparingDouble(PlaceCandidate::estimatedCost));
        return places;
    }
}
