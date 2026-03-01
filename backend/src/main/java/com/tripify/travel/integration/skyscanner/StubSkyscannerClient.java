package com.tripify.travel.integration.skyscanner;

import com.tripify.travel.dto.pricing.PriceQuote;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class StubSkyscannerClient implements SkyscannerClient {

    @Override
    public List<PriceQuote> searchTravelCosts(String origin, String destination, int travelers) {
        double base = 160 + (travelers * 102);
        return List.of(
            new PriceQuote("skyscanner", "flight", "USD", base, origin + "-" + destination + "-best"),
            new PriceQuote("skyscanner", "lodging", "USD", 132 + (travelers * 24), destination + "-central"));
    }
}
