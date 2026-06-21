package com.wealthadvisor.backend.dto.response;

import com.wealthadvisor.backend.enums.Role;

public record AuthResponse(
        Long userId,
        String fullName,
        String email,
        Role role,
        String accessToken,
        String refreshToken
) {
}
