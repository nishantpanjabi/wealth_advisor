package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.GoalStatus;
import com.wealthadvisor.backend.enums.GoalType;
import java.math.BigDecimal;

public record GoalResponse(
        Long id,
        String name,
        GoalType goalType,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        Integer targetYears,
        Integer monthsRemaining,
        Integer priority,
        GoalStatus status,
        Double expectedAnnualReturn,
        Double expectedInflationRate,
        BigDecimal inflationAdjustedTarget,
        BigDecimal requiredMonthlyInvestment,
        Double progressPercent,
        String trackingStatus
) {
}
