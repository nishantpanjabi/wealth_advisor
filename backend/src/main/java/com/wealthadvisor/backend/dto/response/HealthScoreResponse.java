package com.wealthadvisor.backend.dto.response;

public record HealthScoreResponse(
        Integer score,
        Double savingsScore,
        Double goalScore,
        Double diversificationScore,
        Double emergencyFundScore
) {
}
