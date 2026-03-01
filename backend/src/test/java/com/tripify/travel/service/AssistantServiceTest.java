package com.tripify.travel.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tripify.travel.dto.assistant.AssistantPlanRequest;
import com.tripify.travel.dto.assistant.AssistantPlanResponse;
import com.tripify.travel.dto.assistant.AssistantStep;
import com.tripify.travel.model.AssistantPlan;
import com.tripify.travel.model.Trip;
import com.tripify.travel.model.User;
import com.tripify.travel.repository.AssistantPlanRepository;
import com.tripify.travel.repository.TripRepository;
import com.tripify.travel.repository.UserRepository;
import com.tripify.travel.service.port.PlacesServicePort;
import com.tripify.travel.service.port.PricingServicePort;
import com.tripify.travel.service.port.WeatherServicePort;
import com.tripify.travel.service.port.AssistantServicePort;
import com.tripify.travel.dto.places.PlaceCandidate;
import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.dto.weather.WeatherSnapshot;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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
            placesServicePort);

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
            null);
        AssistantPlanResponse response = new AssistantPlanResponse(
            "Chicago",
            "Foodie weekend",
            List.of(new AssistantStep("Explore", "Try local restaurants.", 1)));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tripRepository.findFirstByUserIdAndLocationIgnoreCaseOrderByIdDesc(1L, "Chicago"))
            .thenReturn(Optional.of(trip));
        when(pricingServicePort.getTripPricing("Current location", "Chicago", 2))
            .thenReturn(List.of(new PriceQuote("amadeus", "flight", "USD", 299, "test")));
        when(weatherServicePort.getCurrentWeather("Chicago"))
            .thenReturn(new WeatherSnapshot("Chicago", "Clear", 21, false));
        when(placesServicePort.findActivities("Chicago", "foodie"))
            .thenReturn(List.of(new PlaceCandidate("Food Hall", "dining", "foodie", 30, "yelp")));
        when(assistantServicePort.buildPlan(any(AssistantPlanRequest.class))).thenReturn(response);
        when(assistantPlanRepository.save(any(AssistantPlan.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        AssistantPlanResponse persistedResponse = assistantService.buildPlan(request);

        assertSame(response, persistedResponse);

        ArgumentCaptor<AssistantPlan> planCaptor = ArgumentCaptor.forClass(AssistantPlan.class);
        verify(assistantPlanRepository).save(planCaptor.capture());
        AssistantPlan persistedPlan = planCaptor.getValue();

        assertEquals("Chicago", persistedPlan.getDestination());
        assertSame(user, persistedPlan.getUser());
        assertSame(trip, persistedPlan.getTrip());
        assertEquals(1, persistedPlan.getSteps().size());
        assertEquals("Explore", persistedPlan.getSteps().get(0).getTitle());
    }

    @Test
    void buildPlanRequiresExistingTripForPersistence() {
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
            placesServicePort);

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
            null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tripRepository.findFirstByUserIdAndLocationIgnoreCaseOrderByIdDesc(1L, "Chicago"))
            .thenReturn(Optional.empty());
        when(tripRepository.findFirstByUserIdOrderByIdDesc(1L))
            .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> assistantService.buildPlan(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Create a trip before generating an assistant plan", exception.getReason());
    }
}
