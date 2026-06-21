package com.wealthadvisor.backend.dto.request;

import com.wealthadvisor.backend.enums.ScenarioType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SimulationRequest(
        @NotNull(message = "Scenario type is required")
        ScenarioType scenarioType,

        @DecimalMin(value = "-100.0", message = "Equity shock must be >= -100")
        Double equityShockPct,

        @DecimalMin(value = "-100.0", message = "Debt shock must be >= -100")
        Double debtShockPct,

        @DecimalMin(value = "-100.0", message = "Gold shock must be >= -100")
        Double goldShockPct,

        @DecimalMin(value = "-100.0", message = "Liquid shock must be >= -100")
        Double liquidShockPct,

        @Min(value = 1, message = "Projection years must be at least 1")
        @Max(value = 40, message = "Projection years cannot exceed 40")
        Integer projectionYears,

        @Min(value = 100, message = "Iterations must be at least 100")
        @Max(value = 5000, message = "Iterations cannot exceed 5000")
        Integer iterations
) {
}
