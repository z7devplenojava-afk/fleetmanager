package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.SSTEPIService;

import br.com.fleetmanager.model.PersonalProtectiveEquipment;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para EPIs do módulo SST
 */
@RestController
@RequestMapping("/api/sst/epis")
@RequiredArgsConstructor
@Tag(name = "SST EPIs", description = "API para gerenciamento de EPIs do módulo SST")
public class SSTEPIController {

    private final SSTEPIService epiService;

    @GetMapping
    @Operation(summary = "Listar todos os EPIs", description = "Retorna todos os EPIs cadastrados")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<PersonalProtectiveEquipment>> getAllEPIs() {
        List<PersonalProtectiveEquipment> epis = epiService.getAllEPIs();
        return ResponseEntity.ok(epis);
    }

    @GetMapping("/active")
    @Operation(summary = "Listar EPIs ativos", description = "Retorna todos os EPIs ativos")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<PersonalProtectiveEquipment>> getActiveEPIs() {
        List<PersonalProtectiveEquipment> epis = epiService.getActiveEPIs();
        return ResponseEntity.ok(epis);
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Listar EPIs com estoque baixo", description = "Retorna EPIs com estoque abaixo do mínimo")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<PersonalProtectiveEquipment>> getEPIsWithLowStock() {
        List<PersonalProtectiveEquipment> epis = epiService.getEPIsWithLowStock();
        return ResponseEntity.ok(epis);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar EPI por ID", description = "Retorna um EPI específico pelo ID")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<PersonalProtectiveEquipment> getEPIById(@PathVariable UUID id) {
        PersonalProtectiveEquipment epi = epiService.getEPIById(id);
        if (epi == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(epi);
    }

    @PostMapping
    @Operation(summary = "Criar novo EPI", description = "Cria um novo EPI no sistema")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<PersonalProtectiveEquipment> createEPI(@RequestBody PersonalProtectiveEquipment epi) {
        PersonalProtectiveEquipment createdEPI = epiService.createEPI(epi);
        return ResponseEntity.ok(createdEPI);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar EPI", description = "Atualiza um EPI existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<PersonalProtectiveEquipment> updateEPI(@PathVariable UUID id, @RequestBody PersonalProtectiveEquipment epi) {
        PersonalProtectiveEquipment updatedEPI = epiService.updateEPI(id, epi);
        if (updatedEPI == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedEPI);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativar EPI", description = "Desativa um EPI (não remove do banco)")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deactivateEPI(@PathVariable UUID id) {
        epiService.deactivateEPI(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/stock")
    @Operation(summary = "Atualizar estoque", description = "Atualiza o estoque de um EPI")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> updateStock(@PathVariable UUID id, @RequestParam Integer newStock) {
        epiService.updateEPIStock(id, newStock);
        return ResponseEntity.ok().build();
    }
}
