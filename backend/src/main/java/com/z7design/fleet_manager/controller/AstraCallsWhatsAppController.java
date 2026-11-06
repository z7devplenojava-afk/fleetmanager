package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.enums.WhatsAppProviderType;
import com.z7design.fleet_manager.service.whatsapp.AstraCallsException;
import com.z7design.fleet_manager.service.whatsapp.AstraCallsSessionService;
import com.z7design.fleet_manager.service.whatsapp.CompanyWhatsAppConfigService;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Conexao do WhatsApp via AstraCalls.
 *
 * <p>Permite listar/criar contas, parear (QR ou codigo), desconectar e
 * escolher o provedor usado pela empresa.</p>
 */
@RestController
@RequestMapping("/api/whatsapp/astracalls")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"},
        allowedHeaders = "*",
        methods = {org.springframework.web.bind.annotation.RequestMethod.GET,
                org.springframework.web.bind.annotation.RequestMethod.POST,
                org.springframework.web.bind.annotation.RequestMethod.PUT,
                org.springframework.web.bind.annotation.RequestMethod.DELETE,
                org.springframework.web.bind.annotation.RequestMethod.OPTIONS})
public class AstraCallsWhatsAppController {

    private final AstraCallsSessionService sessionService;
    private final CompanyWhatsAppConfigService configService;

    @GetMapping("/status")
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(sessionService.status(currentCompanyId()));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> sessions() {
        try {
            return ResponseEntity.ok(Map.of("sessions", sessionService.listSessions()));
        } catch (AstraCallsException e) {
            log.warn("Erro ao listar sessoes AstraCalls: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("sessions", List.of(), "error", e.getMessage()));
        }
    }

    @PostMapping("/session")
    public ResponseEntity<?> createSession(@RequestBody(required = false) Map<String, Object> body) {
        UUID companyId = currentCompanyId();
        if (companyId == null) {
            return ResponseEntity.ok(Map.of("success", false, "error", "Empresa nao identificada para a requisicao."));
        }

        String name = body != null && body.get("name") != null ? String.valueOf(body.get("name")) : null;
        try {
            String sessionId = sessionService.createSession(companyId, name);
            return ResponseEntity.ok(Map.of("success", true, "sessionId", sessionId));
        } catch (AstraCallsException e) {
            log.warn("Erro ao criar sessao AstraCalls: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/pair")
    public ResponseEntity<?> pair() {
        try {
            sessionService.requestPairing(currentCompanyId());
            return ResponseEntity.ok(Map.of("success", true,
                    "message", "Pareamento por QR Code iniciado. Acompanhe o QR no AstraCalls."));
        } catch (AstraCallsException e) {
            log.warn("Erro ao iniciar pareamento AstraCalls: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/pair-code")
    public ResponseEntity<?> pairCode(@RequestBody(required = false) Map<String, Object> body) {
        String phone = body != null && body.get("phone") != null ? String.valueOf(body.get("phone")) : null;
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.ok(Map.of("success", false, "error", "Informe o numero do WhatsApp (com DDD e DDI)."));
        }

        try {
            String code = sessionService.requestPairCode(currentCompanyId(), phone);
            return ResponseEntity.ok(Map.of("success", true, "code", code));
        } catch (AstraCallsException e) {
            log.warn("Erro ao gerar codigo de pareamento AstraCalls: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        try {
            sessionService.logout(currentCompanyId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (AstraCallsException e) {
            log.warn("Erro ao desconectar sessao AstraCalls: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/session")
    public ResponseEntity<?> deleteSession() {
        UUID companyId = currentCompanyId();
        if (companyId == null) {
            return ResponseEntity.ok(Map.of("success", false, "error", "Empresa nao identificada para a requisicao."));
        }
        try {
            sessionService.deleteSession(companyId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (AstraCallsException e) {
            log.warn("Erro ao remover sessao AstraCalls: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Define o provedor de WhatsApp da empresa (AstraCalls ou Evolution).
     */
    @PutMapping("/config")
    public ResponseEntity<?> updateConfig(@RequestBody(required = false) Map<String, Object> body) {
        UUID companyId = currentCompanyId();
        if (companyId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "Empresa nao identificada para a requisicao."));
        }

        Map<String, Object> payload = body != null ? new HashMap<>(body) : new HashMap<>();
        WhatsAppProviderType provider = parseProvider(payload.get("provider"));
        Boolean enabled = payload.get("enabled") != null
                ? Boolean.parseBoolean(String.valueOf(payload.get("enabled")))
                : null;
        String sessionId = payload.get("sessionId") != null
                ? String.valueOf(payload.get("sessionId"))
                : null;

        try {
            var config = configService.upsert(companyId, provider, enabled, sessionId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("provider", config.getProvider().name());
            response.put("enabled", config.getEnabled());
            response.put("sessionId", config.getSessionId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    private WhatsAppProviderType parseProvider(Object value) {
        if (value == null) {
            return null;
        }
        String raw = String.valueOf(value).trim();
        if (raw.isEmpty()) {
            return null;
        }
        try {
            return WhatsAppProviderType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Provedor invalido: " + raw + " (use ASTRACALLS ou EVOLUTION).");
        }
    }

    private UUID currentCompanyId() {
        return TenantContext.get();
    }
}
