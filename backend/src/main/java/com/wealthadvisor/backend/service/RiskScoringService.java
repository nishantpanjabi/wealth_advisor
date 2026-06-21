package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.request.RiskScoreRequest;
import com.wealthadvisor.backend.dto.response.RiskScoreResponse;
import com.wealthadvisor.backend.entity.RiskProfile;
import com.wealthadvisor.backend.entity.User;
import com.wealthadvisor.backend.entity.UserProfile;
import com.wealthadvisor.backend.enums.RiskCategory;
import com.wealthadvisor.backend.exception.ResourceNotFoundException;
import com.wealthadvisor.backend.repository.RiskProfileRepository;
import com.wealthadvisor.backend.repository.UserProfileRepository;
import com.wealthadvisor.backend.repository.UserRepository;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RiskScoringService {

    private final RiskProfileRepository riskProfileRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public RiskScoringService(
            RiskProfileRepository riskProfileRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository
    ) {
        this.riskProfileRepository = riskProfileRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    @CacheEvict(value = "riskScores", key = "#userId")
    public RiskScoreResponse calculateRisk(Long userId, RiskScoreRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Complete profile before calculating risk"));

        int ageScore = scoreAge(profile.getAge());
        int incomeScore = scoreIncomeStability(request.incomeStability(), profile.getSavingsRate());
        int horizonScore = scoreHorizon(request.investmentHorizonYears());
        int toleranceScore = scoreTolerance(request.lossTolerance());
        int experienceScore = scoreExperience(request.investmentExperienceYears(), profile.getInvestmentKnowledge());
        int totalScore = ageScore + incomeScore + horizonScore + toleranceScore + experienceScore;

        RiskProfile riskProfile = RiskProfile.builder()
                .user(user)
                .riskScore(totalScore)
                .riskCategory(mapCategory(totalScore))
                .ageScore(ageScore)
                .incomeScore(incomeScore)
                .horizonScore(horizonScore)
                .toleranceScore(toleranceScore)
                .experienceScore(experienceScore)
                .build();

        return mapToResponse(riskProfileRepository.save(riskProfile));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "riskScores", key = "#userId")
    public RiskScoreResponse getLatestRisk(Long userId) {
        return riskProfileRepository.findTopByUserIdOrderByCalculatedAtDesc(userId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Risk score not found"));
    }

    @Transactional(readOnly = true)
    public List<RiskScoreResponse> getRiskHistory(Long userId) {
        return riskProfileRepository.findAllByUserIdOrderByCalculatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private int scoreAge(Integer age) {
        int normalized = age <= 25 ? 100 : age <= 35 ? 80 : age <= 45 ? 60 : age <= 55 ? 40 : 20;
        return Math.round(normalized * 0.20f);
    }

    private int scoreIncomeStability(Integer incomeStability, Double savingsRate) {
        double savingsAdjustment = savingsRate == null ? 0 : Math.min(savingsRate, 40.0) / 40.0 * 20.0;
        double normalized = Math.min(100.0, incomeStability * 8.0 + savingsAdjustment);
        return (int) Math.round(normalized * 0.20);
    }

    private int scoreHorizon(Integer horizonYears) {
        int normalized = Math.min(100, horizonYears * 5);
        return Math.round(normalized * 0.25f);
    }

    private int scoreTolerance(Integer tolerance) {
        return Math.round((tolerance * 10) * 0.20f);
    }

    private int scoreExperience(Integer experienceYears, String investmentKnowledge) {
        int experienceComponent = Math.min(60, experienceYears * 6);
        int knowledgeBonus = switch (investmentKnowledge == null ? "" : investmentKnowledge.toUpperCase()) {
            case "EXPERT" -> 40;
            case "INTERMEDIATE" -> 25;
            default -> 10;
        };
        int normalized = Math.min(100, experienceComponent + knowledgeBonus);
        return Math.round(normalized * 0.15f);
    }

    private RiskCategory mapCategory(int score) {
        if (score >= 70) {
            return RiskCategory.AGGRESSIVE;
        }
        if (score >= 45) {
            return RiskCategory.MODERATE;
        }
        return RiskCategory.CONSERVATIVE;
    }

    private RiskScoreResponse mapToResponse(RiskProfile profile) {
        return new RiskScoreResponse(
                profile.getRiskScore(),
                profile.getRiskCategory(),
                profile.getAgeScore(),
                profile.getIncomeScore(),
                profile.getHorizonScore(),
                profile.getToleranceScore(),
                profile.getExperienceScore(),
                profile.getCalculatedAt()
        );
    }
}
