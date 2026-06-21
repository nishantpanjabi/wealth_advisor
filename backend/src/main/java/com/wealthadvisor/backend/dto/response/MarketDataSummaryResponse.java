package com.wealthadvisor.backend.dto.response;

import java.util.List;

public record MarketDataSummaryResponse(
        Long marketSnapshotCount,
        Long fundNavCount,
        List<MarketDataSnapshotResponse> latestMarketSnapshots,
        List<FundNavSnapshotResponse> latestFundNavs
) {
}
