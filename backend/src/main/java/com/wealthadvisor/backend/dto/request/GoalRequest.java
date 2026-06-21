package com.wealthadvisor.backend.dto.request;

import com.wealthadvisor.backend.enums.GoalStatus;
import com.wealthadvisor.backend.enums.GoalType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record GoalRequest(
        @NotBlank(message = "Goal name is required")
        String name,

        @NotNull(message = "Goal type is required")
        GoalType goalType,

        @NotNull(message = "Target amount is required")
        @DecimalMin(value = "1.00", message = "Target amount must be greater than zero")
        BigDecimal targetAmount,

        @NotNull(message = "Current amount is required")
        @DecimalMin(value = "0.00", message = "Current amount cannot be negative")
        BigDecimal currentAmount,

        @NotNull(message = "Target years is required")
        @Min(value = 1, message = "Target years must be at least 1")
        @Max(value = 50, message = "Target years cannot exceed 50")
        Integer targetYears,

        @NotNull(message = "Priority is required")
        @Min(value = 1, message = "Priority must be at least 1")
        @Max(value = 10, message = "Priority cannot exceed 10")
        Integer priority,

        @DecimalMin(value = "0.0", message = "Expected annual return cannot be negative")
        Double expectedAnnualReturn,

        @DecimalMin(value = "0.0", message = "Expected inflation rate cannot be negative")
        Double expectedInflationRate,

        GoalStatus status
) {
}
