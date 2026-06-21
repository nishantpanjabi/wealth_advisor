package com.wealthadvisor.backend.dto.response;

import java.math.BigDecimal;

public record UserProfileResponse(
        Long id,
        Long userId,
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpenses,
        Double savingsRate,
        Integer age,
        Integer dependents,
        String employmentType,
        BigDecimal netWorth,
        Integer investmentExperienceYears,
        String investmentKnowledge
) {
}
