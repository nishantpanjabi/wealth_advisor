package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.request.RiskScoreRequest;
import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.RiskScoreResponse;
import com.wealthadvisor.backend.service.RiskScoringService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/risk")
public class RiskController {

    private final RiskScoringService riskScoringService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    public RiskController(
            RiskScoringService riskScoringService,
            AuthenticatedUserResolver authenticatedUserResolver
    ) {
        this.riskScoringService = riskScoringService;
        this.authenticatedUserResolver = authenticatedUserResolver;
    }

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<RiskScoreResponse>> calculateRisk(
            Authentication authentication,
            @Valid @RequestBody RiskScoreRequest request
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Risk score calculated successfully",
                riskScoringService.calculateRisk(userId, request)
        ));
    }

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<RiskScoreResponse>> latestRisk(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Latest risk score fetched successfully",
                riskScoringService.getLatestRisk(userId)
        ));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<RiskScoreResponse>>> riskHistory(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Risk history fetched successfully",
                riskScoringService.getRiskHistory(userId)
        ));
    }
}
