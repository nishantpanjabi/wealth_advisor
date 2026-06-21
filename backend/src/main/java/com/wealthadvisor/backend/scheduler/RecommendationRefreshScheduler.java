package com.wealthadvisor.backend.scheduler;

import com.wealthadvisor.backend.repository.UserRepository;
import com.wealthadvisor.backend.service.MarketDataIngestionService;
import com.wealthadvisor.backend.service.RecommendationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecommendationRefreshScheduler {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;
    private final MarketDataIngestionService marketDataIngestionService;

    public RecommendationRefreshScheduler(
            RecommendationService recommendationService,
            UserRepository userRepository,
            MarketDataIngestionService marketDataIngestionService
    ) {
        this.recommendationService = recommendationService;
        this.userRepository = userRepository;
        this.marketDataIngestionService = marketDataIngestionService;
    }

    @Scheduled(cron = "0 15 2 * * *")
    public void refreshModelAndWarmCache() {
        marketDataIngestionService.refreshAll();
        recommendationService.refreshMarketData();
        recommendationService.triggerModelRetraining();

        userRepository.findAll().forEach(user -> {
            recommendationService.warmRecommendationCache(user.getId(), null, null);
            recommendationService.warmRecommendationCache(user.getId(), null, 5);
            recommendationService.warmRecommendationCache(user.getId(), null, 10);
        });
    }
}
