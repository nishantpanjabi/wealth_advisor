package com.wealthadvisor.backend.dto.response;

import java.time.LocalDate;

public record MarketDataSnapshotResponse(
        String assetClass,
        LocalDate asOfDate,
        Double returnAdjustment,
        Double volatilityAdjustment,
        String marketRegime,
        String source
) {
}
