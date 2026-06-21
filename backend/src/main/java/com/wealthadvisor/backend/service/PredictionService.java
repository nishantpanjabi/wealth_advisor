package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.response.GoalSipRecommendationResponse;
import com.wealthadvisor.backend.dto.response.PortfolioForecastResponse;
import com.wealthadvisor.backend.dto.response.PredictionAnomalyResponse;
import com.wealthadvisor.backend.dto.response.PredictionSummaryResponse;
import com.wealthadvisor.backend.dto.response.SipRecommendationResponse;
import com.wealthadvisor.backend.entity.Goal;
import com.wealthadvisor.backend.entity.Portfolio;
import com.wealthadvisor.backend.entity.RiskProfile;
import com.wealthadvisor.backend.entity.UserProfile;
import com.wealthadvisor.backend.enums.GoalType;
import com.wealthadvisor.backend.enums.RiskCategory;
import com.wealthadvisor.backend.repository.GoalRepository;
import com.wealthadvisor.backend.repository.PortfolioRepository;
import com.wealthadvisor.backend.repository.RiskProfileRepository;
import com.wealthadvisor.backend.repository.UserProfileRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PredictionService {

    private final PortfolioRepository portfolioRepository;
    private final GoalRepository goalRepository;
    private final UserProfileRepository userProfileRepository;
    private final RiskProfileRepository riskProfileRepository;

    public PredictionService(
            PortfolioRepository portfolioRepository,
            GoalRepository goalRepository,
            UserProfileRepository userProfileRepository,
            RiskProfileRepository riskProfileRepository
    ) {
        this.portfolioRepository = portfolioRepository;
        this.goalRepository = goalRepository;
        this.userProfileRepository = userProfileRepository;
        this.riskProfileRepository = riskProfileRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "predictions", key = "'summary:' + #userId + ':' + #projectionYears")
    public PredictionSummaryResponse getSummary(Long userId, Integer projectionYears) {
        int years = sanitizeYears(projectionYears);
        return new PredictionSummaryResponse(
                getPortfolioForecast(userId, years),
                getSipRecommendation(userId),
                getAnomalies(userId)
        );
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "predictions", key = "'forecast:' + #userId + ':' + #projectionYears")
    public PortfolioForecastResponse getPortfolioForecast(Long userId, Integer projectionYears) {
        int years = sanitizeYears(projectionYears);
        Portfolio portfolio = portfolioRepository.findByUserId(userId).orElse(null);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        RiskCategory riskCategory = riskProfileRepository.findTopByUserIdOrderByCalculatedAtDesc(userId)
                .map(RiskProfile::getRiskCategory)
                .orElse(RiskCategory.MODERATE);

        BigDecimal currentValue = portfolioValue(portfolio);
        BigDecimal monthlyContribution = recommendedContribution(profile, riskCategory);
        double annualReturn = assumedReturn(riskCategory);
        double annualVolatility = assumedVolatility(riskCategory);

        BigDecimal projectedValue = futureValue(currentValue, monthlyContribution, annualReturn, years);
        BigDecimal projectedGain = projectedValue.subtract(currentValue).setScale(2, RoundingMode.HALF_UP);
        double projectedCagr = currentValue.signum() <= 0
                ? annualReturn * 100
                : (Math.pow(projectedValue.doubleValue() / currentValue.doubleValue(), 1.0 / years) - 1.0) * 100.0;

        return new PortfolioForecastResponse(
                years,
                riskCategory,
                currentValue,
                monthlyContribution,
                round(annualReturn * 100),
                round(annualVolatility * 100),
                projectedValue,
                projectedGain,
                round(projectedCagr),
                round(estimateDownsideProbability(riskCategory, portfolio, profile)),
                confidenceBand(riskCategory),
                buildForecastAssumptions(riskCategory, monthlyContribution, years)
        );
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "predictions", key = "'sip:' + #userId")
    public SipRecommendationResponse getSipRecommendation(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        List<Goal> goals = goalRepository.findAllByUserIdOrderByPriorityAscIdAsc(userId);
        RiskCategory riskCategory = riskProfileRepository.findTopByUserIdOrderByCalculatedAtDesc(userId)
                .map(RiskProfile::getRiskCategory)
                .orElse(RiskCategory.MODERATE);

        BigDecimal income = amount(profile == null ? null : profile.getMonthlyIncome());
        BigDecimal expenses = amount(profile == null ? null : profile.getMonthlyExpenses());
        BigDecimal surplus = income.subtract(expenses).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal recommendedMonthlyInvestment = recommendedContribution(profile, riskCategory);
        BigDecimal emergencyFundGap = emergencyFundGap(profile, goals);

        List<GoalSipRecommendationResponse> goalRecommendations = buildGoalRecommendations(goals, recommendedMonthlyInvestment);
        BigDecimal totalGoalSipRequired = goals.stream()
                .map(goal -> amount(goal.getRequiredMonthlyInvestment()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalGoalSipRecommended = goalRecommendations.stream()
                .map(GoalSipRecommendationResponse::recommendedMonthlyInvestment)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new SipRecommendationResponse(
                income,
                expenses,
                surplus,
                recommendedMonthlyInvestment,
                emergencyFundGap,
                totalGoalSipRequired,
                totalGoalSipRecommended,
                classifySipBand(recommendedMonthlyInvestment, surplus),
                goalRecommendations,
                buildSipNotes(profile, riskCategory, totalGoalSipRequired, recommendedMonthlyInvestment, emergencyFundGap)
        );
    }

    @Transactional(readOnly = true)
    public List<PredictionAnomalyResponse> getAnomalies(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        Portfolio portfolio = portfolioRepository.findByUserId(userId).orElse(null);
        List<Goal> goals = goalRepository.findAllByUserIdOrderByPriorityAscIdAsc(userId);
        RiskCategory riskCategory = riskProfileRepository.findTopByUserIdOrderByCalculatedAtDesc(userId)
                .map(RiskProfile::getRiskCategory)
                .orElse(RiskCategory.MODERATE);

        List<PredictionAnomalyResponse> anomalies = new ArrayList<>();

        if (profile == null || profile.getMonthlyIncome() == null || profile.getMonthlyExpenses() == null) {
            anomalies.add(new PredictionAnomalyResponse(
                    "HIGH",
                    "Financial profile incomplete",
                    "profile_completion",
                    0.0,
                    100.0,
                    "Complete income and expense data before relying on projections."
            ));
            return anomalies;
        }

        BigDecimal income = amount(profile.getMonthlyIncome());
        BigDecimal expenses = amount(profile.getMonthlyExpenses());
        double expenseRatio = income.signum() <= 0 ? 100.0 : expenses.divide(income, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue();
        if (expenseRatio >= 85.0) {
            anomalies.add(new PredictionAnomalyResponse(
                    "HIGH",
                    "Expense ratio is too high",
                    "expense_ratio_pct",
                    round(expenseRatio),
                    85.0,
                    "Reduce monthly burn or delay risky investments until surplus improves."
            ));
        }

        BigDecimal invested = portfolio == null ? BigDecimal.ZERO : amount(portfolio.getTotalInvestedValue());
        BigDecimal current = portfolio == null ? BigDecimal.ZERO : amount(portfolio.getTotalCurrentValue());
        if (invested.signum() > 0) {
            double drawdownPct = invested.subtract(current).max(BigDecimal.ZERO)
                    .divide(invested, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
            if (drawdownPct >= 12.0) {
                anomalies.add(new PredictionAnomalyResponse(
                        "MEDIUM",
                        "Portfolio drawdown is elevated",
                        "drawdown_pct",
                        round(drawdownPct),
                        12.0,
                        "Review concentration risk and phase future contributions instead of lump-sum additions."
                ));
            }
        }

        double targetEquity = switch (riskCategory) {
            case CONSERVATIVE -> 20.0;
            case MODERATE -> 50.0;
            case AGGRESSIVE -> 75.0;
        };
        double currentEquity = portfolio == null || portfolio.getEquityPct() == null ? 0.0 : portfolio.getEquityPct();
        if (currentEquity > targetEquity + 15.0) {
            anomalies.add(new PredictionAnomalyResponse(
                    "MEDIUM",
                    "Equity concentration is above model target",
                    "equity_allocation_pct",
                    round(currentEquity),
                    round(targetEquity + 15.0),
                    "Rebalance gradually toward the recommended allocation profile."
            ));
        }

        BigDecimal totalGoalSipRequired = goals.stream()
                .map(goal -> amount(goal.getRequiredMonthlyInvestment()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal surplus = income.subtract(expenses).max(BigDecimal.ZERO);
        if (totalGoalSipRequired.compareTo(surplus) > 0 && totalGoalSipRequired.signum() > 0) {
            anomalies.add(new PredictionAnomalyResponse(
                    "HIGH",
                    "Goal SIP demand exceeds monthly surplus",
                    "goal_sip_gap",
                    totalGoalSipRequired.subtract(surplus).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                    0.0,
                    "Re-prioritize goals, extend timelines, or increase savings capacity."
            ));
        }

        BigDecimal emergencyGap = emergencyFundGap(profile, goals);
        if (emergencyGap.signum() > 0) {
            anomalies.add(new PredictionAnomalyResponse(
                    "MEDIUM",
                    "Emergency fund target is underfunded",
                    "emergency_fund_gap",
                    emergencyGap.setScale(2, RoundingMode.HALF_UP).doubleValue(),
                    0.0,
                    "Build 3-6 months of expenses before raising portfolio risk."
            ));
        }

        if (anomalies.isEmpty()) {
            anomalies.add(new PredictionAnomalyResponse(
                    "LOW",
                    "No major anomalies detected",
                    "portfolio_health",
                    100.0,
                    0.0,
                    "Current portfolio, savings, and goal signals are within the expected range."
            ));
        }

        return anomalies;
    }

    private List<GoalSipRecommendationResponse> buildGoalRecommendations(List<Goal> goals, BigDecimal monthlyBudget) {
        List<GoalSipRecommendationResponse> recommendations = new ArrayList<>();
        BigDecimal remainingBudget = monthlyBudget;

        for (Goal goal : goals) {
            BigDecimal required = amount(goal.getRequiredMonthlyInvestment());
            BigDecimal recommended = required.min(remainingBudget).setScale(2, RoundingMode.HALF_UP);
            BigDecimal gap = required.subtract(recommended).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            String fundingStatus = gap.signum() == 0 ? "FULLY_FUNDED" : (recommended.signum() > 0 ? "PARTIALLY_FUNDED" : "UNFUNDED");

            recommendations.add(new GoalSipRecommendationResponse(
                    goal.getId(),
                    goal.getName(),
                    goal.getPriority(),
                    required,
                    recommended,
                    gap,
                    fundingStatus
            ));

            remainingBudget = remainingBudget.subtract(recommended).max(BigDecimal.ZERO);
        }

        return recommendations;
    }

    private BigDecimal futureValue(BigDecimal presentValue, BigDecimal monthlyContribution, double annualReturn, int years) {
        double monthlyRate = annualReturn / 12.0;
        int months = years * 12;
        double pvGrowth = presentValue.doubleValue() * Math.pow(1 + annualReturn, years);
        double sipGrowth = monthlyRate == 0.0
                ? monthlyContribution.doubleValue() * months
                : monthlyContribution.doubleValue() * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
        return BigDecimal.valueOf(pvGrowth + sipGrowth).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal recommendedContribution(UserProfile profile, RiskCategory riskCategory) {
        if (profile == null || profile.getMonthlyIncome() == null || profile.getMonthlyExpenses() == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal surplus = amount(profile.getMonthlyIncome()).subtract(amount(profile.getMonthlyExpenses())).max(BigDecimal.ZERO);
        BigDecimal investableRatio = switch (riskCategory) {
            case CONSERVATIVE -> BigDecimal.valueOf(0.40);
            case MODERATE -> BigDecimal.valueOf(0.55);
            case AGGRESSIVE -> BigDecimal.valueOf(0.70);
        };

        return surplus.multiply(investableRatio).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal emergencyFundGap(UserProfile profile, List<Goal> goals) {
        if (profile == null || profile.getMonthlyExpenses() == null || profile.getMonthlyExpenses().signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal currentEmergencyFund = goals.stream()
                .filter(goal -> goal.getGoalType() == GoalType.EMERGENCY_FUND)
                .map(goal -> amount(goal.getCurrentAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal targetEmergencyFund = amount(profile.getMonthlyExpenses()).multiply(BigDecimal.valueOf(6));
        return targetEmergencyFund.subtract(currentEmergencyFund).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private double estimateDownsideProbability(RiskCategory riskCategory, Portfolio portfolio, UserProfile profile) {
        double base = switch (riskCategory) {
            case CONSERVATIVE -> 18.0;
            case MODERATE -> 28.0;
            case AGGRESSIVE -> 38.0;
        };

        if (portfolio != null && portfolio.getEquityPct() != null) {
            base += Math.max(0.0, (portfolio.getEquityPct() - 50.0) * 0.20);
        }
        if (profile != null && profile.getSavingsRate() != null) {
            base -= Math.min(8.0, profile.getSavingsRate() / 10.0);
        }
        return Math.max(8.0, Math.min(65.0, base));
    }

    private List<String> buildForecastAssumptions(RiskCategory riskCategory, BigDecimal monthlyContribution, int years) {
        return List.of(
                "Projection horizon: " + years + " years",
                "Monthly contribution assumption: " + monthlyContribution.setScale(2, RoundingMode.HALF_UP),
                "Return and volatility are derived from the " + riskCategory.name() + " risk profile template",
                "Forecast uses current portfolio value plus monthly SIP-style contributions"
        );
    }

    private List<String> buildSipNotes(
            UserProfile profile,
            RiskCategory riskCategory,
            BigDecimal totalGoalSipRequired,
            BigDecimal recommendedMonthlyInvestment,
            BigDecimal emergencyFundGap
    ) {
        List<String> notes = new ArrayList<>();
        notes.add("Recommendation is based on current monthly surplus and " + riskCategory.name() + " risk appetite.");
        if (recommendedMonthlyInvestment.compareTo(totalGoalSipRequired) < 0) {
            notes.add("Current investable surplus does not fully cover all goal SIP requirements.");
        }
        if (emergencyFundGap.signum() > 0) {
            notes.add("A part of the monthly surplus should first be redirected toward emergency reserves.");
        }
        if (profile != null && profile.getSavingsRate() != null && profile.getSavingsRate() < 20.0) {
            notes.add("Improving savings rate above 20% will materially improve goal funding flexibility.");
        }
        return notes;
    }

    private String classifySipBand(BigDecimal recommendedMonthlyInvestment, BigDecimal surplus) {
        if (recommendedMonthlyInvestment.signum() <= 0 || surplus.signum() <= 0) {
            return "NOT_READY";
        }
        BigDecimal ratio = recommendedMonthlyInvestment.divide(surplus, 4, RoundingMode.HALF_UP);
        if (ratio.compareTo(BigDecimal.valueOf(0.40)) <= 0) {
            return "COMFORTABLE";
        }
        if (ratio.compareTo(BigDecimal.valueOf(0.70)) <= 0) {
            return "BALANCED";
        }
        return "STRETCHED";
    }

    private String confidenceBand(RiskCategory riskCategory) {
        return switch (riskCategory) {
            case CONSERVATIVE -> "HIGHER_CONFIDENCE";
            case MODERATE -> "MEDIUM_CONFIDENCE";
            case AGGRESSIVE -> "WIDER_OUTCOME_RANGE";
        };
    }

    private double assumedReturn(RiskCategory riskCategory) {
        return switch (riskCategory) {
            case CONSERVATIVE -> 0.072;
            case MODERATE -> 0.097;
            case AGGRESSIVE -> 0.120;
        };
    }

    private double assumedVolatility(RiskCategory riskCategory) {
        return switch (riskCategory) {
            case CONSERVATIVE -> 0.055;
            case MODERATE -> 0.088;
            case AGGRESSIVE -> 0.125;
        };
    }

    private int sanitizeYears(Integer years) {
        if (years == null) {
            return 5;
        }
        return Math.max(1, Math.min(30, years));
    }

    private BigDecimal amount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal portfolioValue(Portfolio portfolio) {
        return portfolio == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : amount(portfolio.getTotalCurrentValue());
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
