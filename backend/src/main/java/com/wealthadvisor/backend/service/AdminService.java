package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.response.AdminDashboardResponse;
import com.wealthadvisor.backend.entity.Portfolio;
import com.wealthadvisor.backend.entity.RiskProfile;
import com.wealthadvisor.backend.repository.AlertRepository;
import com.wealthadvisor.backend.repository.FundNavSnapshotRepository;
import com.wealthadvisor.backend.repository.GoalRepository;
import com.wealthadvisor.backend.repository.MarketDataSnapshotRepository;
import com.wealthadvisor.backend.repository.PortfolioRepository;
import com.wealthadvisor.backend.repository.RiskProfileRepository;
import com.wealthadvisor.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final GoalRepository goalRepository;
    private final AlertRepository alertRepository;
    private final RiskProfileRepository riskProfileRepository;
    private final MarketDataSnapshotRepository marketDataSnapshotRepository;
    private final FundNavSnapshotRepository fundNavSnapshotRepository;

    public AdminService(
            UserRepository userRepository,
            PortfolioRepository portfolioRepository,
            GoalRepository goalRepository,
            AlertRepository alertRepository,
            RiskProfileRepository riskProfileRepository,
            MarketDataSnapshotRepository marketDataSnapshotRepository,
            FundNavSnapshotRepository fundNavSnapshotRepository
    ) {
        this.userRepository = userRepository;
        this.portfolioRepository = portfolioRepository;
        this.goalRepository = goalRepository;
        this.alertRepository = alertRepository;
        this.riskProfileRepository = riskProfileRepository;
        this.marketDataSnapshotRepository = marketDataSnapshotRepository;
        this.fundNavSnapshotRepository = fundNavSnapshotRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        long totalUsers = userRepository.count();
        long totalPortfolios = portfolioRepository.count();
        BigDecimal totalPortfolioValue = portfolioRepository.findAll().stream()
                .map(Portfolio::getTotalCurrentValue)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> riskDistribution = new LinkedHashMap<>();
        riskDistribution.put("CONSERVATIVE", 0L);
        riskDistribution.put("MODERATE", 0L);
        riskDistribution.put("AGGRESSIVE", 0L);

        for (RiskProfile profile : riskProfileRepository.findAll()) {
            if (profile.getRiskCategory() != null) {
                riskDistribution.computeIfPresent(profile.getRiskCategory().name(), (key, count) -> count + 1);
            }
        }

        long activeAlerts = alertRepository.findAll().stream()
                .filter(alert -> !Boolean.TRUE.equals(alert.getIsRead()))
                .count();

        return new AdminDashboardResponse(
                totalUsers,
                totalPortfolios,
                totalPortfolioValue,
                goalRepository.count(),
                activeAlerts,
                riskDistribution,
                marketDataSnapshotRepository.count(),
                fundNavSnapshotRepository.count()
        );
    }
}
