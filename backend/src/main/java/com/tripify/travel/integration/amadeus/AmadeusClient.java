package com.tripify.travel.integration.amadeus;

import com.tripify.travel.dto.pricing.PriceQuote;
import java.util.List;

public interface AmadeusClient {

    List<PriceQuote> searchTravelCosts(String origin, String destination, int travelers);
}
