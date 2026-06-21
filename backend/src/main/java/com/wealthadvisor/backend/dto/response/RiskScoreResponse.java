package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.RiskCategory;
import java.time.LocalDateTime;

public record RiskScoreResponse(
        Integer riskScore,
        RiskCategory riskCategory,
        Integer ageScore,
        Integer incomeScore,
        Integer horizonScore,
        Integer toleranceScore,
        Integer experienceScore,
        LocalDateTime calculatedAt
) {
}
