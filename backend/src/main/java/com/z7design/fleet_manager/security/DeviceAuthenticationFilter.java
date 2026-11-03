package com.z7design.fleet_manager.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.model.kiosk.KioskDevice;
import com.z7design.fleet_manager.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeviceAuthenticationFilter extends OncePerRequestFilter {

    private final KioskDeviceTokenService tokenService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Apenas filtra requisições direcionadas à API do Player de Totens
        if (!path.startsWith("/api/player/")) {
            return true;
        }
        // Pareamento não requer token prévio (pois é o momento em que o token é gerado)
        return path.equals("/api/player/pair");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractDeviceToken(request);

        if (token == null || token.isBlank()) {
            sendUnauthorized(response, "Token de dispositivo (X-Device-Token ou Bearer) não informado.");
            return;
        }

        Optional<KioskDevice> deviceOpt = tokenService.authenticate(token);
        if (deviceOpt.isEmpty()) {
            sendUnauthorized(response, "Credencial de totem inválida ou revogada.");
            return;
        }

        KioskDevice device = deviceOpt.get();
        boolean tenantContextSet = false;

        try {
            KioskDeviceAuthentication auth = new KioskDeviceAuthentication(device);
            SecurityContextHolder.getContext().setAuthentication(auth);

            // Isola o tenant da requisição no contexto da empresa proprietária do totem
            TenantContext.set(device.getCompanyId());
            tenantContextSet = true;

            filterChain.doFilter(request, response);
        } finally {
            if (tenantContextSet) {
                TenantContext.clear();
            }
        }
    }

    private String extractDeviceToken(HttpServletRequest request) {
        // 1. Tentar header específico do Totem
        String token = request.getHeader("X-Device-Token");
        if (token != null && !token.isBlank()) {
            return token.trim();
        }

        // 2. Tentar Authorization header padrão (Bearer ou Device)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && !authHeader.isBlank()) {
            if (authHeader.startsWith("Bearer ") || authHeader.startsWith("bearer ")) {
                return authHeader.substring(7).trim();
            }
            if (authHeader.startsWith("Device ") || authHeader.startsWith("device ")) {
                return authHeader.substring(7).trim();
            }
            return authHeader.trim();
        }

        return null;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("timestamp", LocalDateTime.now().toString());
        errorBody.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        errorBody.put("error", "Unauthorized");
        errorBody.put("message", message);
        errorBody.put("code", "KIOSK_DEVICE_UNAUTHORIZED");

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
    }
}
