package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.MarketDataSummaryResponse;
import com.wealthadvisor.backend.service.MarketDataIngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/market-data")
public class MarketDataAdminController {

    private final MarketDataIngestionService marketDataIngestionService;

    public MarketDataAdminController(MarketDataIngestionService marketDataIngestionService) {
        this.marketDataIngestionService = marketDataIngestionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<MarketDataSummaryResponse>> summary() {
        return ResponseEntity.ok(ApiResponse.success(
                "Market data summary fetched successfully",
                marketDataIngestionService.getSummary()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<MarketDataSummaryResponse>> refresh() {
        return ResponseEntity.ok(ApiResponse.success(
                "Market data refreshed successfully",
                marketDataIngestionService.refreshAll()
        ));
    }
}
