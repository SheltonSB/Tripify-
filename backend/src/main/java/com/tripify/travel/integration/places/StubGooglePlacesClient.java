package com.tripify.travel.integration.places;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class StubGooglePlacesClient implements GooglePlacesClient {

    @Override
    public List<PlaceCandidate> searchPlaces(String city, String vibe) {
        return List.of(
            new PlaceCandidate(city + " Riverwalk", "sightseeing", vibe, 0, "google-places"),
            new PlaceCandidate(city + " Food Hall", "dining", vibe, 28, "google-places"));
    }
}
