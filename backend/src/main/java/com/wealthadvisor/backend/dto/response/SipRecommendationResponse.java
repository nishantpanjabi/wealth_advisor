package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record SipRecommendationResponse(
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpenses,
        BigDecimal monthlySurplus,
        BigDecimal recommendedMonthlyInvestment,
        BigDecimal emergencyFundGap,
        BigDecimal totalGoalSipRequired,
        BigDecimal totalGoalSipRecommended,
        String recommendationBand,
        List<GoalSipRecommendationResponse> goalRecommendations,
        List<String> notes
) {
}
