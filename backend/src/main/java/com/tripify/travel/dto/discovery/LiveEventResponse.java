package com.tripify.travel.dto.discovery;

public record LiveEventResponse(
    String id,
    String name,
    String venueName,
    String city,
    String startDateTime,
    String imageUrl,
    String ticketUrl,
    Double minPrice,
    String currency,
    Double distanceMeters) {
}
