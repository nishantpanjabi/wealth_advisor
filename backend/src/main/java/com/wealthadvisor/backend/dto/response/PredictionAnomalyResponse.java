package com.wealthadvisor.backend.dto.response;

public record PredictionAnomalyResponse(
        String severity,
        String title,
        String metric,
        Double value,
        Double threshold,
        String recommendation
) {
}
