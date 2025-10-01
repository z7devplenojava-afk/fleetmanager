package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.CompanyConfigService;

import br.com.fleetmanager.dto.CompanyConfigDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/company-config")
@RequiredArgsConstructor
@Slf4j
public class CompanyConfigController {

    private final CompanyConfigService companyConfigService;

    /**
     * Busca a configuração ativa da empresa
     */
    @GetMapping("/active")
    public ResponseEntity<CompanyConfigDTO> getActiveConfig() {
        log.info("GET /api/company-config/active - Buscando configuração ativa");
        
        Optional<CompanyConfigDTO> config = companyConfigService.getActiveConfig();
        
        if (config.isPresent()) {
            return ResponseEntity.ok(config.get());
        } else {
            return ResponseEntity.noContent().build();
        }
    }

    /**
     * Verifica se existe configuração ativa
     */
    @GetMapping("/exists")
    public ResponseEntity<Boolean> hasActiveConfig() {
        log.info("GET /api/company-config/exists - Verificando se existe configuração");
        boolean exists = companyConfigService.hasActiveConfig();
        return ResponseEntity.ok(exists);
    }

    /**
     * Salva ou atualiza configuração da empresa
     */
    @PostMapping
    public ResponseEntity<CompanyConfigDTO> saveConfig(@Valid @RequestBody CompanyConfigDTO configDTO) {
        log.info("POST /api/company-config - Salvando configuração da empresa");
        
        try {
            CompanyConfigDTO savedConfig = companyConfigService.saveConfig(configDTO);
            return ResponseEntity.ok(savedConfig);
        } catch (RuntimeException e) {
            log.error("Erro ao salvar configuração: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Busca configuração por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CompanyConfigDTO> getConfigById(@PathVariable UUID id) {
        log.info("GET /api/company-config/{} - Buscando configuração por ID", id);
        
        Optional<CompanyConfigDTO> config = companyConfigService.getConfigById(id);
        
        if (config.isPresent()) {
            return ResponseEntity.ok(config.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Desativa uma configuração
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateConfig(@PathVariable UUID id) {
        log.info("DELETE /api/company-config/{} - Desativando configuração", id);
        
        companyConfigService.deactivateConfig(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Upload de logo da empresa
     * TODO: Implementar upload de arquivo para storage (AWS S3, etc.)
     */
    @PostMapping("/{id}/logo")
    public ResponseEntity<String> uploadLogo(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        
        log.info("POST /api/company-config/{}/logo - Upload de logo", id);
        
        // TODO: Implementar upload real
        // Por enquanto, retornar uma URL de exemplo
        String logoUrl = "https://example.com/logos/" + file.getOriginalFilename();
        
        return ResponseEntity.ok(logoUrl);
    }
}
