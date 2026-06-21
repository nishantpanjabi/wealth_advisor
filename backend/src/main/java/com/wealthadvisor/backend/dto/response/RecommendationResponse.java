package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.RiskCategory;
import java.math.BigDecimal;
import java.util.List;

public record RecommendationResponse(
        RiskCategory riskMatchedTo,
        BigDecimal investmentAmount,
        Integer years,
        BigDecimal totalSipPerMonth,
        BigDecimal projectedValueAtMaturity,
        List<RecommendedFundResponse> fundsToBuy,
        List<String> fundsToSell,
        List<RecommendationActionResponse> rebalanceActions,
        List<String> keyReasons,
        String modelSource,
        Boolean fallbackUsed
) {
}
