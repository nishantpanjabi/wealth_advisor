package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.response.AlertResponse;
import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.HealthScoreResponse;
import com.wealthadvisor.backend.dto.response.InsightsSummaryResponse;
import com.wealthadvisor.backend.service.AlertService;
import com.wealthadvisor.backend.service.InsightsService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/insights")
public class InsightsController {

    private final InsightsService insightsService;
    private final AlertService alertService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    public InsightsController(
            InsightsService insightsService,
            AlertService alertService,
            AuthenticatedUserResolver authenticatedUserResolver
    ) {
        this.insightsService = insightsService;
        this.alertService = alertService;
        this.authenticatedUserResolver = authenticatedUserResolver;
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<InsightsSummaryResponse>> generateInsights(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Insights generated successfully",
                insightsService.generateInsights(userId)
        ));
    }

    @GetMapping("/health-score")
    public ResponseEntity<ApiResponse<HealthScoreResponse>> healthScore(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Health score fetched successfully",
                insightsService.calculateHealthScore(userId)
        ));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<AlertResponse>>> alerts(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Alerts fetched successfully",
                alertService.getActiveAlerts(userId)
        ));
    }

    @PatchMapping("/alerts/{alertId}/dismiss")
    public ResponseEntity<ApiResponse<AlertResponse>> dismissAlert(
            Authentication authentication,
            @PathVariable Long alertId
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Alert dismissed successfully",
                alertService.dismissAlert(userId, alertId)
        ));
    }

    @PatchMapping("/alerts/{alertId}/snooze")
    public ResponseEntity<ApiResponse<AlertResponse>> snoozeAlert(
            Authentication authentication,
            @PathVariable Long alertId,
            @RequestParam(defaultValue = "7") int days
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Alert snoozed successfully",
                alertService.snoozeAlert(userId, alertId, days)
        ));
    }
}
