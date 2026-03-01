package com.tripify.travel.integration.places;

import com.tripify.travel.dto.places.PlaceCandidate;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class StubYelpClient implements YelpClient {

    @Override
    public List<PlaceCandidate> searchPlaces(String city, String vibe) {
        return List.of(
            new PlaceCandidate(city + " Jazz Bar", "nightlife", vibe, 35, "yelp"),
            new PlaceCandidate(city + " Rooftop Lounge", "drinks", vibe, 42, "yelp"));
    }
}
