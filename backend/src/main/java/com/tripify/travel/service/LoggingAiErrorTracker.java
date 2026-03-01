package com.tripify.travel.service;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingAiErrorTracker implements AiErrorTracker {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAiErrorTracker.class);

    @Override
    public void capture(String eventName, Throwable error, Map<String, Object> context) {
        logger.error("AI error tracked event={} context={}", eventName, context, error);
    }
}
