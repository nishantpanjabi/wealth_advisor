package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record AdminDashboardResponse(
        Long totalUsers,
        Long totalPortfolios,
        BigDecimal totalPortfolioValue,
        Long totalGoals,
        Long activeAlerts,
        Map<String, Long> riskDistribution,
        Long marketSnapshotCount,
        Long fundNavCount
) {
}
