package com.tripify.travel.dto;

import com.tripify.travel.model.User;

public record UserResponse(
    Long id,
    String email,
    String foodPreferences,
    String allergies,
    String dietaryPreference,
    String personalityType,
    String tripCategory,
    Boolean lactoseIntolerant,
    Boolean drinksAlcohol,
    Boolean smokes) {

    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFoodPreferences(),
            user.getAllergies(),
            user.getDietaryPreference(),
            user.getPersonalityType(),
            user.getTripCategory(),
            user.getLactoseIntolerant(),
            user.getDrinksAlcohol(),
            user.getSmokes());
    }
}
