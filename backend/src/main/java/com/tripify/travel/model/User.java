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
}