package com.wealthadvisor.backend.dto.response;

import java.util.List;

public record PredictionSummaryResponse(
        PortfolioForecastResponse portfolioForecast,
        SipRecommendationResponse sipRecommendation,
        List<PredictionAnomalyResponse> anomalies
) {
}
