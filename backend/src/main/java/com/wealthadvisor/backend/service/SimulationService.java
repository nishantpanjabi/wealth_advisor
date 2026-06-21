package com.wealthadvisor.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthadvisor.backend.dto.request.SimulationRequest;
import com.wealthadvisor.backend.dto.response.SimulationResponse;
import com.wealthadvisor.backend.entity.Portfolio;
import com.wealthadvisor.backend.entity.SimulationResult;
import com.wealthadvisor.backend.entity.User;
import com.wealthadvisor.backend.entity.UserProfile;
import com.wealthadvisor.backend.enums.ScenarioType;
import com.wealthadvisor.backend.exception.ResourceNotFoundException;
import com.wealthadvisor.backend.repository.PortfolioRepository;
import com.wealthadvisor.backend.repository.SimulationResultRepository;
import com.wealthadvisor.backend.repository.UserProfileRepository;
import com.wealthadvisor.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SimulationService {

    private final SimulationResultRepository simulationResultRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper;

    public SimulationService(
            SimulationResultRepository simulationResultRepository,
            PortfolioRepository portfolioRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            ObjectMapper objectMapper
    ) {
        this.simulationResultRepository = simulationResultRepository;
        this.portfolioRepository = portfolioRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SimulationResponse runPresetScenario(Long userId, ScenarioType scenarioType) {
        Map<String, Double> shocks = presetShocks(scenarioType);
        return runScenario(userId, scenarioType, shocks, 10, 1000);
    }

    @Transactional
    public SimulationResponse runCustomScenario(Long userId, SimulationRequest request) {
        Map<String, Double> shocks = Map.of(
                "equity", defaultShock(request.equityShockPct()),
                "debt", defaultShock(request.debtShockPct()),
                "gold", defaultShock(request.goldShockPct()),
                "liquid", defaultShock(request.liquidShockPct())
        );

        return runScenario(
                userId,
                request.scenarioType(),
                shocks,
                request.projectionYears() == null ? 10 : request.projectionYears(),
                request.iterations() == null ? 1000 : request.iterations()
        );
    }

    @Transactional(readOnly = true)
    public List<SimulationResponse> getHistory(Long userId) {
        return simulationResultRepository.findAllByUserIdOrderByRunAtDesc(userId)
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScenarioType> getPresets() {
        return Arrays.stream(ScenarioType.values()).collect(Collectors.toList());
    }

    private SimulationResponse runScenario(
            Long userId,
            ScenarioType scenarioType,
            Map<String, Double> shocks,
            int projectionYears,
            int iterations
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Portfolio portfolio = portfolioRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found"));

        BigDecimal before = zeroIfNull(portfolio.getTotalCurrentValue());
        BigDecimal after = applyShocks(before, portfolio, shocks);
        double changePercent = calculateChangePercent(before, after);
        MonteCarloSummary monteCarloSummary = runMonteCarlo(after, projectionYears, iterations);
        int recoveryMonths = estimateRecoveryMonths(userId, before, after);

        String monteCarloData = serializeMonteCarloData(monteCarloSummary, shocks, recoveryMonths);

        SimulationResult result = SimulationResult.builder()
                .user(user)
                .scenarioType(scenarioType)
                .portfolioValueBefore(before)
                .portfolioValueAfter(after)
                .changePercent(changePercent)
                .monteCarloData(monteCarloData)
                .build();

        SimulationResult saved = simulationResultRepository.save(result);
        return new SimulationResponse(
                saved.getId(),
                scenarioType,
                before,
                after,
                changePercent,
                recoveryMonths,
                monteCarloSummary.bestCase,
                monteCarloSummary.expectedCase,
                monteCarloSummary.worstCase,
                shocks,
                monteCarloData,
                saved.getRunAt()
        );
    }

    private Map<String, Double> presetShocks(ScenarioType scenarioType) {
        return switch (scenarioType) {
            case BASELINE -> Map.of("equity", 0.0, "debt", 0.0, "gold", 0.0, "liquid", 0.0);
            case BULLISH -> Map.of("equity", 20.0, "debt", 4.0, "gold", 6.0, "liquid", 2.0);
            case BEARISH -> Map.of("equity", -10.0, "debt", 2.0, "gold", 4.0, "liquid", 1.0);
            case STRESS -> Map.of("equity", -30.0, "debt", -5.0, "gold", 8.0, "liquid", 1.0);
        };
    }

    private BigDecimal applyShocks(BigDecimal before, Portfolio portfolio, Map<String, Double> shocks) {
        BigDecimal equityValue = allocate(before, safePct(portfolio.getEquityPct()));
        BigDecimal debtValue = allocate(before, safePct(portfolio.getDebtPct()));
        BigDecimal goldValue = allocate(before, safePct(portfolio.getGoldPct()));
        BigDecimal liquidValue = allocate(before, safePct(portfolio.getLiquidPct()));

        BigDecimal after = shockedValue(equityValue, shocks.get("equity"))
                .add(shockedValue(debtValue, shocks.get("debt")))
                .add(shockedValue(goldValue, shocks.get("gold")))
                .add(shockedValue(liquidValue, shocks.get("liquid")));

        return after.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal allocate(BigDecimal total, double pct) {
        return total.multiply(BigDecimal.valueOf(pct / 100.0)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal shockedValue(BigDecimal base, Double shockPct) {
        return base.multiply(BigDecimal.valueOf(1 + defaultShock(shockPct) / 100.0))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private double calculateChangePercent(BigDecimal before, BigDecimal after) {
        if (before.signum() <= 0) {
            return 0.0;
        }
        return after.subtract(before)
                .divide(before, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private MonteCarloSummary runMonteCarlo(BigDecimal startingValue, int years, int iterations) {
        Random random = new Random(42L);
        double expectedAnnualReturn = 0.11;
        double annualVolatility = 0.18;
        double[] outcomes = new double[iterations];

        for (int i = 0; i < iterations; i++) {
            double value = startingValue.doubleValue();
            for (int year = 0; year < years; year++) {
                double yearlyReturn = expectedAnnualReturn + (random.nextGaussian() * annualVolatility);
                value *= (1 + yearlyReturn);
            }
            outcomes[i] = value;
        }

        Arrays.sort(outcomes);
        BigDecimal worstCase = BigDecimal.valueOf(outcomes[(int) Math.floor(iterations * 0.10)]).setScale(2, RoundingMode.HALF_UP);
        BigDecimal expectedCase = BigDecimal.valueOf(outcomes[(int) Math.floor(iterations * 0.50)]).setScale(2, RoundingMode.HALF_UP);
        BigDecimal bestCase = BigDecimal.valueOf(outcomes[(int) Math.floor(iterations * 0.90)]).setScale(2, RoundingMode.HALF_UP);
        return new MonteCarloSummary(bestCase, expectedCase, worstCase);
    }

    private int estimateRecoveryMonths(Long userId, BigDecimal before, BigDecimal after) {
        if (after.compareTo(before) >= 0) {
            return 0;
        }

        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        BigDecimal monthlyContribution = BigDecimal.ZERO;
        if (profile != null && profile.getMonthlyIncome() != null && profile.getMonthlyExpenses() != null) {
            monthlyContribution = profile.getMonthlyIncome().subtract(profile.getMonthlyExpenses())
                    .max(BigDecimal.ZERO)
                    .multiply(BigDecimal.valueOf(0.30));
        }

        if (monthlyContribution.signum() <= 0) {
            return -1;
        }

        BigDecimal current = after;
        BigDecimal monthlyGrowthRate = BigDecimal.valueOf(0.10 / 12.0);
        int months = 0;
        while (current.compareTo(before) < 0 && months < 600) {
            current = current.multiply(BigDecimal.ONE.add(monthlyGrowthRate)).add(monthlyContribution);
            months++;
        }
        return months >= 600 ? -1 : months;
    }

    private String serializeMonteCarloData(MonteCarloSummary summary, Map<String, Double> shocks, Integer recoveryMonths) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("appliedShocks", shocks);
        payload.put("worstCase", summary.worstCase);
        payload.put("expectedCase", summary.expectedCase);
        payload.put("bestCase", summary.bestCase);
        payload.put("recoveryMonths", recoveryMonths);
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize Monte Carlo data", ex);
        }
    }

    private SimulationResponse mapResponse(SimulationResult result) {
        MonteCarloPayload payload = deserializeMonteCarloData(result.getMonteCarloData());
        return new SimulationResponse(
                result.getId(),
                result.getScenarioType(),
                result.getPortfolioValueBefore(),
                result.getPortfolioValueAfter(),
                result.getChangePercent(),
                payload.recoveryMonths(),
                payload.bestCase(),
                payload.expectedCase(),
                payload.worstCase(),
                payload.appliedShocks(),
                result.getMonteCarloData(),
                result.getRunAt()
        );
    }

    private MonteCarloPayload deserializeMonteCarloData(String monteCarloData) {
        if (monteCarloData == null || monteCarloData.isBlank()) {
            return MonteCarloPayload.empty();
        }

        try {
            return objectMapper.readValue(monteCarloData, MonteCarloPayload.class);
        } catch (JsonProcessingException ex) {
            return MonteCarloPayload.empty();
        }
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private double safePct(Double value) {
        return value == null ? 0.0 : value;
    }

    private double defaultShock(Double value) {
        return value == null ? 0.0 : value;
    }

    private record MonteCarloSummary(
            BigDecimal bestCase,
            BigDecimal expectedCase,
            BigDecimal worstCase
    ) {
    }

    private record MonteCarloPayload(
            Map<String, Double> appliedShocks,
            BigDecimal worstCase,
            BigDecimal expectedCase,
            BigDecimal bestCase,
            Integer recoveryMonths
    ) {
        private static MonteCarloPayload empty() {
            return new MonteCarloPayload(Map.of(), null, null, null, null);
        }
    }
}
