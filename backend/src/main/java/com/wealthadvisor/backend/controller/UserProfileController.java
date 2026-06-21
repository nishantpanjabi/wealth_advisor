package com.wealthadvisor.backend.controller;

import com.wealthadvisor.backend.dto.request.UserProfileRequest;
import com.wealthadvisor.backend.dto.response.ApiResponse;
import com.wealthadvisor.backend.dto.response.UserProfileResponse;
import com.wealthadvisor.backend.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    public UserProfileController(
            UserProfileService userProfileService,
            AuthenticatedUserResolver authenticatedUserResolver
    ) {
        this.userProfileService = userProfileService;
        this.authenticatedUserResolver = authenticatedUserResolver;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Authentication authentication) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", userProfileService.getProfile(userId)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> upsertProfile(
            Authentication authentication,
            @Valid @RequestBody UserProfileRequest request
    ) {
        Long userId = authenticatedUserResolver.resolveUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(
                "Profile saved successfully",
                userProfileService.createOrUpdateProfile(userId, request)
        ));
    }
}
