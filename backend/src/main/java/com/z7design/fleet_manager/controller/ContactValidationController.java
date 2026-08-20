package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.ContactValidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller para validaÃ§Ã£o de contatos antes do envio de documentos
 */
@RestController
@RequestMapping("/api/contact-validation")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ContactValidationController {
    
    private final ContactValidationService contactValidationService;
    
    /**
     * Valida contatos de funcionÃ¡rios para envio
     */
    @PostMapping("/validate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER')")
    public ResponseEntity<ContactValidationResponse> validateContacts(
            @Valid @RequestBody ContactValidationRequest request) {
        
        log.info("ðŸ“‹ Recebida solicitaÃ§Ã£o de validaÃ§Ã£o para {} funcionÃ¡rios", 
                request.getEmployeeIds().size());
        
        try {
            ContactValidationResponse response = contactValidationService.validateContacts(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("âŒ Erro ao validar contatos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ContactValidationResponse.builder()
                            .message("Erro ao validar contatos: " + e.getMessage())
                            .allReady(false)
                            .build());
        }
    }
    
    /**
     * Cria usuÃ¡rio rapidamente para um funcionÃ¡rio
     */
    @PostMapping("/quick-create-user")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR')")
    public ResponseEntity<Map<String, Object>> quickCreateUser(
            @Valid @RequestBody QuickUserCreateRequest request) {
        
        log.info("ðŸ‘¤ Recebida solicitaÃ§Ã£o de criaÃ§Ã£o rÃ¡pida de usuÃ¡rio para funcionÃ¡rio: {}", 
                request.getEmployeeId());
        
        try {
            User user = contactValidationService.quickCreateUser(request);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "UsuÃ¡rio criado com sucesso",
                    "userId", user.getId().toString(),
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "whatsapp", user.getWhatsapp() != null ? user.getWhatsapp() : "",
                    "defaultPassword", user.getUsername().replaceAll("[^0-9]", "") + "@2025"
            ));
            
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("âš ï¸ Erro de validaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
            
        } catch (Exception e) {
            log.error("âŒ Erro ao criar usuÃ¡rio: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Erro interno ao criar usuÃ¡rio: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Atualiza nÃºmero de WhatsApp de um usuÃ¡rio
     */
    @PatchMapping("/users/{userId}/whatsapp")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR')")
    public ResponseEntity<Map<String, Object>> updateUserWhatsApp(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody UpdateWhatsAppRequest request) {
        
        log.info("ðŸ“± Recebida solicitaÃ§Ã£o de atualizaÃ§Ã£o de WhatsApp para usuÃ¡rio: {}", userId);
        
        try {
            User user = contactValidationService.updateUserWhatsApp(userId, request);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "WhatsApp atualizado com sucesso",
                    "userId", user.getId().toString(),
                    "username", user.getUsername(),
                    "whatsapp", user.getWhatsapp()
            ));
            
        } catch (IllegalArgumentException e) {
            log.warn("âš ï¸ Erro de validaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
            
        } catch (Exception e) {
            log.error("âŒ Erro ao atualizar WhatsApp: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Erro interno ao atualizar WhatsApp: " + e.getMessage()
            ));
        }
    }

    /**
     * Atualiza email de um usuÃ¡rio
     */
    @PatchMapping("/users/{userId}/email")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR')")
    public ResponseEntity<Map<String, Object>> updateUserEmail(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody UpdateEmailRequest request) {

        log.info("ðŸ“§ Recebida solicitaÃ§Ã£o de atualizaÃ§Ã£o de email para usuÃ¡rio: {}", userId);

        try {
            User user = contactValidationService.updateUserEmail(userId, request);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email atualizado com sucesso",
                    "userId", user.getId().toString(),
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));

        } catch (IllegalArgumentException e) {
            log.warn("âš ï¸ Erro de validaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));

        } catch (Exception e) {
            log.error("âŒ Erro ao atualizar email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Erro interno ao atualizar email: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Endpoint de teste de conectividade
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "contact-validation",
                "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}


