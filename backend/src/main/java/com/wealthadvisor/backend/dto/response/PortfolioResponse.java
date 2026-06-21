package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record PortfolioResponse(
        Long portfolioId,
        Long userId,
        BigDecimal totalInvestedValue,
        BigDecimal totalCurrentValue,
        BigDecimal totalProfitLoss,
        Double totalReturnPercent,
        Double equityPct,
        Double debtPct,
        Double goldPct,
        Double liquidPct,
        Integer holdingsCount,
        List<InvestmentResponse> investments
) {
}
