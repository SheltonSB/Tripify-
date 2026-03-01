package com.tripify.travel.service.port;

import com.tripify.travel.dto.pricing.PriceQuote;
import java.util.List;

public interface PricingServicePort {

    List<PriceQuote> getTripPricing(String origin, String destination, int travelers);
}
