package com.tripify.travel.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String location;
    private double budget;
    private int days;
    private int people;

    private boolean confirmed;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL)
    private List<Destination> destinations;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public double getBudget() { return budget; }
    public void setBudget(double budget) { this.budget = budget; }
}