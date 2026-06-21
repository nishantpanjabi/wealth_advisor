package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.request.InvestmentRequest;
import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.BenchmarkComparisonResponse;
import com.wealthadvisor.backend.dto.response.PortfolioOptimizationResponse;
import com.wealthadvisor.backend.dto.response.PortfolioPerformancePointResponse;
import com.wealthadvisor.backend.dto.response.PortfolioResponse;
import com.wealthadvisor.backend.dto.response.PortfolioTransactionResponse;
import com.wealthadvisor.backend.dto.response.XirrResponse;
import com.wealthadvisor.backend.service.PortfolioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    public PortfolioController(
            PortfolioService portfolioService,
            AuthenticatedUserResolver authenticatedUserResolver
    ) {
        this.portfolioService = portfolioService;
        this.authenticatedUserResolver = authenticatedUserResolver;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PortfolioResponse>> getPortfolio(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Portfolio fetched successfully",
                portfolioService.getPortfolio(userId)
        ));
    }

    @GetMapping("/optimize")
    public ResponseEntity<ApiResponse<PortfolioOptimizationResponse>> optimizePortfolio(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Portfolio optimization fetched successfully",
                portfolioService.getOptimization(userId)
        ));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<PortfolioTransactionResponse>>> getTransactions(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Portfolio transactions fetched successfully",
                portfolioService.getTransactions(userId)
        ));
    }

    @GetMapping("/performance")
    public ResponseEntity<ApiResponse<List<PortfolioPerformancePointResponse>>> getPerformance(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Portfolio performance series fetched successfully",
                portfolioService.getPerformanceSeries(userId)
        ));
    }

    @GetMapping("/xirr")
    public ResponseEntity<ApiResponse<XirrResponse>> getXirr(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Portfolio XIRR fetched successfully",
                portfolioService.getXirr(userId)
        ));
    }

    @GetMapping("/benchmark")
    public ResponseEntity<ApiResponse<BenchmarkComparisonResponse>> getBenchmarkComparison(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Portfolio benchmark comparison fetched successfully",
                portfolioService.getBenchmarkComparison(userId)
        ));
    }

    @PostMapping("/investments")
    public ResponseEntity<ApiResponse<PortfolioResponse>> addInvestment(
            Authentication authentication,
            @Valid @RequestBody InvestmentRequest request
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Investment added successfully",
                portfolioService.addInvestment(userId, request)
        ));
    }

    @PutMapping("/investments/{investmentId}")
    public ResponseEntity<ApiResponse<PortfolioResponse>> updateInvestment(
            Authentication authentication,
            @PathVariable Long investmentId,
            @Valid @RequestBody InvestmentRequest request
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Investment updated successfully",
                portfolioService.updateInvestment(userId, investmentId, request)
        ));
    }

    @DeleteMapping("/investments/{investmentId}")
    public ResponseEntity<ApiResponse<PortfolioResponse>> deleteInvestment(
            Authentication authentication,
            @PathVariable Long investmentId
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Investment deleted successfully",
                portfolioService.deleteInvestment(userId, investmentId)
        ));
    }
}
