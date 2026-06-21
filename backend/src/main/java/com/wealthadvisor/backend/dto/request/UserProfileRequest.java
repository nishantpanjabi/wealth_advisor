package com.wealthadvisor.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UserProfileRequest(
        @NotNull(message = "Monthly income is required")
        BigDecimal monthlyIncome,

        @NotNull(message = "Monthly expenses are required")
        BigDecimal monthlyExpenses,

        BigDecimal assetsValue,

        BigDecimal liabilitiesValue,

        @NotNull(message = "Age is required")
        @Min(value = 18, message = "Age must be at least 18")
        @Max(value = 100, message = "Age cannot exceed 100")
        Integer age,

        @NotNull(message = "Dependents is required")
        @Min(value = 0, message = "Dependents cannot be negative")
        @Max(value = 20, message = "Dependents cannot exceed 20")
        Integer dependents,

        @NotBlank(message = "Employment type is required")
        String employmentType,

        @NotNull(message = "Investment experience is required")
        @Min(value = 0, message = "Investment experience cannot be negative")
        @Max(value = 40, message = "Investment experience cannot exceed 40 years")
        Integer investmentExperienceYears,

        @NotBlank(message = "Investment knowledge is required")
        String investmentKnowledge
) {
}
