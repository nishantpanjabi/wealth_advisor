package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.request.GoalRequest;
import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.GoalResponse;
import com.wealthadvisor.backend.service.GoalPlanningService;
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
@RequestMapping("/goals")
public class GoalController {

    private final GoalPlanningService goalPlanningService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    public GoalController(
            GoalPlanningService goalPlanningService,
            AuthenticatedUserResolver authenticatedUserResolver
    ) {
        this.goalPlanningService = goalPlanningService;
        this.authenticatedUserResolver = authenticatedUserResolver;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GoalResponse>>> getGoals(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Goals fetched successfully",
                goalPlanningService.getGoals(userId)
        ));
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<ApiResponse<GoalResponse>> getGoal(
            Authentication authentication,
            @PathVariable Long goalId
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Goal fetched successfully",
                goalPlanningService.getGoal(userId, goalId)
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GoalResponse>> createGoal(
            Authentication authentication,
            @Valid @RequestBody GoalRequest request
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Goal created successfully",
                goalPlanningService.createGoal(userId, request)
        ));
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<ApiResponse<GoalResponse>> updateGoal(
            Authentication authentication,
            @PathVariable Long goalId,
            @Valid @RequestBody GoalRequest request
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Goal updated successfully",
                goalPlanningService.updateGoal(userId, goalId, request)
        ));
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(
            Authentication authentication,
            @PathVariable Long goalId
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        goalPlanningService.deleteGoal(userId, goalId);
        return ResponseEntity.ok(ApiResponse.success("Goal deleted successfully", null));
    }
}
