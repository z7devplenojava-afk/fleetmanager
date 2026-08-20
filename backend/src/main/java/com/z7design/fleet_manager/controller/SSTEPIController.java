package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.EPIStockDTO;
import com.z7design.fleet_manager.model.PersonalProtectiveEquipment;
import com.z7design.fleet_manager.service.SSTEPIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para EPIs do mÃ³dulo SST
 */
@RestController
@RequestMapping("/api/sst/epis")
@RequiredArgsConstructor
@Tag(name = "SST EPIs", description = "API para gerenciamento de EPIs do mÃ³dulo SST")
public class SSTEPIController {

    private final SSTEPIService epiService;

    @GetMapping
    @Operation(summary = "Listar todos os EPIs", description = "Retorna todos os EPIs cadastrados")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PersonalProtectiveEquipment>> getAllEPIs() {
        List<PersonalProtectiveEquipment> epis = epiService.getAllEPIs();
        return ResponseEntity.ok(epis);
    }

    @GetMapping("/active")
    @Operation(summary = "Listar EPIs ativos", description = "Retorna todos os EPIs ativos")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PersonalProtectiveEquipment>> getActiveEPIs() {
        List<PersonalProtectiveEquipment> epis = epiService.getActiveEPIs();
        return ResponseEntity.ok(epis);
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Listar EPIs com estoque baixo", description = "Retorna EPIs com estoque abaixo do mÃ­nimo")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<PersonalProtectiveEquipment>> getEPIsWithLowStock() {
        List<PersonalProtectiveEquipment> epis = epiService.getEPIsWithLowStock();
        return ResponseEntity.ok(epis);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar EPI por ID", description = "Retorna um EPI especÃ­fico pelo ID")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PersonalProtectiveEquipment> getEPIById(@PathVariable("id") UUID id) {
        PersonalProtectiveEquipment epi = epiService.getEPIById(id);
        if (epi == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(epi);
    }

    @PostMapping
    @Operation(summary = "Criar novo EPI", description = "Cria um novo EPI no sistema")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PersonalProtectiveEquipment> createEPI(@RequestBody PersonalProtectiveEquipment epi) {
        PersonalProtectiveEquipment createdEPI = epiService.createEPI(epi);
        return ResponseEntity.ok(createdEPI);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar EPI", description = "Atualiza um EPI existente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<PersonalProtectiveEquipment> updateEPI(@PathVariable("id") UUID id, @RequestBody PersonalProtectiveEquipment epi) {
        PersonalProtectiveEquipment updatedEPI = epiService.updateEPI(id, epi);
        if (updatedEPI == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedEPI);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativar EPI", description = "Desativa um EPI (nÃ£o remove do banco)")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deactivateEPI(@PathVariable("id") UUID id) {
        epiService.deactivateEPI(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/stock")
    @Operation(summary = "Atualizar estoque", description = "Atualiza o estoque de um EPI")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> updateStock(@PathVariable("id") UUID id, @RequestParam(value = "newStock") Integer newStock) {
        epiService.updateEPIStock(id, newStock);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stock-inventory")
    @Operation(summary = "Listar EPIs em formato de estoque", description = "Retorna todos os EPIs no formato de estoque para o frontend")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<EPIStockDTO>> getEPIStockInventory() {
        System.out.println("ðŸ” SSTEPIController.getEPIStockInventory - Iniciando busca de estoque");
        List<EPIStockDTO> stock = epiService.getEPIStockInventory();
        System.out.println("âœ… SSTEPIController.getEPIStockInventory - Retornando " + stock.size() + " EPIs");
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/stock-inventory/active")
    @Operation(summary = "Listar EPIs ativos em formato de estoque", description = "Retorna EPIs ativos no formato de estoque para o frontend")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<EPIStockDTO>> getActiveEPIStockInventory() {
        List<EPIStockDTO> stock = epiService.getActiveEPIStockInventory();
        return ResponseEntity.ok(stock);
    }
}

