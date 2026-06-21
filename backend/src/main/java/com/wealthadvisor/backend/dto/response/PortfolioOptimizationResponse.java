package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.RiskCategory;
import java.math.BigDecimal;
import java.util.List;

public record PortfolioOptimizationResponse(
        Long portfolioId,
        RiskCategory riskCategory,
        String allocationProfile,
        Double expectedAnnualReturn,
        Double estimatedVolatility,
        BigDecimal totalCurrentValue,
        List<AllocationBucketResponse> allocationBuckets,
        List<String> subAssetRecommendations,
        List<EfficientFrontierPointResponse> efficientFrontier,
        List<TaxReviewResponse> taxReviewFlags
) {
}
