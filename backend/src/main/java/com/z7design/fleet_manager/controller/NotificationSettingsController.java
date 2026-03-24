package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.NotificationSettingsDTO;
import com.z7design.fleet_manager.service.NotificationSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notification-settings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "ConfiguraÃ§Ãµes de NotificaÃ§Ãµes", description = "API para gerenciamento de configuraÃ§Ãµes de notificaÃ§Ãµes")
public class NotificationSettingsController {
    
    private final NotificationSettingsService notificationSettingsService;
    
    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR')")
    @Operation(summary = "Buscar configuraÃ§Ãµes de notificaÃ§Ã£o da empresa", description = "Retorna as configuraÃ§Ãµes de notificaÃ§Ã£o de uma empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "ConfiguraÃ§Ãµes encontradas"),
            @ApiResponse(responseCode = "404", description = "ConfiguraÃ§Ãµes nÃ£o encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<NotificationSettingsDTO> getCompanyNotificationSettings(@PathVariable UUID companyId) {
        log.info("GET /api/notification-settings/company/{} - Buscando configuraÃ§Ãµes de notificaÃ§Ã£o", companyId);
        
        try {
            NotificationSettingsDTO settings = notificationSettingsService.getCompanyNotificationSettings(companyId);
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            log.error("Erro ao buscar configuraÃ§Ãµes de notificaÃ§Ã£o para empresa {}: {}", companyId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/company/{companyId}/user/{userId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR') or #userId.toString() == authentication.principal.id")
    @Operation(summary = "Buscar configuraÃ§Ãµes de notificaÃ§Ã£o do usuÃ¡rio", description = "Retorna as configuraÃ§Ãµes de notificaÃ§Ã£o de um usuÃ¡rio especÃ­fico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "ConfiguraÃ§Ãµes encontradas"),
            @ApiResponse(responseCode = "404", description = "ConfiguraÃ§Ãµes nÃ£o encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<NotificationSettingsDTO> getUserNotificationSettings(
            @PathVariable UUID companyId, 
            @PathVariable UUID userId) {
        log.info("GET /api/notification-settings/company/{}/user/{} - Buscando configuraÃ§Ãµes de notificaÃ§Ã£o", companyId, userId);
        
        try {
            NotificationSettingsDTO settings = notificationSettingsService.getUserNotificationSettings(companyId, userId);
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            log.error("Erro ao buscar configuraÃ§Ãµes de notificaÃ§Ã£o para usuÃ¡rio {} da empresa {}: {}", userId, companyId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','ROLE_SUPER_ADMIN','ROLE_ADMIN')")
    @Operation(summary = "Listar todas as configuraÃ§Ãµes", description = "Retorna todas as configuraÃ§Ãµes de notificaÃ§Ã£o do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de configuraÃ§Ãµes"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<NotificationSettingsDTO>> getAllNotificationSettings() {
        log.info("GET /api/notification-settings - Listando todas as configuraÃ§Ãµes de notificaÃ§Ã£o");
        
        try {
            List<NotificationSettingsDTO> settings = notificationSettingsService.getAllNotificationSettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            log.error("Erro ao listar configuraÃ§Ãµes de notificaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','ROLE_SUPER_ADMIN','ROLE_ADMIN')")
    @Operation(summary = "Criar configuraÃ§Ãµes de notificaÃ§Ã£o", description = "Cria novas configuraÃ§Ãµes de notificaÃ§Ã£o")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "ConfiguraÃ§Ãµes criadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<NotificationSettingsDTO> createNotificationSettings(@Valid @RequestBody NotificationSettingsDTO settingsDTO) {
        log.info("POST /api/notification-settings - Criando configuraÃ§Ãµes de notificaÃ§Ã£o para empresa: {}", settingsDTO.getCompanyId());
        
        try {
            NotificationSettingsDTO createdSettings = notificationSettingsService.createNotificationSettings(settingsDTO);
            return ResponseEntity.status(201).body(createdSettings);
        } catch (Exception e) {
            log.error("Erro ao criar configuraÃ§Ãµes de notificaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/company/{companyId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR')")
    @Operation(summary = "Atualizar configuraÃ§Ãµes de notificaÃ§Ã£o da empresa", description = "Atualiza as configuraÃ§Ãµes de notificaÃ§Ã£o de uma empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "ConfiguraÃ§Ãµes atualizadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "ConfiguraÃ§Ãµes nÃ£o encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<NotificationSettingsDTO> updateCompanyNotificationSettings(
            @PathVariable UUID companyId, 
            @Valid @RequestBody NotificationSettingsDTO settingsDTO) {
        log.info("PUT /api/notification-settings/company/{} - Atualizando configuraÃ§Ãµes de notificaÃ§Ã£o", companyId);
        
        try {
            NotificationSettingsDTO updatedSettings = notificationSettingsService.updateCompanyNotificationSettings(companyId, settingsDTO);
            return ResponseEntity.ok(updatedSettings);
        } catch (Exception e) {
            log.error("Erro ao atualizar configuraÃ§Ãµes de notificaÃ§Ã£o para empresa {}: {}", companyId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/company/{companyId}/user/{userId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR') or #userId.toString() == authentication.principal.id")
    @Operation(summary = "Atualizar configuraÃ§Ãµes de notificaÃ§Ã£o do usuÃ¡rio", description = "Atualiza as configuraÃ§Ãµes de notificaÃ§Ã£o de um usuÃ¡rio especÃ­fico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "ConfiguraÃ§Ãµes atualizadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "ConfiguraÃ§Ãµes nÃ£o encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<NotificationSettingsDTO> updateUserNotificationSettings(
            @PathVariable UUID companyId, 
            @PathVariable UUID userId,
            @Valid @RequestBody NotificationSettingsDTO settingsDTO) {
        log.info("PUT /api/notification-settings/company/{}/user/{} - Atualizando configuraÃ§Ãµes de notificaÃ§Ã£o", companyId, userId);
        
        try {
            NotificationSettingsDTO updatedSettings = notificationSettingsService.updateUserNotificationSettings(companyId, userId, settingsDTO);
            return ResponseEntity.ok(updatedSettings);
        } catch (Exception e) {
            log.error("Erro ao atualizar configuraÃ§Ãµes de notificaÃ§Ã£o para usuÃ¡rio {} da empresa {}: {}", userId, companyId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/company/{companyId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','ROLE_SUPER_ADMIN','ROLE_ADMIN')")
    @Operation(summary = "Deletar configuraÃ§Ãµes de notificaÃ§Ã£o", description = "Remove as configuraÃ§Ãµes de notificaÃ§Ã£o de uma empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "ConfiguraÃ§Ãµes deletadas com sucesso"),
            @ApiResponse(responseCode = "404", description = "ConfiguraÃ§Ãµes nÃ£o encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteNotificationSettings(@PathVariable UUID companyId) {
        log.info("DELETE /api/notification-settings/company/{} - Deletando configuraÃ§Ãµes de notificaÃ§Ã£o", companyId);
        
        try {
            notificationSettingsService.deleteNotificationSettings(companyId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar configuraÃ§Ãµes de notificaÃ§Ã£o para empresa {}: {}", companyId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/test")
    @Operation(summary = "Teste de configuraÃ§Ãµes", description = "Endpoint para testar se as configuraÃ§Ãµes de notificaÃ§Ã£o estÃ£o funcionando")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Teste realizado com sucesso")
    })
    public ResponseEntity<Object> testNotificationSettings() {
        log.info("GET /api/notification-settings/test - Testando configuraÃ§Ãµes de notificaÃ§Ã£o");
        
        return ResponseEntity.ok().body(
            new Object() {
                public final String message = "ConfiguraÃ§Ãµes de notificaÃ§Ã£o funcionando corretamente";
                public final String timestamp = java.time.LocalDateTime.now().toString();
                public final String status = "OK";
            }
        );
    }
}

