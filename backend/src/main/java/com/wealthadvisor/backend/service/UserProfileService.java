package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.request.UserProfileRequest;
import com.wealthadvisor.backend.dto.response.UserProfileResponse;
import com.wealthadvisor.backend.entity.User;
import com.wealthadvisor.backend.entity.UserProfile;
import com.wealthadvisor.backend.exception.ResourceNotFoundException;
import com.wealthadvisor.backend.repository.UserProfileRepository;
import com.wealthadvisor.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfileService(UserProfileRepository userProfileRepository, UserRepository userRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user"));
        return mapToResponse(profile);
    }

    @Transactional
    public UserProfileResponse createOrUpdateProfile(Long userId, UserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().user(user).build());

        BigDecimal income = request.monthlyIncome().setScale(2, RoundingMode.HALF_UP);
        BigDecimal expenses = request.monthlyExpenses().setScale(2, RoundingMode.HALF_UP);
        BigDecimal assets = request.assetsValue() == null ? BigDecimal.ZERO : request.assetsValue();
        BigDecimal liabilities = request.liabilitiesValue() == null ? BigDecimal.ZERO : request.liabilitiesValue();

        profile.setMonthlyIncome(income);
        profile.setMonthlyExpenses(expenses);
        profile.setSavingsRate(calculateSavingsRate(income, expenses));
        profile.setAge(request.age());
        profile.setDependents(request.dependents());
        profile.setEmploymentType(request.employmentType().trim().toUpperCase());
        profile.setNetWorth(assets.subtract(liabilities).setScale(2, RoundingMode.HALF_UP));
        profile.setInvestmentExperienceYears(request.investmentExperienceYears());
        profile.setInvestmentKnowledge(request.investmentKnowledge().trim().toUpperCase());

        return mapToResponse(userProfileRepository.save(profile));
    }

    private double calculateSavingsRate(BigDecimal income, BigDecimal expenses) {
        if (income.signum() <= 0) {
            return 0.0;
        }
        BigDecimal savings = income.subtract(expenses).max(BigDecimal.ZERO);
        return savings
                .divide(income, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private UserProfileResponse mapToResponse(UserProfile profile) {
        return new UserProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getMonthlyIncome(),
                profile.getMonthlyExpenses(),
                profile.getSavingsRate(),
                profile.getAge(),
                profile.getDependents(),
                profile.getEmploymentType(),
                profile.getNetWorth(),
                profile.getInvestmentExperienceYears(),
                profile.getInvestmentKnowledge()
        );
    }
}
