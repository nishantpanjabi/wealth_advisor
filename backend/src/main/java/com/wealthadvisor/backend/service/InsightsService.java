package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.response.AlertResponse;
import com.wealthadvisor.backend.dto.response.HealthScoreResponse;
import com.wealthadvisor.backend.dto.response.InsightsSummaryResponse;
import com.wealthadvisor.backend.entity.Goal;
import com.wealthadvisor.backend.entity.Portfolio;
import com.wealthadvisor.backend.entity.RiskProfile;
import com.wealthadvisor.backend.entity.UserProfile;
import com.wealthadvisor.backend.enums.AlertSeverity;
import com.wealthadvisor.backend.enums.GoalStatus;
import com.wealthadvisor.backend.enums.RiskCategory;
import com.wealthadvisor.backend.repository.GoalRepository;
import com.wealthadvisor.backend.repository.PortfolioRepository;
import com.wealthadvisor.backend.repository.RiskProfileRepository;
import com.wealthadvisor.backend.repository.UserProfileRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InsightsService {

    private final UserProfileRepository userProfileRepository;
    private final GoalRepository goalRepository;
    private final PortfolioRepository portfolioRepository;
    private final RiskProfileRepository riskProfileRepository;
    private final AlertService alertService;

    public InsightsService(
            UserProfileRepository userProfileRepository,
            GoalRepository goalRepository,
            PortfolioRepository portfolioRepository,
            RiskProfileRepository riskProfileRepository,
            AlertService alertService
    ) {
        this.userProfileRepository = userProfileRepository;
        this.goalRepository = goalRepository;
        this.portfolioRepository = portfolioRepository;
        this.riskProfileRepository = riskProfileRepository;
        this.alertService = alertService;
    }

    @Transactional
    public InsightsSummaryResponse generateInsights(Long userId) {
        generateAlerts(userId);
        return new InsightsSummaryResponse(calculateHealthScore(userId), alertService.getActiveAlerts(userId));
    }

    @Transactional(readOnly = true)
    public HealthScoreResponse calculateHealthScore(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        List<Goal> goals = goalRepository.findAllByUserIdOrderByPriorityAscIdAsc(userId);
        Portfolio portfolio = portfolioRepository.findByUserId(userId).orElse(null);

        double savingsScore = computeSavingsScore(profile);
        double goalScore = computeGoalScore(goals);
        double diversificationScore = computeDiversificationScore(portfolio);
        double emergencyFundScore = computeEmergencyFundScore(profile, goals);

        int totalScore = (int) Math.round(
                (savingsScore * 0.30) +
                (goalScore * 0.25) +
                (diversificationScore * 0.25) +
                (emergencyFundScore * 0.20)
        );

        return new HealthScoreResponse(
                totalScore,
                round(savingsScore),
                round(goalScore),
                round(diversificationScore),
                round(emergencyFundScore)
        );
    }

    @Transactional
    public List<AlertResponse> generateAlerts(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        List<Goal> goals = goalRepository.findAllByUserIdOrderByPriorityAscIdAsc(userId);
        Portfolio portfolio = portfolioRepository.findByUserId(userId).orElse(null);
        RiskProfile riskProfile = riskProfileRepository.findTopByUserIdOrderByCalculatedAtDesc(userId).orElse(null);

        if (profile == null || profile.getMonthlyIncome() == null || profile.getMonthlyExpenses() == null) {
            alertService.createAlertIfAbsent(
                    userId,
                    AlertSeverity.HIGH,
                    "Your financial profile is incomplete.",
                    "Complete your profile to unlock accurate planning and risk insights."
            );
            return alertService.getActiveAlerts(userId);
        }

        BigDecimal monthlySurplus = profile.getMonthlyIncome().subtract(profile.getMonthlyExpenses());
        if (monthlySurplus.signum() <= 0) {
            alertService.createAlertIfAbsent(
                    userId,
                    AlertSeverity.HIGH,
                    "Your monthly expenses are higher than or equal to your income.",
                    "Reduce expenses or increase income before taking more investment risk."
            );
        }

        if (profile.getSavingsRate() != null && profile.getSavingsRate() < 15.0) {
            alertService.createAlertIfAbsent(
                    userId,
                    AlertSeverity.MEDIUM,
                    "Your savings rate is below 15%.",
                    "Increase monthly savings gradually to improve goal funding capacity."
            );
        }

        if (riskProfile == null) {
            alertService.createAlertIfAbsent(
                    userId,
                    AlertSeverity.MEDIUM,
                    "You have not calculated your risk profile yet.",
                    "Run risk scoring to unlock suitable allocation recommendations."
            );
        }

        if (portfolio == null || zeroIfNull(portfolio.getTotalCurrentValue()).signum() == 0) {
            alertService.createAlertIfAbsent(
                    userId,
                    AlertSeverity.MEDIUM,
                    "Your portfolio has no active investments.",
                    "Add investments to track allocation, performance, and simulations."
            );
        }

        if (portfolio != null && riskProfile != null && riskProfile.getRiskCategory() != RiskCategory.AGGRESSIVE) {
            double equityPct = portfolio.getEquityPct() == null ? 0.0 : portfolio.getEquityPct();
            if (equityPct > 70.0) {
                alertService.createAlertIfAbsent(
                        userId,
                        AlertSeverity.HIGH,
                        "Your portfolio appears overexposed to equity for your current risk profile.",
                        "Review the portfolio optimization recommendations and rebalance."
                );
            }
        }

        boolean hasEmergencyGoal = goals.stream().anyMatch(goal -> goal.getGoalType().name().equals("EMERGENCY_FUND"));
        if (!hasEmergencyGoal) {
            alertService.createAlertIfAbsent(
                    userId,
                    AlertSeverity.MEDIUM,
                    "You do not have an emergency fund goal.",
                    "Create an emergency fund goal covering 3-6 months of expenses."
            );
        }

        for (Goal goal : goals) {
            String trackingStatus = deriveGoalTrackingStatus(profile, goal);
            if ("AT_RISK".equals(trackingStatus)) {
                alertService.createAlertIfAbsent(
                        userId,
                        AlertSeverity.HIGH,
                        "Goal '" + goal.getName() + "' is at risk of missing its target.",
                        "Increase SIP, extend the timeline, or lower the target amount."
                );
            } else if ("STRETCH".equals(trackingStatus)) {
                alertService.createAlertIfAbsent(
                        userId,
                        AlertSeverity.MEDIUM,
                        "Goal '" + goal.getName() + "' is achievable but stretched.",
                        "Monitor contributions closely and review this goal monthly."
                );
            }
        }

        return alertService.getActiveAlerts(userId);
    }

    private double computeSavingsScore(UserProfile profile) {
        if (profile == null || profile.getSavingsRate() == null) {
            return 0.0;
        }
        return Math.min(100.0, profile.getSavingsRate() * 2.0);
    }

    private double computeGoalScore(List<Goal> goals) {
        if (goals.isEmpty()) {
            return 0.0;
        }
        double total = 0.0;
        for (Goal goal : goals) {
            if (goal.getStatus() == GoalStatus.ACHIEVED) {
                total += 100.0;
                continue;
            }
            if (zeroIfNull(goal.getInflationAdjustedTarget()).signum() <= 0) {
                total += 0.0;
                continue;
            }
            double progress = zeroIfNull(goal.getCurrentAmount())
                    .divide(goal.getInflationAdjustedTarget(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .min(BigDecimal.valueOf(100))
                    .doubleValue();
            total += progress;
        }
        return total / goals.size();
    }

    private double computeDiversificationScore(Portfolio portfolio) {
        if (portfolio == null || zeroIfNull(portfolio.getTotalCurrentValue()).signum() <= 0) {
            return 0.0;
        }

        int activeBuckets = 0;
        if (safePct(portfolio.getEquityPct()) >= 10.0) activeBuckets++;
        if (safePct(portfolio.getDebtPct()) >= 10.0) activeBuckets++;
        if (safePct(portfolio.getGoldPct()) >= 5.0) activeBuckets++;
        if (safePct(portfolio.getLiquidPct()) >= 5.0) activeBuckets++;

        return Math.min(100.0, activeBuckets * 25.0);
    }

    private double computeEmergencyFundScore(UserProfile profile, List<Goal> goals) {
        if (profile == null || profile.getMonthlyExpenses() == null || profile.getMonthlyExpenses().signum() <= 0) {
            return 0.0;
        }

        BigDecimal emergencyCorpus = goals.stream()
                .filter(goal -> goal.getGoalType().name().equals("EMERGENCY_FUND"))
                .map(Goal::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal target = profile.getMonthlyExpenses().multiply(BigDecimal.valueOf(6));
        if (target.signum() <= 0) {
            return 0.0;
        }
        return emergencyCorpus.divide(target, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .min(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private String deriveGoalTrackingStatus(UserProfile profile, Goal goal) {
        if (goal.getStatus() == GoalStatus.ACHIEVED) {
            return "ACHIEVED";
        }
        if (profile == null || profile.getMonthlyIncome() == null || profile.getMonthlyExpenses() == null) {
            return "PROFILE_REQUIRED";
        }

        BigDecimal monthlySurplus = profile.getMonthlyIncome().subtract(profile.getMonthlyExpenses());
        if (monthlySurplus.signum() <= 0) {
            return "AT_RISK";
        }

        BigDecimal required = zeroIfNull(goal.getRequiredMonthlyInvestment());
        if (required.compareTo(monthlySurplus.multiply(BigDecimal.valueOf(0.50))) <= 0) {
            return "ON_TRACK";
        }
        if (required.compareTo(monthlySurplus.multiply(BigDecimal.valueOf(0.80))) <= 0) {
            return "STRETCH";
        }
        return "AT_RISK";
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private double safePct(Double value) {
        return value == null ? 0.0 : value;
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
