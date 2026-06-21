package com.wealthadvisor.backend.dto.response;

public record EfficientFrontierPointResponse(
        String profileName,
        Double expectedReturn,
        Double volatility,
        Double equityPct,
        Double debtPct,
        Double goldPct,
        Double liquidPct,
        boolean currentProfile
) {
}
