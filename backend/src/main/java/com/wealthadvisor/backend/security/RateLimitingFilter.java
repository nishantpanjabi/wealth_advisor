package com.wealthadvisor.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final int maxRequestsPerMinute;

    public RateLimitingFilter(
            ObjectMapper objectMapper,
            @Value("${app.rate-limit.requests-per-minute:10}") int maxRequestsPerMinute
    ) {
        this.objectMapper = objectMapper;
        this.maxRequestsPerMinute = maxRequestsPerMinute;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!shouldRateLimit(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveClientKey(request);
        long nowWindow = Instant.now().getEpochSecond() / 60;
        WindowCounter counter = counters.compute(key, (k, existing) -> {
            if (existing == null || existing.windowMinute != nowWindow) {
                return new WindowCounter(nowWindow, new AtomicInteger(1));
            }
            existing.counter.incrementAndGet();
            return existing;
        });

        if (counter.counter.get() > maxRequestsPerMinute) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), Map.of(
                    "success", false,
                    "message", "Rate limit exceeded. Try again in a minute.",
                    "data", null
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean shouldRateLimit(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/simulation")
                || path.startsWith("/insights")
                || path.startsWith("/portfolio/optimize")
                || path.startsWith("/predictions");
    }

    private String resolveClientKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getName() != null) {
            return authentication.getName();
        }
        return request.getRemoteAddr();
    }

    private record WindowCounter(long windowMinute, AtomicInteger counter) {
    }
}
