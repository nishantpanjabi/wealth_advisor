package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.RiskCategory;
import java.math.BigDecimal;
import java.util.List;

public record PortfolioForecastResponse(
        Integer projectionYears,
        RiskCategory riskCategory,
        BigDecimal currentPortfolioValue,
        BigDecimal monthlyContribution,
        Double assumedAnnualReturn,
        Double assumedVolatility,
        BigDecimal projectedPortfolioValue,
        BigDecimal projectedGain,
        Double projectedCagr,
        Double downsideProbability,
        String confidenceBand,
        List<String> assumptions
) {
}
