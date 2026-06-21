package com.wealthadvisor.backend.service;

import com.wealthadvisor.backend.dto.request.LoginRequest;
import com.wealthadvisor.backend.dto.request.RefreshTokenRequest;
import com.wealthadvisor.backend.dto.request.RegisterRequest;
import com.wealthadvisor.backend.dto.response.AuthResponse;
import com.wealthadvisor.backend.entity.RefreshToken;
import com.wealthadvisor.backend.entity.User;
import com.wealthadvisor.backend.entity.UserProfile;
import com.wealthadvisor.backend.enums.AuthProvider;
import com.wealthadvisor.backend.enums.Role;
import com.wealthadvisor.backend.exception.ResourceNotFoundException;
import com.wealthadvisor.backend.exception.UnauthorizedException;
import com.wealthadvisor.backend.repository.RefreshTokenRepository;
import com.wealthadvisor.backend.repository.UserProfileRepository;
import com.wealthadvisor.backend.repository.UserRepository;
import com.wealthadvisor.backend.security.JwtUtil;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public AuthService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserDetailsService userDetailsService
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .authProvider(AuthProvider.LOCAL)
                .build();

        User savedUser = userRepository.save(user);
        userProfileRepository.save(UserProfile.builder().user(savedUser).build());

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        return buildAuthResponse(savedUser, userDetails);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return buildAuthResponse(user, userDetails);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid"));

        if (Boolean.TRUE.equals(storedToken.getRevoked()) || storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Refresh token has expired or has been revoked");
        }

        User user = storedToken.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        if (!jwtUtil.isTokenValid(storedToken.getToken(), userDetails)) {
            throw new UnauthorizedException("Refresh token is invalid");
        }

        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);
        return buildAuthResponse(user, userDetails);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByToken(request.refreshToken()).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public AuthResponse handleGoogleLogin(String email, String fullName, String providerUserId) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .map(existingUser -> updateGoogleUser(existingUser, fullName, providerUserId))
                .orElseGet(() -> createGoogleUser(normalizedEmail, fullName, providerUserId));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return buildAuthResponse(user, userDetails);
    }

    private User updateGoogleUser(User user, String fullName, String providerUserId) {
        user.setFullName(fullName);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setProviderUserId(providerUserId);
        return userRepository.save(user);
    }

    private User createGoogleUser(String email, String fullName, String providerUserId) {
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(Role.USER)
                .authProvider(AuthProvider.GOOGLE)
                .providerUserId(providerUserId)
                .build();

        User savedUser = userRepository.save(user);
        userProfileRepository.save(UserProfile.builder().user(savedUser).build());
        return savedUser;
    }

    private AuthResponse buildAuthResponse(User user, UserDetails userDetails) {
        String accessToken = jwtUtil.generateAccessToken(userDetails, Map.of("role", user.getRole().name()));
        String refreshTokenValue = jwtUtil.generateRefreshToken(userDetails);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenValue)
                .user(user)
                .expiresAt(jwtUtil.extractExpiration(refreshTokenValue)
                        .toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                accessToken,
                refreshTokenValue
        );
    }
}
