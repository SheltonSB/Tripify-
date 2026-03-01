package com.tripify.travel.dto;

public record PreferencesRequest(
    String foodPreferences,
    String allergies,
    String dietaryPreference,
    String personalityType,
    String tripCategory,
    Boolean lactoseIntolerant,
    Boolean drinksAlcohol,
    Boolean smokes) {
}
