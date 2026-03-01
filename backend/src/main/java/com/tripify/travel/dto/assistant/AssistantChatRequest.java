package com.tripify.travel.dto.assistant;

public record AssistantChatRequest(
    Long userId,
    String destination,
    String areaName,
    String message,
    String vibe,
    Double latitude,
    Double longitude) {
}
