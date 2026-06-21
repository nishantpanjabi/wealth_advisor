package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PortfolioTransactionResponse(
        Long id,
        Long investmentId,
        String assetName,
        String actionType,
        BigDecimal amount,
        Double quantity,
        LocalDate transactionDate,
        LocalDateTime createdAt
) {
}
