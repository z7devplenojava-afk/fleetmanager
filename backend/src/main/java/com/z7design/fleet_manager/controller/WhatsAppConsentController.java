package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.WhatsAppConsentRequest;
import com.z7design.fleet_manager.dto.WhatsAppConsentResponse;
import com.z7design.fleet_manager.service.WhatsAppConsentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/whatsapp-consent")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "WhatsApp Consent", description = "Gerenciamento de consentimento para envio de mensagens WhatsApp (Meta Policy + LGPD)")
public class WhatsAppConsentController {

    private final WhatsAppConsentService consentService;

    @PostMapping("/grant")
    @Operation(summary = "Conceder consentimento WhatsApp", 
               description = "Registra consentimento explÃ­cito do funcionÃ¡rio para receber holerites via WhatsApp")
    public ResponseEntity<WhatsAppConsentResponse> grantConsent(
            @Valid @RequestBody WhatsAppConsentRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("ðŸ“ SolicitaÃ§Ã£o de consentimento WhatsApp para userId: {}", request.getUserId());
        
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        WhatsAppConsentResponse response = consentService.grantConsent(
                request.getUserId(),
                request.getWhatsappNumber(),
                ipAddress,
                userAgent
        );
        
        log.info("âœ… Consentimento WhatsApp registrado com sucesso para userId: {}", request.getUserId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/revoke")
    @Operation(summary = "Revogar consentimento WhatsApp", 
               description = "Remove consentimento do funcionÃ¡rio para receber mensagens WhatsApp")
    public ResponseEntity<WhatsAppConsentResponse> revokeConsent(
            @Valid @RequestBody WhatsAppConsentRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("ðŸš« SolicitaÃ§Ã£o de revogaÃ§Ã£o de consentimento WhatsApp para userId: {}", request.getUserId());
        
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        WhatsAppConsentResponse response = consentService.revokeConsent(
                request.getUserId(),
                ipAddress,
                userAgent
        );
        
        log.info("âœ… Consentimento WhatsApp revogado com sucesso para userId: {}", request.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{userId}")
    @Operation(summary = "Verificar status do consentimento", 
               description = "Retorna se o funcionÃ¡rio autorizou receber mensagens WhatsApp")
    public ResponseEntity<WhatsAppConsentResponse> checkConsentStatus(@PathVariable UUID userId) {
        
        log.info("ðŸ” Verificando status de consentimento WhatsApp para userId: {}", userId);
        
        WhatsAppConsentResponse response = consentService.checkConsentStatus(userId);
        
        return ResponseEntity.ok(response);
    }

    /**
     * ObtÃ©m o IP do cliente considerando proxies
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Se tiver mÃºltiplos IPs (proxy chain), pegar o primeiro
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}


