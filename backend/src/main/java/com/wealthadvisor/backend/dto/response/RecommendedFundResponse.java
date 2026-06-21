package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;

public record RecommendedFundResponse(
        String fundName,
        String assetClass,
        Double allocationPercent,
        BigDecimal monthlySipAmount,
        String rationale,
        Double score
) {
}
