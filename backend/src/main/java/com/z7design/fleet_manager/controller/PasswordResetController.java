package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Password Reset", description = "RecuperaÃ§Ã£o de senha")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    @Operation(summary = "Esqueci minha senha", description = "Envia link para recuperaÃ§Ã£o de senha via Email ou WhatsApp")
    public ResponseEntity<?> forgotPassword(
            @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            String ipAddress = getClientIP(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            String deliveryMethod = request.getDeliveryMethod() != null ? request.getDeliveryMethod() : "email";

            Map<String, Object> result = passwordResetService.requestPasswordReset(
                    request.getEmail(),
                    deliveryMethod,
                    ipAddress,
                    userAgent
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao processar esqueci senha: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Se o email estiver cadastrado, vocÃª receberÃ¡ um link para recuperaÃ§Ã£o de senha."
            ));
        }
    }

    @GetMapping("/validate-reset-token")
    @Operation(summary = "Validar token de reset", description = "Verifica se token de reset Ã© vÃ¡lido")
    public ResponseEntity<?> validateToken(@RequestParam(value = "token") String token) {
        boolean valid = passwordResetService.validateToken(token);
        return ResponseEntity.ok(Map.of(
                "valid", valid
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Resetar senha", description = "Define nova senha usando token de reset")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            boolean success = passwordResetService.resetPassword(
                    request.getToken(),
                    request.getNewPassword()
            );

            if (success) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Senha alterada com sucesso! VocÃª jÃ¡ pode fazer login."
                ));
            } else {
                return ResponseEntity.status(400).body(Map.of(
                        "success", false,
                        "message", "Token invÃ¡lido ou expirado. Solicite um novo link de recuperaÃ§Ã£o."
                ));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Erro ao resetar senha: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Erro ao resetar senha. Tente novamente."
            ));
        }
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    // DTOs
    public static class ForgotPasswordRequest {
        private String email;
        private String deliveryMethod; // "email" ou "whatsapp"

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getDeliveryMethod() { return deliveryMethod; }
        public void setDeliveryMethod(String deliveryMethod) { this.deliveryMethod = deliveryMethod; }
    }

    public static class ResetPasswordRequest {
        private String token;
        private String newPassword;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}


