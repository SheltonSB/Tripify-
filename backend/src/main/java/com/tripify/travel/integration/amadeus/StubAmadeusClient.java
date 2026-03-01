package com.tripify.travel.integration.amadeus;

import com.tripify.travel.dto.pricing.PriceQuote;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class StubAmadeusClient implements AmadeusClient {

    @Override
    public List<PriceQuote> searchTravelCosts(String origin, String destination, int travelers) {
        double base = 175 + (travelers * 94);
        return List.of(
            new PriceQuote("amadeus", "flight", "USD", base, origin + "-" + destination + "-economy"),
            new PriceQuote("amadeus", "lodging", "USD", 145 + (travelers * 28), destination + "-boutique"));
    }
}
