package com.tripify.travel.integration.places;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.List;

public interface GooglePlacesClient {

    List<PlaceCandidate> searchPlaces(String city, String vibe, Double latitude, Double longitude);
}
