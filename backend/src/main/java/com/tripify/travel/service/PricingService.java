package com.tripify.travel.service;

import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.integration.amadeus.AmadeusClient;
import com.tripify.travel.service.port.PricingServicePort;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PricingService implements PricingServicePort {

    private final AmadeusClient amadeusClient;

    public PricingService(AmadeusClient amadeusClient) {
        this.amadeusClient = amadeusClient;
    }

    @Override
    public List<PriceQuote> getTripPricing(String origin, String destination, int travelers) {
        List<PriceQuote> quotes = new ArrayList<>();
        quotes.addAll(amadeusClient.searchTravelCosts(origin, destination, travelers));
        quotes.sort(Comparator.comparingDouble(PriceQuote::amount));
        return quotes;
    }
}
