package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.request.SimulationRequest;
import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.SimulationResponse;
import com.wealthadvisor.backend.enums.ScenarioType;
import com.wealthadvisor.backend.service.SimulationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/simulation")
public class SimulationController {

    private final SimulationService simulationService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    public SimulationController(
            SimulationService simulationService,
            AuthenticatedUserResolver authenticatedUserResolver
    ) {
        this.simulationService = simulationService;
        this.authenticatedUserResolver = authenticatedUserResolver;
    }

    @PostMapping("/presets/{scenarioType}")
    public ResponseEntity<ApiResponse<SimulationResponse>> runPresetScenario(
            Authentication authentication,
            @PathVariable ScenarioType scenarioType
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Preset simulation completed successfully",
                simulationService.runPresetScenario(userId, scenarioType)
        ));
    }

    @PostMapping("/custom")
    public ResponseEntity<ApiResponse<SimulationResponse>> runCustomScenario(
            Authentication authentication,
            @Valid @RequestBody SimulationRequest request
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Custom simulation completed successfully",
                simulationService.runCustomScenario(userId, request)
        ));
    }

    @GetMapping("/presets")
    public ResponseEntity<ApiResponse<List<ScenarioType>>> getPresets() {
        return ResponseEntity.ok(ApiResponse.success(
                "Simulation presets fetched successfully",
                simulationService.getPresets()
        ));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SimulationResponse>>> getSimulationHistory(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Simulation history fetched successfully",
                simulationService.getHistory(userId)
        ));
    }
}
