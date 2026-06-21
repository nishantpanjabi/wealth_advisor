package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TaxReviewResponse(
        Long investmentId,
        String assetName,
        String assetType,
        LocalDate purchaseDate,
        Integer holdingDays,
        BigDecimal unrealizedGain,
        String note
) {
}
