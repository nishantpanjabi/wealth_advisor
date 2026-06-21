package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.AssetType;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InvestmentResponse(
        Long id,
        String assetName,
        AssetType assetType,
        BigDecimal buyPrice,
        Double quantity,
        BigDecimal investedValue,
        BigDecimal currentValue,
        BigDecimal profitLoss,
        Double returnPercent,
        LocalDate purchaseDate
) {
}
