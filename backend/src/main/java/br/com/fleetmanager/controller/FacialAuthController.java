package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.FacialAuthService;

import br.com.fleetmanager.dto.FacialAuthRequest;
import br.com.fleetmanager.dto.FacialAuthResponse;
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
@Tag(name = "Autenticação Facial", description = "Sistema de autenticação por reconhecimento facial para supervisores")
public class FacialAuthController {
    
    private final FacialAuthService facialAuthService;
    
    /**
     * Autentica supervisor por reconhecimento facial
     */
    @PostMapping("/authenticate")
    @Operation(summary = "Autenticar por reconhecimento facial", 
               description = "Autentica um supervisor usando reconhecimento facial e geolocalização")
    public ResponseEntity<FacialAuthResponse> authenticateByFace(
            @RequestBody @Valid FacialAuthRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Tentativa de autenticação facial para coordenadas: {}, {} - IP: {}", 
                request.getLatitude(), request.getLongitude(), clientIp);
        
        try {
            FacialAuthResponse response = facialAuthService.authenticateByFace(request, clientIp, userAgent);
            
            if (response.getSuccess()) {
                log.info("Autenticação facial bem-sucedida para supervisor: {}", response.getSupervisorName());
                return ResponseEntity.ok(response);
            } else {
                log.warn("Falha na autenticação facial: {}", response.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
        } catch (Exception e) {
            log.error("Erro na autenticação facial", e);
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
            @RequestParam UUID supervisorId,
            @RequestParam String embeddingData,
            @RequestParam(defaultValue = "0.8") BigDecimal confidenceScore,
            @RequestParam(defaultValue = "false") boolean livenessVerified) {
        
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
     * Busca estatísticas de autenticação facial para um supervisor
     */
    @GetMapping("/stats/{supervisorId}")
    @Operation(summary = "Estatísticas de autenticação facial", 
               description = "Busca estatísticas de tentativas de login facial para um supervisor")
    public ResponseEntity<Object[]> getSupervisorStats(
            @PathVariable UUID supervisorId,
            @RequestParam(defaultValue = "30") int daysBack) {
        
        log.info("Buscando estatísticas de autenticação facial para supervisor: {} (últimos {} dias)", 
                supervisorId, daysBack);
        
        try {
            java.time.LocalDateTime startTime = java.time.LocalDateTime.now().minusDays(daysBack);
            Object[] stats = facialAuthService.getSupervisorStats(supervisorId, startTime);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("Erro ao buscar estatísticas de autenticação facial", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Busca tentativas suspeitas de autenticação
     */
    @GetMapping("/suspicious-attempts")
    @Operation(summary = "Tentativas suspeitas", 
               description = "Busca tentativas suspeitas de autenticação facial")
    public ResponseEntity<?> getSuspiciousAttempts(
            @RequestParam String ipAddress,
            @RequestParam(defaultValue = "24") int hoursBack) {
        
        log.info("Buscando tentativas suspeitas para IP: {} (últimas {} horas)", ipAddress, hoursBack);
        
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
     * Limpa tentativas antigas de autenticação
     */
    @DeleteMapping("/cleanup")
    @Operation(summary = "Limpeza de tentativas antigas", 
               description = "Remove tentativas de autenticação facial antigas")
    public ResponseEntity<Void> cleanupOldAttempts(
            @RequestParam(defaultValue = "90") int daysBack) {
        
        log.info("Iniciando limpeza de tentativas de autenticação facial (mais de {} dias)", daysBack);
        
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
     * Health check para o sistema de autenticação facial
     */
    @GetMapping("/health")
    @Operation(summary = "Health check", 
               description = "Verifica o status do sistema de autenticação facial")
    public ResponseEntity<Object> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Facial Authentication Service",
            "timestamp", java.time.LocalDateTime.now(),
            "version", "1.0.0"
        ));
    }
    
    /**
     * Obtém o endereço IP real do cliente
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
