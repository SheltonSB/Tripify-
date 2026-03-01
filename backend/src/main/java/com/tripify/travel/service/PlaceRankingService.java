package com.tripify.travel.service;

import com.tripify.travel.dto.places.PlaceCandidate;
import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.dto.weather.WeatherSnapshot;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PlaceRankingService {

    public List<PlaceCandidate> rankPlaces(
        double budget,
        int days,
        int people,
        String vibe,
        List<PriceQuote> priceQuotes,
        WeatherSnapshot weather,
        List<PlaceCandidate> places) {
        if (places == null || places.isEmpty()) {
            return List.of();
        }

        double fixedCost = estimateFixedCost(priceQuotes);
        double remainingBudget = Math.max(0, budget - fixedCost);
        double activityBudgetPerDay = days <= 0 ? remainingBudget : remainingBudget / days;
        double activityBudgetPerTraveler = people <= 0 ? activityBudgetPerDay : activityBudgetPerDay / people;

        return places.stream()
            .sorted(Comparator
                .comparingDouble((PlaceCandidate place) -> scorePlace(
                    place,
                    vibe,
                    activityBudgetPerTraveler,
                    weather))
                .reversed()
                .thenComparingDouble(place -> place.distanceMeters() == null ? Double.MAX_VALUE : place.distanceMeters())
                .thenComparingDouble(PlaceCandidate::estimatedCost)
                .thenComparing(PlaceCandidate::name))
            .limit(Math.max(3, Math.min(6, days + 1L)))
            .toList();
    }

    private double scorePlace(
        PlaceCandidate place,
        String vibe,
        double activityBudgetPerTraveler,
        WeatherSnapshot weather) {
        double affordability = affordabilityScore(place.estimatedCost(), activityBudgetPerTraveler);
        double vibeMatch = vibeScore(place, vibe);
        double weatherFit = weatherScore(place, weather);
        double value = valueScore(place.estimatedCost());
        double distance = distanceScore(place.distanceMeters());

        return (affordability * 0.35) + (vibeMatch * 0.20) + (weatherFit * 0.15) + (value * 0.10) + (distance * 0.20);
    }

    private double affordabilityScore(double estimatedCost, double activityBudgetPerTraveler) {
        if (estimatedCost <= 0) {
            return 1.0;
        }
        if (activityBudgetPerTraveler <= 0) {
            return 0.05;
        }

        double ratio = estimatedCost / activityBudgetPerTraveler;
        if (ratio <= 1.0) {
            return clamp(1.0 - (ratio * 0.15), 0.45, 1.0);
        }
        return clamp(1.0 - ((ratio - 1.0) * 0.9), 0.0, 0.4);
    }

    private double vibeScore(PlaceCandidate place, String vibe) {
        if (vibe == null || vibe.isBlank()) {
            return 0.6;
        }

        String requested = vibe.trim().toLowerCase();
        String placeVibe = place.vibe() == null ? "" : place.vibe().trim().toLowerCase();
        String category = place.category() == null ? "" : place.category().trim().toLowerCase();

        if (requested.equals(placeVibe)) {
            return 1.0;
        }
        if (requested.equals("balanced")) {
            return 0.75;
        }
        if (requested.equals("foodie") && category.contains("restaurant")) {
            return 0.9;
        }
        if (requested.equals("nightlife") && (category.contains("bar") || category.contains("night"))) {
            return 0.9;
        }
        return 0.5;
    }

    private double weatherScore(PlaceCandidate place, WeatherSnapshot weather) {
        if (weather == null) {
            return 0.7;
        }

        String category = place.category() == null ? "" : place.category().trim().toLowerCase();
        boolean indoorFriendly = category.contains("restaurant")
            || category.contains("museum")
            || category.contains("shopping")
            || category.contains("cafe")
            || category.contains("hotel");
        boolean outdoorFriendly = category.contains("park")
            || category.contains("tourist")
            || category.contains("sightseeing")
            || category.contains("trail")
            || category.contains("outdoor");

        if (weather.alertActive()) {
            return indoorFriendly ? 1.0 : 0.35;
        }

        if (weather.temperatureCelsius() <= 2) {
            return indoorFriendly ? 0.95 : 0.55;
        }

        if (weather.temperatureCelsius() >= 26) {
            return indoorFriendly ? 0.75 : 0.9;
        }

        if (outdoorFriendly) {
            return 0.95;
        }

        return 0.8;
    }

    private double valueScore(double estimatedCost) {
        if (estimatedCost <= 0) {
            return 1.0;
        }
        if (estimatedCost <= 20) {
            return 0.9;
        }
        if (estimatedCost <= 50) {
            return 0.75;
        }
        if (estimatedCost <= 100) {
            return 0.55;
        }
        return 0.35;
    }

    private double distanceScore(Double distanceMeters) {
        if (distanceMeters == null) {
            return 0.65;
        }
        if (distanceMeters <= 500) {
            return 1.0;
        }
        if (distanceMeters <= 2_000) {
            return 0.9;
        }
        if (distanceMeters <= 5_000) {
            return 0.75;
        }
        if (distanceMeters <= 10_000) {
            return 0.55;
        }
        if (distanceMeters <= 25_000) {
            return 0.35;
        }
        return 0.2;
    }

    private double estimateFixedCost(List<PriceQuote> priceQuotes) {
        if (priceQuotes == null || priceQuotes.isEmpty()) {
            return 0;
        }

        return priceQuotes.stream()
            .filter(quote -> quote.category() != null)
            .filter(quote -> {
                String category = quote.category().trim().toLowerCase();
                return category.equals("flight") || category.equals("lodging") || category.equals("hotel");
            })
            .mapToDouble(PriceQuote::amount)
            .sum();
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
