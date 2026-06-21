package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.AlertSeverity;
import java.time.LocalDateTime;

public record AlertResponse(
        Long id,
        AlertSeverity severity,
        String message,
        String actionSuggestion,
        Boolean isRead,
        LocalDateTime snoozedUntil,
        LocalDateTime createdAt
) {
}
