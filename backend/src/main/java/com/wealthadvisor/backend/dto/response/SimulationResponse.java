package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.ScenarioType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public record SimulationResponse(
        Long simulationId,
        ScenarioType scenarioType,
        BigDecimal portfolioValueBefore,
        BigDecimal portfolioValueAfter,
        Double changePercent,
        Integer recoveryMonths,
        BigDecimal bestCaseValue,
        BigDecimal expectedValue,
        BigDecimal worstCaseValue,
        Map<String, Double> appliedShocks,
        String monteCarloData,
        LocalDateTime runAt
) {
}
