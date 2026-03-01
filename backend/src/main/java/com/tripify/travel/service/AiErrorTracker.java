package com.tripify.travel.service;

import java.util.Map;

public interface AiErrorTracker {

    void capture(String eventName, Throwable error, Map<String, Object> context);
}
