package com.wealthadvisor.backend.scheduler;

import com.wealthadvisor.backend.repository.UserRepository;
import com.wealthadvisor.backend.service.InsightsService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AlertGeneratorScheduler {

    private final UserRepository userRepository;
    private final InsightsService insightsService;

    public AlertGeneratorScheduler(UserRepository userRepository, InsightsService insightsService) {
        this.userRepository = userRepository;
        this.insightsService = insightsService;
    }

    @Scheduled(cron = "0 0 8 * * MON")
    public void generateWeeklyAlerts() {
        userRepository.findAll().forEach(user -> insightsService.generateAlerts(user.getId()));
    }
}
