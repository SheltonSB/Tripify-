package com.tripify.travel.service;

import com.tripify.travel.dto.TripRequest;
import com.tripify.travel.model.Trip;
import com.tripify.travel.model.User;
import com.tripify.travel.repository.TripRepository;
import com.tripify.travel.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    public TripService(TripRepository tripRepository, UserRepository userRepository) {
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
    }

    public Trip generateTrip(TripRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip request is required");
        }
        if (request.userId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        User user = userRepository.findById(request.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Trip trip = new Trip();
        trip.setUser(user);
        trip.setLocation(request.location());
        trip.setBudget(request.budget());
        trip.setDays(request.days());
        trip.setPeople(request.people());
        trip.setConfirmed(false);
        return tripRepository.save(trip);
    }

    public Trip confirmTrip(Long tripId) {
        Trip trip = getTrip(tripId);
        trip.setConfirmed(true);
        return tripRepository.save(trip);
    }

    public Trip getTrip(Long tripId) {
        return tripRepository.findById(tripId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
    }
}
