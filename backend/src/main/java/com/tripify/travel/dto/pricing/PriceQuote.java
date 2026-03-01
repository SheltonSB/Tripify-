package com.tripify.travel.dto.pricing;

public record PriceQuote(
    String provider,
    String category,
    String currency,
    double amount,
    String sourceReference) {
}
