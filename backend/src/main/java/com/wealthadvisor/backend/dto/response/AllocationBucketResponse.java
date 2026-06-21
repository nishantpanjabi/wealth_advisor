package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;

public record AllocationBucketResponse(
        String assetClass,
        Double currentPct,
        Double targetPct,
        BigDecimal currentValue,
        BigDecimal targetValue,
        BigDecimal driftAmount,
        String action
) {
}
