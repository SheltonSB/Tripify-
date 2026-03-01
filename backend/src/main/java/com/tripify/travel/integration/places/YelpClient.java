package com.tripify.travel.integration.places;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.List;

public interface YelpClient {

    List<PlaceCandidate> searchPlaces(String city, String vibe);
}
