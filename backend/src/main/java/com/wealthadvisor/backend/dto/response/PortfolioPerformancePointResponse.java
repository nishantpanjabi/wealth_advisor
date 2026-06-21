package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PortfolioPerformancePointResponse(
        LocalDate date,
        BigDecimal investedValue,
        BigDecimal estimatedPortfolioValue
) {
}
