package com.wealthadvisor.backend.dto.response;

import java.util.List;

public record InsightsSummaryResponse(
        HealthScoreResponse healthScore,
        List<AlertResponse> alerts
) {
}
