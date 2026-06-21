package com.wealthadvisor.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RiskScoreRequest(
        @NotNull(message = "Investment horizon is required")
        @Min(value = 1, message = "Investment horizon must be at least 1 year")
        @Max(value = 40, message = "Investment horizon cannot exceed 40 years")
        Integer investmentHorizonYears,

        @NotNull(message = "Loss tolerance is required")
        @Min(value = 1, message = "Loss tolerance must be between 1 and 10")
        @Max(value = 10, message = "Loss tolerance must be between 1 and 10")
        Integer lossTolerance,

        @NotNull(message = "Income stability is required")
        @Min(value = 1, message = "Income stability must be between 1 and 10")
        @Max(value = 10, message = "Income stability must be between 1 and 10")
        Integer incomeStability,

        @NotNull(message = "Investment experience is required")
        @Min(value = 0, message = "Investment experience cannot be negative")
        @Max(value = 40, message = "Investment experience cannot exceed 40 years")
        Integer investmentExperienceYears
) {
}
