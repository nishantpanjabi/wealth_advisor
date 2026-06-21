package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.PortfolioForecastResponse;
import com.wealthadvisor.backend.dto.response.PredictionAnomalyResponse;
import com.wealthadvisor.backend.dto.response.PredictionSummaryResponse;
import com.wealthadvisor.backend.dto.response.SipRecommendationResponse;
import com.wealthadvisor.backend.service.PredictionService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/predictions")
public class PredictionController {

    private final PredictionService predictionService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    public PredictionController(
            PredictionService predictionService,
            AuthenticatedUserResolver authenticatedUserResolver
    ) {
        this.predictionService = predictionService;
        this.authenticatedUserResolver = authenticatedUserResolver;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PredictionSummaryResponse>> getSummary(
            Authentication authentication,
            @RequestParam(defaultValue = "5") Integer years
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Prediction summary fetched successfully",
                predictionService.getSummary(userId, years)
        ));
    }

    @GetMapping("/portfolio-forecast")
    public ResponseEntity<ApiResponse<PortfolioForecastResponse>> getPortfolioForecast(
            Authentication authentication,
            @RequestParam(defaultValue = "5") Integer years
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Portfolio forecast fetched successfully",
                predictionService.getPortfolioForecast(userId, years)
        ));
    }

    @GetMapping("/sip-recommendation")
    public ResponseEntity<ApiResponse<SipRecommendationResponse>> getSipRecommendation(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "SIP recommendation fetched successfully",
                predictionService.getSipRecommendation(userId)
        ));
    }

    @GetMapping("/anomalies")
    public ResponseEntity<ApiResponse<List<PredictionAnomalyResponse>>> getAnomalies(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Prediction anomalies fetched successfully",
                predictionService.getAnomalies(userId)
        ));
    }
}
