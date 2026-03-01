package com.tripify.travel.integration.skyscanner;

import com.tripify.travel.dto.pricing.PriceQuote;
import java.util.List;

public interface SkyscannerClient {

    List<PriceQuote> searchTravelCosts(String origin, String destination, int travelers);
}
