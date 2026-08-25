package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.WorkJourneyConfig;
import com.z7design.fleet_manager.service.CompanyService;
import com.z7design.fleet_manager.service.WorkJourneyConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/work-journey-configs")
@RequiredArgsConstructor
@Slf4j
public class WorkJourneyConfigController {

    private final WorkJourneyConfigService configService;
    private final CompanyService companyService;

    /**
     * List all configurations (SUPER_ADMIN only).
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN', 'FLEX_ADMIN')")
    public ResponseEntity<?> findAll() {
        try {
            List<WorkJourneyConfig> configs = configService.findAll();
            return ResponseEntity.ok(Map.of("success", true, "data", configs));
        } catch (Exception e) {
            log.error("Erro ao listar configurações de jornada: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Get configuration by company ID.
     */
    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'FLEX_ADMIN')")
    public ResponseEntity<?> findByCompanyId(@PathVariable("companyId") UUID companyId) {
        try {
            WorkJourneyConfig config = configService.findByCompanyId(companyId);
            return ResponseEntity.ok(Map.of("success", true, "data", config));
        } catch (Exception e) {
            log.error("Erro ao buscar config de jornada: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Create or update configuration for a company.
     */
    @PutMapping("/company/{companyId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN', 'FLEX_ADMIN')")
    public ResponseEntity<?> saveOrUpdate(
            @PathVariable("companyId") UUID companyId,
            @RequestBody Map<String, Object> updates) {
        try {
            WorkJourneyConfig config = configService.saveOrUpdate(companyId, updates);
            return ResponseEntity.ok(Map.of("success", true, "data", config, "message", "Configuração salva com sucesso"));
        } catch (Exception e) {
            log.error("Erro ao salvar config de jornada: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Delete configuration by ID.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> delete(@PathVariable("id") UUID id) {
        try {
            configService.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Configuração excluída"));
        } catch (Exception e) {
            log.error("Erro ao excluir config de jornada: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Get companies with their config status (for the admin panel).
     */
    @GetMapping("/admin/companies-status")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN', 'FLEX_ADMIN')")
    public ResponseEntity<?> getCompaniesWithConfigStatus() {
        try {
            var companies = companyService.getAllCompanies();
            var configs = configService.findAll();

            var companyIdsWithConfig = configs.stream()
                    .map(c -> c.getCompanyId().toString())
                    .toList();

            var result = companies.stream().map(company -> {
                boolean hasConfig = companyIdsWithConfig.contains(company.getId().toString());
                return Map.of(
                        "id", company.getId().toString(),
                        "name", company.getName(),
                        "sigla", company.getSigla() != null ? company.getSigla() : "",
                        "cnpj", company.getCnpj() != null ? company.getCnpj() : "",
                        "hasConfig", hasConfig
                );
            }).toList();

            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (Exception e) {
            log.error("Erro ao buscar status de config por empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
