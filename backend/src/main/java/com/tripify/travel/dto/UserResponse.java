package com.tripify.travel.dto;

import com.tripify.travel.model.User;

public record UserResponse(
    Long id,
    String email,
    String foodPreferences,
    String allergies) {

    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFoodPreferences(),
            user.getAllergies());
    }
}
