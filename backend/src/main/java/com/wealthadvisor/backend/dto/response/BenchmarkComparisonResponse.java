package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;

public record BenchmarkComparisonResponse(
        String benchmarkName,
        BigDecimal benchmarkValue,
        BigDecimal portfolioValue,
        BigDecimal alphaValue,
        Double portfolioReturnPercent,
        Double benchmarkReturnPercent
) {
}
