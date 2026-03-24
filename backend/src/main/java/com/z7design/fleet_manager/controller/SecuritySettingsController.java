package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.SecuritySettingsDTO;
import com.z7design.fleet_manager.service.SecuritySettingsService;
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
@RequestMapping("/api/security-settings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "ConfiguraÃ§Ãµes de SeguranÃ§a", description = "API para gerenciamento de configuraÃ§Ãµes de seguranÃ§a")
public class SecuritySettingsController {
    
    private final SecuritySettingsService securitySettingsService;
    
    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR')")
    @Operation(summary = "Buscar configuraÃ§Ãµes de seguranÃ§a", description = "Retorna as configuraÃ§Ãµes de seguranÃ§a de uma empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "ConfiguraÃ§Ãµes encontradas"),
            @ApiResponse(responseCode = "404", description = "ConfiguraÃ§Ãµes nÃ£o encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<SecuritySettingsDTO> getSecuritySettings(@PathVariable UUID companyId) {
        log.info("GET /api/security-settings/company/{} - Buscando configuraÃ§Ãµes de seguranÃ§a", companyId);
        
        try {
            SecuritySettingsDTO settings = securitySettingsService.getSecuritySettings(companyId);
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            log.error("Erro ao buscar configuraÃ§Ãµes de seguranÃ§a para empresa {}: {}", companyId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','ROLE_SUPER_ADMIN','ROLE_ADMIN')")
    @Operation(summary = "Listar todas as configuraÃ§Ãµes", description = "Retorna todas as configuraÃ§Ãµes de seguranÃ§a do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de configuraÃ§Ãµes"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<SecuritySettingsDTO>> getAllSecuritySettings() {
        log.info("GET /api/security-settings - Listando todas as configuraÃ§Ãµes de seguranÃ§a");
        
        try {
            List<SecuritySettingsDTO> settings = securitySettingsService.getAllSecuritySettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            log.error("Erro ao listar configuraÃ§Ãµes de seguranÃ§a: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','ROLE_SUPER_ADMIN','ROLE_ADMIN')")
    @Operation(summary = "Criar configuraÃ§Ãµes de seguranÃ§a", description = "Cria novas configuraÃ§Ãµes de seguranÃ§a para uma empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "ConfiguraÃ§Ãµes criadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<SecuritySettingsDTO> createSecuritySettings(@Valid @RequestBody SecuritySettingsDTO settingsDTO) {
        log.info("POST /api/security-settings - Criando configuraÃ§Ãµes de seguranÃ§a para empresa: {}", settingsDTO.getCompanyId());
        
        try {
            SecuritySettingsDTO createdSettings = securitySettingsService.createSecuritySettings(settingsDTO);
            return ResponseEntity.status(201).body(createdSettings);
        } catch (Exception e) {
            log.error("Erro ao criar configuraÃ§Ãµes de seguranÃ§a: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/company/{companyId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR')")
    @Operation(summary = "Atualizar configuraÃ§Ãµes de seguranÃ§a", description = "Atualiza as configuraÃ§Ãµes de seguranÃ§a de uma empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "ConfiguraÃ§Ãµes atualizadas com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "ConfiguraÃ§Ãµes nÃ£o encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<SecuritySettingsDTO> updateSecuritySettings(
            @PathVariable UUID companyId, 
            @Valid @RequestBody SecuritySettingsDTO settingsDTO) {
        log.info("PUT /api/security-settings/company/{} - Atualizando configuraÃ§Ãµes de seguranÃ§a", companyId);
        
        try {
            SecuritySettingsDTO updatedSettings = securitySettingsService.updateSecuritySettings(companyId, settingsDTO);
            return ResponseEntity.ok(updatedSettings);
        } catch (Exception e) {
            log.error("Erro ao atualizar configuraÃ§Ãµes de seguranÃ§a para empresa {}: {}", companyId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/company/{companyId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','ROLE_SUPER_ADMIN','ROLE_ADMIN')")
    @Operation(summary = "Deletar configuraÃ§Ãµes de seguranÃ§a", description = "Remove as configuraÃ§Ãµes de seguranÃ§a de uma empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "ConfiguraÃ§Ãµes deletadas com sucesso"),
            @ApiResponse(responseCode = "404", description = "ConfiguraÃ§Ãµes nÃ£o encontradas"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteSecuritySettings(@PathVariable UUID companyId) {
        log.info("DELETE /api/security-settings/company/{} - Deletando configuraÃ§Ãµes de seguranÃ§a", companyId);
        
        try {
            securitySettingsService.deleteSecuritySettings(companyId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar configuraÃ§Ãµes de seguranÃ§a para empresa {}: {}", companyId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/test")
    @Operation(summary = "Teste de configuraÃ§Ãµes", description = "Endpoint para testar se as configuraÃ§Ãµes de seguranÃ§a estÃ£o funcionando")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Teste realizado com sucesso")
    })
    public ResponseEntity<Object> testSecuritySettings() {
        log.info("GET /api/security-settings/test - Testando configuraÃ§Ãµes de seguranÃ§a");
        
        return ResponseEntity.ok().body(
            new Object() {
                public final String message = "ConfiguraÃ§Ãµes de seguranÃ§a funcionando corretamente";
                public final String timestamp = java.time.LocalDateTime.now().toString();
                public final String status = "OK";
            }
        );
    }
}

