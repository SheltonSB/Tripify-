package com.tripify.travel.dto.discovery;

import java.util.List;

public record DestinationPhotoResponse(
    String destination,
    List<String> photoUrls) {
}
