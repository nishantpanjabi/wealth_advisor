package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;

public record GoalSipRecommendationResponse(
        Long goalId,
        String goalName,
        Integer priority,
        BigDecimal requiredMonthlyInvestment,
        BigDecimal recommendedMonthlyInvestment,
        BigDecimal monthlyGap,
        String fundingStatus
) {
}
