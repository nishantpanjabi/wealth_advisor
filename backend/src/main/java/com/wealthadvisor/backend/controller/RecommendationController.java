package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.RecommendationResponse;
import com.wealthadvisor.backend.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    public RecommendationController(
            RecommendationService recommendationService,
            AuthenticatedUserResolver authenticatedUserResolver
    ) {
        this.recommendationService = recommendationService;
        this.authenticatedUserResolver = authenticatedUserResolver;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<RecommendationResponse>> getRecommendations(
            Authentication authentication,
            @RequestParam(required = false) Double investmentAmount,
            @RequestParam(required = false) Integer years
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Recommendations fetched successfully",
                recommendationService.getRecommendations(userId, investmentAmount, years)
        ));
    }
}
