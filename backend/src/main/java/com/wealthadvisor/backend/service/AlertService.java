package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.response.AlertResponse;
import com.wealthadvisor.backend.entity.Alert;
import com.wealthadvisor.backend.entity.User;
import com.wealthadvisor.backend.enums.AlertSeverity;
import com.wealthadvisor.backend.exception.ResourceNotFoundException;
import com.wealthadvisor.backend.repository.AlertRepository;
import com.wealthadvisor.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;

    public AlertService(AlertRepository alertRepository, UserRepository userRepository) {
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getActiveAlerts(Long userId) {
        List<Alert> alerts = alertRepository.findAllByUserIdAndSnoozedUntilIsNullOrSnoozedUntilBefore(userId, LocalDateTime.now());
        return alerts.stream()
                .sorted(alertComparator())
                .map(this::mapResponse)
                .toList();
    }

    @Transactional
    public AlertResponse dismissAlert(Long userId, Long alertId) {
        Alert alert = alertRepository.findByIdAndUserId(alertId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        alert.setIsRead(true);
        return mapResponse(alertRepository.save(alert));
    }

    @Transactional
    public AlertResponse snoozeAlert(Long userId, Long alertId, int days) {
        Alert alert = alertRepository.findByIdAndUserId(alertId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        alert.setSnoozedUntil(LocalDateTime.now().plusDays(days));
        return mapResponse(alertRepository.save(alert));
    }

    @Transactional
    public void createAlertIfAbsent(
            Long userId,
            AlertSeverity severity,
            String message,
            String actionSuggestion
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean exists = alertRepository.findAllByUserId(userId).stream()
                .anyMatch(alert -> !Boolean.TRUE.equals(alert.getIsRead())
                        && (alert.getSnoozedUntil() == null || alert.getSnoozedUntil().isBefore(LocalDateTime.now()))
                        && alert.getMessage().equals(message));

        if (exists) {
            return;
        }

        Alert alert = Alert.builder()
                .user(user)
                .severity(severity)
                .message(message)
                .actionSuggestion(actionSuggestion)
                .build();
        alertRepository.save(alert);
    }

    private Comparator<Alert> alertComparator() {
        return Comparator.comparingInt((Alert alert) -> severityRank(alert.getSeverity()))
                .thenComparing(Alert::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private int severityRank(AlertSeverity severity) {
        return switch (severity) {
            case HIGH -> 0;
            case MEDIUM -> 1;
            case LOW -> 2;
        };
    }

    private AlertResponse mapResponse(Alert alert) {
        return new AlertResponse(
                alert.getId(),
                alert.getSeverity(),
                alert.getMessage(),
                alert.getActionSuggestion(),
                alert.getIsRead(),
                alert.getSnoozedUntil(),
                alert.getCreatedAt()
        );
    }
}
