package com.tripify.travel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;
import com.tripify.travel.dto.assistant.AssistantStep;
import com.tripify.travel.dto.places.PlaceCandidate;
import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.dto.weather.WeatherSnapshot;
import com.tripify.travel.model.AssistantPlan;
import com.tripify.travel.model.Trip;
import com.tripify.travel.model.User;
import com.tripify.travel.repository.AssistantPlanRepository;
import com.tripify.travel.repository.TripRepository;
import com.tripify.travel.repository.UserRepository;
import com.tripify.travel.service.port.AssistantServicePort;
import com.tripify.travel.service.port.PlacesServicePort;
import com.tripify.travel.service.port.PricingServicePort;
import com.tripify.travel.service.port.WeatherServicePort;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.mockito.Mockito.mock;

class AssistantServiceTest {

    @Test
    void buildPlanSavesAssistantPlanAgainstResolvedTrip() {
        AssistantServicePort assistantServicePort = mock(AssistantServicePort.class);
        UserRepository userRepository = mock(UserRepository.class);
        TripRepository tripRepository = mock(TripRepository.class);
        AssistantPlanRepository assistantPlanRepository = mock(AssistantPlanRepository.class);
        PricingServicePort pricingServicePort = mock(PricingServicePort.class);
        WeatherServicePort weatherServicePort = mock(WeatherServicePort.class);
        PlacesServicePort placesServicePort = mock(PlacesServicePort.class);
        AssistantService assistantService = new AssistantService(
            assistantServicePort,
            userRepository,
            tripRepository,
            assistantPlanRepository,
            pricingServicePort,
            weatherServicePort,
            placesServicePort,
            new PlaceRankingService());

        User user = new User();
        user.setId(1L);
        Trip trip = new Trip();
        trip.setId(7L);
        trip.setUser(user);

        AssistantPlanRequest request = new AssistantPlanRequest(
            1L,
            null,
            "Chicago",
            1200,
            3,
            2,
            "Plan a food-focused weekend",
            null,
            null,
            null,
            null,
            null,
            null,
            null);
        AssistantPlanResponse aiResponse = new AssistantPlanResponse(
            "Chicago",
            "Foodie weekend",
            List.of(new AssistantStep("Explore", "Try local restaurants.", 1)),
            null,
            null,
            null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tripRepository.findFirstByUserIdAndLocationIgnoreCaseOrderByIdDesc(1L, "Chicago"))
            .thenReturn(Optional.of(trip));
        when(pricingServicePort.getTripPricing("Current location", "Chicago", 2))
            .thenReturn(List.of(new PriceQuote("amadeus", "flight", "USD", 299, "test")));
        when(weatherServicePort.getCurrentWeather("Chicago"))
            .thenReturn(new WeatherSnapshot("Chicago", "Clear", 21, false));
        when(placesServicePort.findActivities("Chicago", "foodie", null, null))
            .thenReturn(List.of(new PlaceCandidate("Food Hall", "dining", "foodie", 30, "yelp", null)));
        when(assistantServicePort.buildPlan(any(AssistantPlanRequest.class))).thenReturn(aiResponse);
        when(assistantPlanRepository.save(any(AssistantPlan.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        AssistantPlanResponse persistedResponse = assistantService.buildPlan(request);

        assertEquals("Chicago", persistedResponse.destination());
        assertEquals("Foodie weekend", persistedResponse.summary());
        assertNotNull(persistedResponse.recommendations());
        assertEquals(1, persistedResponse.recommendations().size());
        assertEquals(299, persistedResponse.fixedCost());
        assertEquals(901, persistedResponse.remainingBudget());

        ArgumentCaptor<AssistantPlan> planCaptor = ArgumentCaptor.forClass(AssistantPlan.class);
        verify(assistantPlanRepository).save(planCaptor.capture());
        AssistantPlan persistedPlan = planCaptor.getValue();

        assertEquals("Chicago", persistedPlan.getDestination());
        assertEquals(user, persistedPlan.getUser());
        assertEquals(trip, persistedPlan.getTrip());
        assertEquals(1, persistedPlan.getSteps().size());
        assertEquals("Explore", persistedPlan.getSteps().get(0).getTitle());
    }

    @Test
    void buildPlanCreatesTripWhenUserHasNoExistingTrip() {
        AssistantServicePort assistantServicePort = mock(AssistantServicePort.class);
        UserRepository userRepository = mock(UserRepository.class);
        TripRepository tripRepository = mock(TripRepository.class);
        AssistantPlanRepository assistantPlanRepository = mock(AssistantPlanRepository.class);
        PricingServicePort pricingServicePort = mock(PricingServicePort.class);
        WeatherServicePort weatherServicePort = mock(WeatherServicePort.class);
        PlacesServicePort placesServicePort = mock(PlacesServicePort.class);
        AssistantService assistantService = new AssistantService(
            assistantServicePort,
            userRepository,
            tripRepository,
            assistantPlanRepository,
            pricingServicePort,
            weatherServicePort,
            placesServicePort,
            new PlaceRankingService());

        User user = new User();
        user.setId(1L);

        AssistantPlanRequest request = new AssistantPlanRequest(
            1L,
            null,
            "Chicago",
            1200,
            3,
            2,
            "Plan a food-focused weekend",
            null,
            null,
            null,
            null,
            null,
            null,
            null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tripRepository.findFirstByUserIdAndLocationIgnoreCaseOrderByIdDesc(1L, "Chicago"))
            .thenReturn(Optional.empty());
        when(tripRepository.findFirstByUserIdOrderByIdDesc(1L))
            .thenReturn(Optional.empty());

        Trip createdTrip = new Trip();
        createdTrip.setId(42L);
        createdTrip.setUser(user);
        createdTrip.setLocation("Chicago");
        createdTrip.setBudget(1200);
        createdTrip.setDays(3);
        createdTrip.setPeople(2);
        when(tripRepository.save(any(Trip.class))).thenReturn(createdTrip);
        when(pricingServicePort.getTripPricing("Current location", "Chicago", 2))
            .thenReturn(List.of(new PriceQuote("amadeus", "flight", "USD", 299, "test")));
        when(weatherServicePort.getCurrentWeather("Chicago"))
            .thenReturn(new WeatherSnapshot("Chicago", "Clear", 21, false));
        when(placesServicePort.findActivities("Chicago", "foodie", null, null))
            .thenReturn(List.of(new PlaceCandidate("Food Hall", "dining", "foodie", 30, "yelp", null)));

        AssistantPlanResponse aiResponse = new AssistantPlanResponse(
            "Chicago",
            "Foodie weekend",
            List.of(new AssistantStep("Explore", "Try local restaurants.", 1)),
            null,
            null,
            null);
        when(assistantServicePort.buildPlan(any(AssistantPlanRequest.class))).thenReturn(aiResponse);
        when(assistantPlanRepository.save(any(AssistantPlan.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        AssistantPlanResponse persistedResponse = assistantService.buildPlan(request);

        assertEquals("Chicago", persistedResponse.destination());
        assertNotNull(persistedResponse.recommendations());
        assertEquals(1, persistedResponse.recommendations().size());
        assertEquals(299, persistedResponse.fixedCost());
        assertEquals(901, persistedResponse.remainingBudget());
        verify(tripRepository).save(any(Trip.class));
    }

    @Test
    void buildPlanFallsBackWhenAiProviderFails() {
        AssistantServicePort assistantServicePort = mock(AssistantServicePort.class);
        UserRepository userRepository = mock(UserRepository.class);
        TripRepository tripRepository = mock(TripRepository.class);
        AssistantPlanRepository assistantPlanRepository = mock(AssistantPlanRepository.class);
        PricingServicePort pricingServicePort = mock(PricingServicePort.class);
        WeatherServicePort weatherServicePort = mock(WeatherServicePort.class);
        PlacesServicePort placesServicePort = mock(PlacesServicePort.class);
        AssistantService assistantService = new AssistantService(
            assistantServicePort,
            userRepository,
            tripRepository,
            assistantPlanRepository,
            pricingServicePort,
            weatherServicePort,
            placesServicePort,
            new PlaceRankingService());

        User user = new User();
        user.setId(1L);
        Trip trip = new Trip();
        trip.setId(7L);
        trip.setUser(user);

        AssistantPlanRequest request = new AssistantPlanRequest(
            1L,
            null,
            "Chicago",
            1200,
            3,
            2,
            "Plan a food-focused weekend",
            null,
            null,
            null,
            null,
            null,
            null,
            null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tripRepository.findFirstByUserIdAndLocationIgnoreCaseOrderByIdDesc(1L, "Chicago"))
            .thenReturn(Optional.of(trip));
        when(pricingServicePort.getTripPricing("Current location", "Chicago", 2))
            .thenReturn(List.of(new PriceQuote("amadeus", "flight", "USD", 310, "fallback-test")));
        when(weatherServicePort.getCurrentWeather("Chicago"))
            .thenReturn(new WeatherSnapshot("Chicago", "Cloudy", 18, false));
        when(placesServicePort.findActivities("Chicago", "foodie", null, null))
            .thenReturn(List.of(
                new PlaceCandidate("West Loop Food Crawl", "dining", "foodie", 28, "synthetic-fallback", 1200.0),
                new PlaceCandidate("Art Institute of Chicago", "museum", "foodie", 32, "synthetic-fallback", 1800.0)));
        doThrow(new RuntimeException("AI unavailable")).when(assistantServicePort).buildPlan(any(AssistantPlanRequest.class));
        when(assistantPlanRepository.save(any(AssistantPlan.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        AssistantPlanResponse response = assistantService.buildPlan(request);

        assertEquals("Chicago", response.destination());
        assertTrue(response.summary().toLowerCase().contains("temporarily unavailable"));
        assertTrue(response.steps().size() >= 1);
        assertEquals(310, response.fixedCost());
        assertNotNull(response.recommendations());
        assertTrue(response.recommendations().size() >= 1);
    }
}
