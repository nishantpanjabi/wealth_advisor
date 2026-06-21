package com.wealthadvisor.backend.dto.response;

public record RecommendationActionResponse(
        String assetClass,
        String action,
        Double currentAllocationPct,
        Double targetAllocationPct,
        String rationale
) {
}
