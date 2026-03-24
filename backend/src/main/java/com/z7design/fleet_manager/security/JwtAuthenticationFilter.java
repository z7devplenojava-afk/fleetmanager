package com.z7design.fleet_manager.security;

import java.io.IOException;

import org.springframework.context.annotation.Lazy;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.z7design.fleet_manager.config.JwtConfig;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    @Lazy
    private final UserDetailsService userDetailsService;
    private final JwtConfig jwtConfig;

    public JwtAuthenticationFilter(JwtService jwtService, @Lazy UserDetailsService userDetailsService,
            JwtConfig jwtConfig) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.jwtConfig = jwtConfig;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Pular filtro para recursos estÃ¡ticos pÃºblicos (logos, uploads, etc)
        if (path.startsWith("/api/uploads/companies/logos/") ||
                path.startsWith("/uploads/") ||
                path.startsWith("/holerites/") ||
                path.startsWith("/api/auth/") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/api/public/") ||
                path.startsWith("/api/health") ||
                path.startsWith("/error")) {
            return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            final String authHeader = request.getHeader(jwtConfig.getHeader());
            log.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());
            log.debug("Authorization header: {}", authHeader);

            if (authHeader == null) {
                log.debug("No Authorization header found for request: {} {}", request.getMethod(),
                        request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }

            if (!authHeader.startsWith(jwtConfig.getPrefix() + " ")) {
                log.warn("Invalid Authorization header format. Expected: {} <token>, got: {}",
                        jwtConfig.getPrefix(), authHeader);
                filterChain.doFilter(request, response);
                return;
            }

            final String jwt = authHeader.substring(jwtConfig.getPrefix().length() + 1);
            log.debug("JWT token length: {}", jwt != null ? jwt.length() : 0);

            if (jwt == null || jwt.trim().isEmpty()) {
                log.warn("Empty JWT token received");
                filterChain.doFilter(request, response);
                return;
            }

            if (!jwt.contains(".")) {
                log.error("Invalid JWT format: token does not contain required periods. Token: {}", jwt);
                filterChain.doFilter(request, response);
                return;
            }

            final String username = jwtService.extractUsername(jwt);
            log.debug("Extracted username from token: {}", username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                log.debug("Loaded user details for username: {}", username);
                log.debug("User authorities: {}", userDetails.getAuthorities());

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Authentication successful for user: {} with authorities: {}", username,
                            userDetails.getAuthorities());
                } else {
                    log.warn("Invalid JWT token for user: {}", username);
                }
            } else if (username == null) {
                log.warn("Could not extract username from JWT token");
            } else {
                log.debug("User already authenticated: {}", username);
            }
        } catch (Exception e) {
            log.error("Error processing JWT token for request {} {}: {}",
                    request.getMethod(), request.getRequestURI(), e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
}
