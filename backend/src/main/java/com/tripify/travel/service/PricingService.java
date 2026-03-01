package com.tripify.travel.service;

import com.tripify.travel.dto.pricing.PriceQuote;
import com.tripify.travel.integration.amadeus.AmadeusClient;
import com.tripify.travel.integration.skyscanner.SkyscannerClient;
import com.tripify.travel.service.port.PricingServicePort;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PricingService implements PricingServicePort {

    private final AmadeusClient amadeusClient;
    private final SkyscannerClient skyscannerClient;

    public PricingService(AmadeusClient amadeusClient, SkyscannerClient skyscannerClient) {
        this.amadeusClient = amadeusClient;
        this.skyscannerClient = skyscannerClient;
    }

    @Override
    public List<PriceQuote> getTripPricing(String origin, String destination, int travelers) {
        List<PriceQuote> quotes = new ArrayList<>();
        quotes.addAll(amadeusClient.searchTravelCosts(origin, destination, travelers));
        quotes.addAll(skyscannerClient.searchTravelCosts(origin, destination, travelers));
        quotes.sort(Comparator.comparingDouble(PriceQuote::amount));
        return quotes;
    }
}
