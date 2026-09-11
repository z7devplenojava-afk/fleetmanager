package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FacialAuthRequest;
import com.z7design.fleet_manager.dto.FacialAuthResponse;
import com.z7design.fleet_manager.service.FacialAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/facial-auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AutenticaÃ§Ã£o Facial", description = "Sistema de autenticaÃ§Ã£o por reconhecimento facial para supervisores")
public class FacialAuthController {
    
    private final FacialAuthService facialAuthService;
    
    /**
     * Autentica supervisor por reconhecimento facial
     */
    @PostMapping("/authenticate")
    @Operation(summary = "Autenticar por reconhecimento facial", 
               description = "Autentica um supervisor usando reconhecimento facial e geolocalizaÃ§Ã£o")
    public ResponseEntity<FacialAuthResponse> authenticateByFace(
            @RequestBody @Valid FacialAuthRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Tentativa de autenticaÃ§Ã£o facial para coordenadas: {}, {} - IP: {}", 
                request.getLatitude(), request.getLongitude(), clientIp);
        
        try {
            FacialAuthResponse response = facialAuthService.authenticateByFace(request, clientIp, userAgent);
            
            if (response.getSuccess()) {
                log.info("AutenticaÃ§Ã£o facial bem-sucedida para supervisor: {}", response.getSupervisorName());
                return ResponseEntity.ok(response);
            } else {
                log.warn("Falha na autenticaÃ§Ã£o facial: {}", response.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
        } catch (Exception e) {
            log.error("Erro na autenticaÃ§Ã£o facial", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Registra novo embedding facial para supervisor
     */
    @PostMapping("/register")
    @Operation(summary = "Registrar embedding facial", 
               description = "Registra um novo embedding facial para um supervisor")
    public ResponseEntity<FacialAuthResponse> registerFace(
            @RequestParam(value = "supervisorId") UUID supervisorId,
            @RequestParam(value = "embeddingData") String embeddingData,
            @RequestParam(value = "confidenceScore", defaultValue = "0.8") BigDecimal confidenceScore,
            @RequestParam(value = "livenessVerified", defaultValue = "false") boolean livenessVerified) {
        
        log.info("Registrando embedding facial para supervisor: {} com score: {}", 
                supervisorId, confidenceScore);
        
        try {
            FacialAuthResponse response = facialAuthService.registerFacialEmbedding(
                supervisorId, embeddingData, confidenceScore, livenessVerified);
            
            if (response.getSuccess()) {
                log.info("Embedding facial registrado com sucesso para supervisor: {}", response.getSupervisorName());
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                log.warn("Falha no registro do embedding facial: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            log.error("Erro no registro do embedding facial", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Busca estatÃ­sticas de autenticaÃ§Ã£o facial para um supervisor
     */
    @GetMapping("/stats/{supervisorId}")
    @Operation(summary = "EstatÃ­sticas de autenticaÃ§Ã£o facial", 
               description = "Busca estatÃ­sticas de tentativas de login facial para um supervisor")
    public ResponseEntity<Object[]> getSupervisorStats(
            @PathVariable("supervisorId") UUID supervisorId,
            @RequestParam(value = "daysBack", defaultValue = "30") int daysBack) {
        
        log.info("Buscando estatÃ­sticas de autenticaÃ§Ã£o facial para supervisor: {} (Ãºltimos {} dias)", 
                supervisorId, daysBack);
        
        try {
            java.time.LocalDateTime startTime = java.time.LocalDateTime.now().minusDays(daysBack);
            Object[] stats = facialAuthService.getSupervisorStats(supervisorId, startTime);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("Erro ao buscar estatÃ­sticas de autenticaÃ§Ã£o facial", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Busca tentativas suspeitas de autenticaÃ§Ã£o
     */
    @GetMapping("/suspicious-attempts")
    @Operation(summary = "Tentativas suspeitas", 
               description = "Busca tentativas suspeitas de autenticaÃ§Ã£o facial")
    public ResponseEntity<?> getSuspiciousAttempts(
            @RequestParam(value = "ipAddress") String ipAddress,
            @RequestParam(value = "hoursBack", defaultValue = "24") int hoursBack) {
        
        log.info("Buscando tentativas suspeitas para IP: {} (Ãºltimas {} horas)", ipAddress, hoursBack);
        
        try {
            java.time.LocalDateTime startTime = java.time.LocalDateTime.now().minusHours(hoursBack);
            var suspiciousAttempts = facialAuthService.getSuspiciousAttempts(ipAddress, startTime);
            return ResponseEntity.ok(suspiciousAttempts);
            
        } catch (Exception e) {
            log.error("Erro ao buscar tentativas suspeitas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Limpa tentativas antigas de autenticaÃ§Ã£o
     */
    @DeleteMapping("/cleanup")
    @Operation(summary = "Limpeza de tentativas antigas", 
               description = "Remove tentativas de autenticaÃ§Ã£o facial antigas")
    public ResponseEntity<Void> cleanupOldAttempts(
            @RequestParam(value = "daysBack", defaultValue = "90") int daysBack) {
        
        log.info("Iniciando limpeza de tentativas de autenticaÃ§Ã£o facial (mais de {} dias)", daysBack);
        
        try {
            java.time.LocalDateTime cutoffDate = java.time.LocalDateTime.now().minusDays(daysBack);
            facialAuthService.cleanupOldAttempts(cutoffDate);
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            log.error("Erro na limpeza de tentativas antigas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Health check para o sistema de autenticaÃ§Ã£o facial
     */
    @GetMapping("/health")
    @Operation(summary = "Health check", 
               description = "Verifica o status do sistema de autenticaÃ§Ã£o facial")
    public ResponseEntity<Object> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Facial Authentication Service",
            "timestamp", java.time.LocalDateTime.now(),
            "version", "1.0.0"
        ));
    }
    
    /**
     * ObtÃ©m o endereÃ§o IP real do cliente
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}

