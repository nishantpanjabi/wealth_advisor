package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.request.GoalRequest;
import com.wealthadvisor.backend.dto.response.GoalResponse;
import com.wealthadvisor.backend.entity.Goal;
import com.wealthadvisor.backend.entity.User;
import com.wealthadvisor.backend.entity.UserProfile;
import com.wealthadvisor.backend.enums.GoalStatus;
import com.wealthadvisor.backend.exception.ResourceNotFoundException;
import com.wealthadvisor.backend.repository.GoalRepository;
import com.wealthadvisor.backend.repository.UserProfileRepository;
import com.wealthadvisor.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalPlanningService {

    private static final double DEFAULT_ANNUAL_RETURN = 12.0;
    private static final double DEFAULT_INFLATION_RATE = 6.0;

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public GoalPlanningService(
            GoalRepository goalRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository
    ) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getGoals(Long userId) {
        return goalRepository.findAllByUserIdOrderByPriorityAscIdAsc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GoalResponse getGoal(Long userId, Long goalId) {
        return mapToResponse(getUserGoal(userId, goalId));
    }

    @Transactional
    public GoalResponse createGoal(Long userId, GoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Goal goal = Goal.builder()
                .user(user)
                .build();

        applyGoalRequest(goal, request);
        return mapToResponse(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse updateGoal(Long userId, Long goalId, GoalRequest request) {
        Goal goal = getUserGoal(userId, goalId);
        applyGoalRequest(goal, request);
        return mapToResponse(goalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(Long userId, Long goalId) {
        Goal goal = getUserGoal(userId, goalId);
        goalRepository.delete(goal);
    }

    private Goal getUserGoal(Long userId, Long goalId) {
        return goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
    }

    private void applyGoalRequest(Goal goal, GoalRequest request) {
        double annualReturn = request.expectedAnnualReturn() == null
                ? DEFAULT_ANNUAL_RETURN
                : request.expectedAnnualReturn();
        double inflationRate = request.expectedInflationRate() == null
                ? DEFAULT_INFLATION_RATE
                : request.expectedInflationRate();

        BigDecimal targetAmount = request.targetAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal currentAmount = request.currentAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal inflationAdjustedTarget = calculateInflationAdjustedTarget(targetAmount, inflationRate, request.targetYears());
        BigDecimal monthlyInvestment = calculateRequiredMonthlyInvestment(
                inflationAdjustedTarget,
                currentAmount,
                annualReturn,
                request.targetYears()
        );

        goal.setName(request.name().trim());
        goal.setGoalType(request.goalType());
        goal.setTargetAmount(targetAmount);
        goal.setCurrentAmount(currentAmount);
        goal.setTargetYears(request.targetYears());
        goal.setPriority(request.priority());
        goal.setExpectedAnnualReturn(annualReturn);
        goal.setExpectedInflationRate(inflationRate);
        goal.setInflationAdjustedTarget(inflationAdjustedTarget);
        goal.setRequiredMonthlyInvestment(monthlyInvestment);
        goal.setStatus(resolveGoalStatus(request.status(), currentAmount, inflationAdjustedTarget));
    }

    private GoalStatus resolveGoalStatus(GoalStatus requestedStatus, BigDecimal currentAmount, BigDecimal targetAmount) {
        if (requestedStatus != null) {
            return requestedStatus;
        }
        if (currentAmount.compareTo(targetAmount) >= 0) {
            return GoalStatus.ACHIEVED;
        }
        return GoalStatus.IN_PROGRESS;
    }

    private BigDecimal calculateInflationAdjustedTarget(BigDecimal targetAmount, double inflationRate, int years) {
        double inflationMultiplier = Math.pow(1 + (inflationRate / 100.0), years);
        return targetAmount.multiply(BigDecimal.valueOf(inflationMultiplier)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateRequiredMonthlyInvestment(
            BigDecimal futureValue,
            BigDecimal currentAmount,
            double expectedAnnualReturn,
            int targetYears
    ) {
        int months = targetYears * 12;
        double monthlyRate = expectedAnnualReturn / 100.0 / 12.0;

        if (months <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (monthlyRate == 0.0) {
            BigDecimal remaining = futureValue.subtract(currentAmount).max(BigDecimal.ZERO);
            return remaining.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
        }

        double futureValueDouble = futureValue.doubleValue();
        double currentAmountDouble = currentAmount.doubleValue();
        double currentValueProjection = currentAmountDouble * Math.pow(1 + monthlyRate, months);
        double denominator = Math.pow(1 + monthlyRate, months) - 1;
        double numerator = Math.max(0.0, futureValueDouble - currentValueProjection) * monthlyRate;
        double requiredSip = denominator == 0.0 ? 0.0 : numerator / denominator;

        return BigDecimal.valueOf(requiredSip).setScale(2, RoundingMode.HALF_UP);
    }

    private GoalResponse mapToResponse(Goal goal) {
        UserProfile profile = userProfileRepository.findByUserId(goal.getUser().getId()).orElse(null);
        int monthsRemaining = goal.getTargetYears() == null ? 0 : goal.getTargetYears() * 12;
        double progressPercent = calculateProgress(goal.getCurrentAmount(), goal.getInflationAdjustedTarget());
        String trackingStatus = determineTrackingStatus(goal, profile);

        return new GoalResponse(
                goal.getId(),
                goal.getName(),
                goal.getGoalType(),
                goal.getTargetAmount(),
                goal.getCurrentAmount(),
                goal.getTargetYears(),
                monthsRemaining,
                goal.getPriority(),
                goal.getStatus(),
                goal.getExpectedAnnualReturn(),
                goal.getExpectedInflationRate(),
                goal.getInflationAdjustedTarget(),
                goal.getRequiredMonthlyInvestment(),
                progressPercent,
                trackingStatus
        );
    }

    private double calculateProgress(BigDecimal currentAmount, BigDecimal targetAmount) {
        if (currentAmount == null || targetAmount == null || targetAmount.signum() <= 0) {
            return 0.0;
        }
        return currentAmount
                .divide(targetAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .min(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private String determineTrackingStatus(Goal goal, UserProfile profile) {
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

        BigDecimal required = goal.getRequiredMonthlyInvestment() == null
                ? BigDecimal.ZERO
                : goal.getRequiredMonthlyInvestment();

        BigDecimal aggressiveLimit = monthlySurplus.multiply(BigDecimal.valueOf(0.80));
        BigDecimal comfortableLimit = monthlySurplus.multiply(BigDecimal.valueOf(0.50));

        if (required.compareTo(comfortableLimit) <= 0) {
            return "ON_TRACK";
        }
        if (required.compareTo(aggressiveLimit) <= 0) {
            return "STRETCH";
        }
        return "AT_RISK";
    }
}
