package com.tripify.travel.model;

import jakarta.persistence.*;

@Entity
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type; // landmark, restaurant, museum
    private double estimatedCost;

    @ManyToOne
    @JoinColumn(name = "trip_id")
    private Trip trip;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public double getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(double estimatedCost) { this.estimatedCost = estimatedCost; }

    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
}
