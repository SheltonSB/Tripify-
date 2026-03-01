package com.tripify.travel.service.port;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.List;

public interface PlacesServicePort {

    List<PlaceCandidate> findActivities(String city, String vibe);
}
