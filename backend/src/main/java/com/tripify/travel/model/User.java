package com.tripify.travel.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String password;

    private String foodPreferences;
    private String allergies;
    private String dietaryPreference;
    private String personalityType;
    private String tripCategory;
    private Boolean lactoseIntolerant;
    private Boolean drinksAlcohol;
    private Boolean smokes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Trip> trips;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFoodPreferences() { return foodPreferences; }
    public void setFoodPreferences(String foodPreferences) { this.foodPreferences = foodPreferences; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getDietaryPreference() { return dietaryPreference; }
    public void setDietaryPreference(String dietaryPreference) { this.dietaryPreference = dietaryPreference; }

    public String getPersonalityType() { return personalityType; }
    public void setPersonalityType(String personalityType) { this.personalityType = personalityType; }

    public String getTripCategory() { return tripCategory; }
    public void setTripCategory(String tripCategory) { this.tripCategory = tripCategory; }

    public Boolean getLactoseIntolerant() { return lactoseIntolerant; }
    public void setLactoseIntolerant(Boolean lactoseIntolerant) { this.lactoseIntolerant = lactoseIntolerant; }

    public Boolean getDrinksAlcohol() { return drinksAlcohol; }
    public void setDrinksAlcohol(Boolean drinksAlcohol) { this.drinksAlcohol = drinksAlcohol; }

    public Boolean getSmokes() { return smokes; }
    public void setSmokes(Boolean smokes) { this.smokes = smokes; }

    public List<Trip> getTrips() { return trips; }
    public void setTrips(List<Trip> trips) { this.trips = trips; }
}
