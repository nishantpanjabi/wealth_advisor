package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FundNavSnapshotResponse(
        String fundName,
        String assetClass,
        LocalDate navDate,
        BigDecimal navValue,
        String source
) {
}
