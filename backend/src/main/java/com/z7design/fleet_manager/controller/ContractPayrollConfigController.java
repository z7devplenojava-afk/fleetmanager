package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.ContractPayrollConfig;
import com.z7design.fleet_manager.service.ContractPayrollConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/contract-payroll-config")
@RequiredArgsConstructor
@Slf4j
public class ContractPayrollConfigController {

    private final ContractPayrollConfigService configService;

    @GetMapping("/contract/{contractId}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getConfigByContractId(@PathVariable("contractId") UUID contractId) {
        try {
            ContractPayrollConfig config = configService.getConfigByContractId(contractId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", config
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar configuraÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getConfigForEmployee(@PathVariable("employeeId") UUID employeeId) {
        try {
            ContractPayrollConfig config = configService.getConfigForEmployee(employeeId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", config
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar configuraÃ§Ã£o para funcionÃ¡rio: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> createConfig(@RequestBody ContractPayrollConfig config) {
        try {
            ContractPayrollConfig created = configService.create(config);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "ConfiguraÃ§Ã£o criada com sucesso",
                    "data", created
            ));
        } catch (Exception e) {
            log.error("Erro ao criar configuraÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> updateConfig(@PathVariable("id") UUID id, @RequestBody ContractPayrollConfig config) {
        try {
            ContractPayrollConfig updated = configService.update(id, config);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "ConfiguraÃ§Ã£o atualizada com sucesso",
                    "data", updated
            ));
        } catch (Exception e) {
            log.error("Erro ao atualizar configuraÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deleteConfig(@PathVariable("id") UUID id) {
        try {
            configService.delete(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "ConfiguraÃ§Ã£o deletada com sucesso"
            ));
        } catch (Exception e) {
            log.error("Erro ao deletar configuraÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}






