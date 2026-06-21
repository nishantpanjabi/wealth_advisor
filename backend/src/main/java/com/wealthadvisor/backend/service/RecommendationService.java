package com.wealthadvisor.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthadvisor.backend.dto.response.RecommendationActionResponse;
import com.wealthadvisor.backend.dto.response.RecommendationResponse;
import com.wealthadvisor.backend.dto.response.RecommendedFundResponse;
import com.wealthadvisor.backend.entity.Goal;
import com.wealthadvisor.backend.entity.Portfolio;
import com.wealthadvisor.backend.entity.RiskProfile;
import com.wealthadvisor.backend.entity.UserProfile;
import com.wealthadvisor.backend.enums.RiskCategory;
import com.wealthadvisor.backend.repository.GoalRepository;
import com.wealthadvisor.backend.repository.PortfolioRepository;
import com.wealthadvisor.backend.repository.RiskProfileRepository;
import com.wealthadvisor.backend.repository.UserProfileRepository;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationService {

    private final GoalRepository goalRepository;
    private final PortfolioRepository portfolioRepository;
    private final RiskProfileRepository riskProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String mlBaseUrl;
    private final long mlTimeoutMs;
    private final CacheManager cacheManager;
    private final MarketDataIngestionService marketDataIngestionService;

    public RecommendationService(
            GoalRepository goalRepository,
            PortfolioRepository portfolioRepository,
            RiskProfileRepository riskProfileRepository,
            UserProfileRepository userProfileRepository,
            ObjectMapper objectMapper,
            CacheManager cacheManager,
            MarketDataIngestionService marketDataIngestionService,
            @Value("${app.ml.base-url:http://localhost:5000}") String mlBaseUrl,
            @Value("${app.ml.timeout-ms:3000}") long mlTimeoutMs
    ) {
        this.goalRepository = goalRepository;
        this.portfolioRepository = portfolioRepository;
        this.riskProfileRepository = riskProfileRepository;
        this.userProfileRepository = userProfileRepository;
        this.objectMapper = objectMapper;
        this.cacheManager = cacheManager;
        this.marketDataIngestionService = marketDataIngestionService;
        this.mlBaseUrl = mlBaseUrl;
        this.mlTimeoutMs = mlTimeoutMs;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(mlTimeoutMs))
                .build();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "recommendations", key = "#userId + ':' + #investmentAmount + ':' + #years")
    public RecommendationResponse getRecommendations(Long userId, Double investmentAmount, Integer years) {
        return computeRecommendations(userId, investmentAmount, years);
    }

    @Transactional(readOnly = true)
    public RecommendationResponse warmRecommendationCache(Long userId, Double investmentAmount, Integer years) {
        RecommendationResponse response = computeRecommendations(userId, investmentAmount, years);
        Cache cache = cacheManager.getCache("recommendations");
        if (cache != null) {
            cache.put(cacheKey(userId, investmentAmount, years), response);
        }
        return response;
    }

    public boolean triggerModelRetraining() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeBaseUrl() + "/ml/train"))
                    .timeout(Duration.ofMillis(mlTimeoutMs))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}"))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return false;
        }
    }

    public boolean refreshMarketData() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeBaseUrl() + "/ml/market-data/refresh"))
                    .timeout(Duration.ofMillis(mlTimeoutMs))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}"))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return false;
        }
    }

    private RecommendationResponse computeRecommendations(Long userId, Double investmentAmount, Integer years) {
        RecommendationContext context = buildContext(userId, investmentAmount, years);

        try {
            RecommendationResponse remoteResponse = fetchFromMicroservice(context);
            if (remoteResponse != null) {
                return remoteResponse;
            }
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
        }

        return buildFallbackRecommendation(context);
    }

    private RecommendationContext buildContext(Long userId, Double investmentAmount, Integer years) {
        Portfolio portfolio = portfolioRepository.findByUserId(userId).orElse(null);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        RiskCategory riskCategory = riskProfileRepository.findTopByUserIdOrderByCalculatedAtDesc(userId)
                .map(RiskProfile::getRiskCategory)
                .orElse(RiskCategory.MODERATE);
        List<Goal> goals = goalRepository.findAllByUserIdOrderByPriorityAscIdAsc(userId);

        BigDecimal defaultInvestmentAmount = inferInvestmentAmount(profile, goals);
        int projectionYears = sanitizeYears(years);

        return new RecommendationContext(
                userId,
                portfolio,
                profile,
                goals,
                riskCategory,
                sanitizeAmount(investmentAmount, defaultInvestmentAmount),
                projectionYears
        );
    }

    private RecommendationResponse fetchFromMicroservice(RecommendationContext context) throws IOException, InterruptedException {
        String payload = objectMapper.writeValueAsString(buildMicroservicePayload(context));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeBaseUrl() + "/ml/recommend"))
                .timeout(Duration.ofMillis(mlTimeoutMs))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300 || response.body() == null || response.body().isBlank()) {
            return null;
        }

        MicroserviceRecommendationResponse body = objectMapper.readValue(response.body(), MicroserviceRecommendationResponse.class);
        return new RecommendationResponse(
                context.riskCategory(),
                context.investmentAmount(),
                context.years(),
                context.investmentAmount(),
                safeAmount(body.projectedValueAtMaturity()),
                body.fundsToBuy() == null ? List.of() : body.fundsToBuy().stream()
                        .map(item -> new RecommendedFundResponse(
                                item.fundName(),
                                item.assetClass(),
                                roundPct(item.allocationPercent()),
                                safeAmount(item.monthlySipAmount()),
                                defaultText(item.rationale(), "Recommended by the ML scoring service."),
                                roundPct(item.score())
                        ))
                        .toList(),
                body.fundsToSell() == null ? List.of() : body.fundsToSell(),
                body.rebalanceActions() == null ? List.of() : body.rebalanceActions().stream()
                        .map(action -> new RecommendationActionResponse(
                                action.assetClass(),
                                action.action(),
                                roundPct(action.currentAllocationPct()),
                                roundPct(action.targetAllocationPct()),
                                defaultText(action.rationale(), "Rebalance toward the target model allocation.")
                        ))
                        .toList(),
                body.keyReasons() == null ? List.of() : body.keyReasons(),
                defaultText(body.modelSource(), "python-ml-service"),
                false
        );
    }

    private Map<String, Object> buildMicroservicePayload(RecommendationContext context) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", context.userId());
        payload.put("investmentAmount", context.investmentAmount());
        payload.put("years", context.years());
        payload.put("riskCategory", context.riskCategory().name());
        Map<String, Object> portfolioMap = new LinkedHashMap<>();
        portfolioMap.put("equityPct", pct(context.portfolio() == null ? null : context.portfolio().getEquityPct()));
        portfolioMap.put("debtPct", pct(context.portfolio() == null ? null : context.portfolio().getDebtPct()));
        portfolioMap.put("goldPct", pct(context.portfolio() == null ? null : context.portfolio().getGoldPct()));
        portfolioMap.put("liquidPct", pct(context.portfolio() == null ? null : context.portfolio().getLiquidPct()));
        portfolioMap.put("totalCurrentValue", amount(context.portfolio() == null ? null : context.portfolio().getTotalCurrentValue()));
        payload.put("portfolio", portfolioMap);

        Map<String, Object> userProfileMap = new LinkedHashMap<>();
        userProfileMap.put("monthlyIncome", amount(context.profile() == null ? null : context.profile().getMonthlyIncome()));
        userProfileMap.put("monthlyExpenses", amount(context.profile() == null ? null : context.profile().getMonthlyExpenses()));
        userProfileMap.put("age", context.profile() == null ? null : context.profile().getAge());
        userProfileMap.put("savingsRate", context.profile() == null ? null : context.profile().getSavingsRate());
        userProfileMap.put("investmentExperienceYears", context.profile() == null ? null : context.profile().getInvestmentExperienceYears());
        payload.put("userProfile", userProfileMap);
        payload.put("marketData", marketDataIngestionService.latestMarketContext());
        payload.put("goals", context.goals().stream()
                .map(goal -> {
                    Map<String, Object> goalMap = new LinkedHashMap<>();
                    goalMap.put("name", goal.getName());
                    goalMap.put("goalType", goal.getGoalType() == null ? "OTHER" : goal.getGoalType().name());
                    goalMap.put("priority", goal.getPriority() == null ? 99 : goal.getPriority());
                    goalMap.put("targetYears", goal.getTargetYears() == null ? context.years() : goal.getTargetYears());
                    goalMap.put("requiredMonthlyInvestment", amount(goal.getRequiredMonthlyInvestment()));
                    return goalMap;
                })
                .toList());
        return payload;
    }

    private RecommendationResponse buildFallbackRecommendation(RecommendationContext context) {
        AllocationModel model = allocationModel(context.riskCategory());
        double marketReturnAdjustment = marketReturnAdjustment();
        BigDecimal projectedValue = futureValue(
                amount(context.portfolio() == null ? null : context.portfolio().getTotalCurrentValue()),
                context.investmentAmount(),
                (model.expectedReturn() + marketReturnAdjustment) / 100.0,
                context.years()
        );

        List<RecommendedFundResponse> fundsToBuy = fallbackFunds(model, context.investmentAmount(), context.riskCategory());
        List<RecommendationActionResponse> rebalanceActions = fallbackActions(context.portfolio(), model);
        List<String> fundsToSell = rebalanceActions.stream()
                .filter(action -> "SELL".equals(action.action()))
                .map(action -> action.assetClass() + ": " + action.rationale())
                .toList();
        List<String> reasons = new ArrayList<>();
        reasons.add("Matched to your " + context.riskCategory().name() + " risk profile.");
        reasons.add("Uses current portfolio allocation, goals, and monthly surplus already stored in the app.");
        String marketSummary = summarizeMarketContext();
        if (marketSummary != null) {
            reasons.add(marketSummary);
        }
        if (!context.goals().isEmpty()) {
            reasons.add("Prioritized around your top goal: " + context.goals().getFirst().getName() + ".");
        }

        return new RecommendationResponse(
                context.riskCategory(),
                context.investmentAmount(),
                context.years(),
                context.investmentAmount(),
                projectedValue,
                fundsToBuy,
                fundsToSell,
                rebalanceActions,
                reasons,
                "spring-fallback-heuristic",
                true
        );
    }

    private List<RecommendedFundResponse> fallbackFunds(AllocationModel model, BigDecimal investmentAmount, RiskCategory riskCategory) {
        List<FundTemplate> templates = switch (riskCategory) {
            case CONSERVATIVE -> List.of(
                    new FundTemplate("ICICI Prudential Corporate Bond Fund", "DEBT", 45.0, "Stability anchor for conservative allocation."),
                    new FundTemplate("HDFC Gold ETF", "GOLD", 15.0, "Inflation hedge and diversification sleeve."),
                    new FundTemplate("Parag Parikh Flexi Cap Fund", "EQUITY", 20.0, "Controlled equity exposure for long-term growth."),
                    new FundTemplate("Liquid Treasury Fund", "LIQUID", 20.0, "Keeps near-term cash available for goals and rebalancing.")
            );
            case MODERATE -> List.of(
                    new FundTemplate("UTI Nifty 50 Index Fund", "EQUITY", 30.0, "Core large-cap equity allocation."),
                    new FundTemplate("Parag Parikh Flexi Cap Fund", "EQUITY", 20.0, "Diversified equity growth engine."),
                    new FundTemplate("ICICI Prudential Corporate Bond Fund", "DEBT", 25.0, "Portfolio ballast during drawdowns."),
                    new FundTemplate("HDFC Gold ETF", "GOLD", 15.0, "Diversifier for stress periods."),
                    new FundTemplate("Liquid Treasury Fund", "LIQUID", 10.0, "Keeps liquidity for tactical deployment.")
            );
            case AGGRESSIVE -> List.of(
                    new FundTemplate("UTI Nifty 50 Index Fund", "EQUITY", 35.0, "Core equity compounding exposure."),
                    new FundTemplate("Mirae Asset Large & Midcap Fund", "EQUITY", 25.0, "Adds growth bias with diversified mid-cap exposure."),
                    new FundTemplate("Parag Parikh Flexi Cap Fund", "EQUITY", 15.0, "Balances growth with global diversification style."),
                    new FundTemplate("ICICI Prudential Corporate Bond Fund", "DEBT", 10.0, "Reduces full-cycle volatility."),
                    new FundTemplate("HDFC Gold ETF", "GOLD", 10.0, "Shock absorber in risk-off markets."),
                    new FundTemplate("Liquid Treasury Fund", "LIQUID", 5.0, "Dry powder for rebalancing.")
            );
        };

        return templates.stream()
                .sorted(Comparator.comparing(FundTemplate::allocationPercent).reversed())
                .map(template -> new RecommendedFundResponse(
                        template.name(),
                        template.assetClass(),
                        template.allocationPercent(),
                        sipAmount(investmentAmount, template.allocationPercent()),
                        template.rationale(),
                        roundPct(60.0 + (template.allocationPercent() / 2.0))
                ))
                .toList();
    }

    private List<RecommendationActionResponse> fallbackActions(Portfolio portfolio, AllocationModel model) {
        return List.of(
                buildAction("EQUITY", pct(portfolio == null ? null : portfolio.getEquityPct()), model.equityPct()),
                buildAction("DEBT", pct(portfolio == null ? null : portfolio.getDebtPct()), model.debtPct()),
                buildAction("GOLD", pct(portfolio == null ? null : portfolio.getGoldPct()), model.goldPct()),
                buildAction("LIQUID", pct(portfolio == null ? null : portfolio.getLiquidPct()), model.liquidPct())
        );
    }

    private RecommendationActionResponse buildAction(String assetClass, Double current, Double target) {
        double drift = target - current;
        String action;
        String rationale;
        if (Math.abs(drift) < 4.0) {
            action = "HOLD";
            rationale = "Current allocation is already close to the target model.";
        } else if (drift > 0) {
            action = "BUY";
            rationale = "Increase allocation by about " + roundPct(drift) + "% to align with the target mix.";
        } else {
            action = "SELL";
            rationale = "Trim allocation by about " + roundPct(Math.abs(drift)) + "% to reduce concentration risk.";
        }
        return new RecommendationActionResponse(assetClass, action, roundPct(current), roundPct(target), rationale);
    }

    private AllocationModel allocationModel(RiskCategory riskCategory) {
        return switch (riskCategory) {
            case CONSERVATIVE -> new AllocationModel(20.0, 50.0, 15.0, 15.0, 7.2);
            case MODERATE -> new AllocationModel(50.0, 25.0, 15.0, 10.0, 9.7);
            case AGGRESSIVE -> new AllocationModel(75.0, 10.0, 10.0, 5.0, 12.0);
        };
    }

    private BigDecimal futureValue(BigDecimal currentValue, BigDecimal monthlyInvestment, double annualReturn, int years) {
        double monthlyRate = annualReturn / 12.0;
        int months = years * 12;
        double currentGrowth = currentValue.doubleValue() * Math.pow(1 + annualReturn, years);
        double sipGrowth = monthlyRate == 0.0
                ? monthlyInvestment.doubleValue() * months
                : monthlyInvestment.doubleValue() * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
        return BigDecimal.valueOf(currentGrowth + sipGrowth).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal inferInvestmentAmount(UserProfile profile, List<Goal> goals) {
        BigDecimal requiredByGoals = goals.stream()
                .map(goal -> amount(goal.getRequiredMonthlyInvestment()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (profile == null || profile.getMonthlyIncome() == null || profile.getMonthlyExpenses() == null) {
            return requiredByGoals.signum() > 0 ? requiredByGoals : BigDecimal.valueOf(5000).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal surplus = amount(profile.getMonthlyIncome()).subtract(amount(profile.getMonthlyExpenses())).max(BigDecimal.ZERO);
        BigDecimal recommended = surplus.multiply(BigDecimal.valueOf(0.55)).setScale(2, RoundingMode.HALF_UP);
        if (requiredByGoals.signum() > 0) {
            return requiredByGoals.min(surplus.max(BigDecimal.ZERO)).max(recommended.min(surplus));
        }
        return recommended.signum() > 0 ? recommended : BigDecimal.valueOf(5000).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal sanitizeAmount(Double requested, BigDecimal fallback) {
        if (requested == null || requested <= 0) {
            return fallback.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(requested).setScale(2, RoundingMode.HALF_UP);
    }

    private int sanitizeYears(Integer years) {
        if (years == null) {
            return 10;
        }
        return Math.max(1, Math.min(30, years));
    }

    private String normalizeBaseUrl() {
        return mlBaseUrl.endsWith("/") ? mlBaseUrl.substring(0, mlBaseUrl.length() - 1) : mlBaseUrl;
    }

    private double marketReturnAdjustment() {
        return marketDataIngestionService.latestMarketContext().values().stream()
                .map(entry -> entry.get("returnAdjustment"))
                .filter(Double.class::isInstance)
                .map(Double.class::cast)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }

    private String summarizeMarketContext() {
        Map<String, Map<String, Object>> marketContext = marketDataIngestionService.latestMarketContext();
        if (marketContext.isEmpty()) {
            return null;
        }
        return "Stored market snapshot says: " + String.join(", ", marketContext.entrySet().stream()
                .map(entry -> entry.getKey().toLowerCase() + "=" + String.valueOf(entry.getValue().get("marketRegime")))
                .toList());
    }

    private String cacheKey(Long userId, Double investmentAmount, Integer years) {
        return userId + ":" + investmentAmount + ":" + years;
    }

    private BigDecimal sipAmount(BigDecimal total, Double allocationPct) {
        return total.multiply(BigDecimal.valueOf(allocationPct / 100.0)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal amount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal safeAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private double pct(Double value) {
        return value == null ? 0.0 : value;
    }

    private Double roundPct(Double value) {
        return value == null ? 0.0 : BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private record RecommendationContext(
            Long userId,
            Portfolio portfolio,
            UserProfile profile,
            List<Goal> goals,
            RiskCategory riskCategory,
            BigDecimal investmentAmount,
            Integer years
    ) {
    }

    private record AllocationModel(
            Double equityPct,
            Double debtPct,
            Double goldPct,
            Double liquidPct,
            Double expectedReturn
    ) {
    }

    private record FundTemplate(
            String name,
            String assetClass,
            Double allocationPercent,
            String rationale
    ) {
    }

    private record MicroserviceRecommendationResponse(
            BigDecimal projectedValueAtMaturity,
            List<MicroserviceFundItem> fundsToBuy,
            List<String> fundsToSell,
            List<MicroserviceActionItem> rebalanceActions,
            List<String> keyReasons,
            String modelSource
    ) {
    }

    private record MicroserviceFundItem(
            String fundName,
            String assetClass,
            Double allocationPercent,
            BigDecimal monthlySipAmount,
            String rationale,
            Double score
    ) {
    }

    private record MicroserviceActionItem(
            String assetClass,
            String action,
            Double currentAllocationPct,
            Double targetAllocationPct,
            String rationale
    ) {
    }
}
