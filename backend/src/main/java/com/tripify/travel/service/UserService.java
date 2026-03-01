package com.tripify.travel.service;

import com.tripify.travel.dto.AuthRequest;
import com.tripify.travel.dto.PreferencesRequest;
import com.tripify.travel.model.User;
import com.tripify.travel.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User signup(AuthRequest request) {
        validateAuthRequest(request);
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists");
        }

        User user = new User();
        user.setEmail(request.email().trim());
        user.setPassword(request.password());
        return userRepository.save(user);
    }

    public User login(AuthRequest request) {
        validateAuthRequest(request);
        User user = userRepository.findByEmail(request.email().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!Objects.equals(user.getPassword(), request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return user;
    }

    public User getUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public User updatePreferences(Long userId, PreferencesRequest preferencesRequest) {
        if (preferencesRequest == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preferences are required");
        }
        User user = getUser(userId);
        user.setFoodPreferences(normalize(preferencesRequest.foodPreferences()));
        user.setAllergies(normalize(preferencesRequest.allergies()));
        user.setDietaryPreference(normalize(preferencesRequest.dietaryPreference()));
        user.setPersonalityType(normalize(preferencesRequest.personalityType()));
        user.setTripCategory(normalize(preferencesRequest.tripCategory()));
        user.setLactoseIntolerant(preferencesRequest.lactoseIntolerant());
        user.setDrinksAlcohol(preferencesRequest.drinksAlcohol());
        user.setSmokes(preferencesRequest.smokes());
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    private void validateAuthRequest(AuthRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()
            || request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
