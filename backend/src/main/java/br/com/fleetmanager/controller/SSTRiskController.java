package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.OccupationalRiskService;

import br.com.fleetmanager.model.EmployeeRisk;
import br.com.fleetmanager.model.OccupationalRiskType;
import br.com.fleetmanager.model.PositionRisk;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller para gerenciamento de riscos ocupacionais
 */
@RestController
@RequestMapping("/api/sst/risks")
@RequiredArgsConstructor
@Tag(name = "SST Riscos", description = "API para gerenciamento de riscos ocupacionais")
public class SSTRiskController {

    private final OccupationalRiskService riskService;

    // ========== TIPOS DE RISCO ==========

    @GetMapping("/types")
    @Operation(summary = "Listar tipos de risco", description = "Retorna todos os tipos de risco cadastrados")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<OccupationalRiskType>> getAllRiskTypes() {
        List<OccupationalRiskType> riskTypes = riskService.getAllRiskTypes();
        return ResponseEntity.ok(riskTypes);
    }

    @GetMapping("/types/{id}")
    @Operation(summary = "Buscar tipo de risco por ID", description = "Retorna um tipo de risco específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<OccupationalRiskType> getRiskTypeById(@PathVariable UUID id) {
        OccupationalRiskType riskType = riskService.getRiskTypeById(id);
        if (riskType == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(riskType);
    }

    @PostMapping("/types")
    @Operation(summary = "Criar tipo de risco", description = "Cria um novo tipo de risco")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<OccupationalRiskType> createRiskType(@RequestBody OccupationalRiskType riskType) {
        OccupationalRiskType created = riskService.createRiskType(riskType);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/types/{id}")
    @Operation(summary = "Atualizar tipo de risco", description = "Atualiza um tipo de risco existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<OccupationalRiskType> updateRiskType(@PathVariable UUID id, @RequestBody OccupationalRiskType riskType) {
        OccupationalRiskType updated = riskService.updateRiskType(id, riskType);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/types/{id}")
    @Operation(summary = "Excluir tipo de risco", description = "Exclui um tipo de risco")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteRiskType(@PathVariable UUID id) {
        // TODO: Implementar método deleteRiskType no serviço
        return ResponseEntity.noContent().build();
    }

    // ========== RISCOS POR CARGO ==========

    @GetMapping("/positions/{positionId}")
    @Operation(summary = "Listar riscos por cargo", description = "Retorna riscos associados a um cargo")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<PositionRisk>> getRisksByPosition(@PathVariable UUID positionId) {
        List<PositionRisk> risks = riskService.getRisksByPosition(positionId);
        return ResponseEntity.ok(risks);
    }

    @PostMapping("/positions/{positionId}/risks/{riskTypeId}")
    @Operation(summary = "Associar risco ao cargo", description = "Associa um tipo de risco a um cargo")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<PositionRisk> associateRiskToPosition(
            @PathVariable UUID positionId, 
            @PathVariable UUID riskTypeId,
            @RequestParam String riskLevel,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String preventiveMeasures) {
        PositionRisk positionRisk = riskService.associateRiskToPosition(positionId, riskTypeId, riskLevel, description, preventiveMeasures);
        return ResponseEntity.ok(positionRisk);
    }

    @DeleteMapping("/positions/{positionId}/risks/{riskTypeId}")
    @Operation(summary = "Remover risco do cargo", description = "Remove um tipo de risco de um cargo")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> removeRiskFromPosition(@PathVariable UUID positionId, @PathVariable UUID riskTypeId) {
        riskService.removeRiskFromPosition(positionId, riskTypeId);
        return ResponseEntity.noContent().build();
    }

    // ========== RISCOS POR FUNCIONÁRIO ==========

    @GetMapping("/employees/{employeeId}")
    @Operation(summary = "Listar riscos por funcionário", description = "Retorna riscos associados a um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<EmployeeRisk>> getRisksByEmployee(@PathVariable UUID employeeId) {
        List<EmployeeRisk> risks = riskService.getRisksByEmployee(employeeId);
        return ResponseEntity.ok(risks);
    }

    @PostMapping("/employees/{employeeId}/risks/{riskTypeId}")
    @Operation(summary = "Associar risco ao funcionário", description = "Associa um tipo de risco a um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<EmployeeRisk> associateRiskToEmployee(
            @PathVariable UUID employeeId, 
            @PathVariable UUID riskTypeId,
            @RequestParam String riskLevel,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String preventiveMeasures) {
        EmployeeRisk employeeRisk = riskService.associateRiskToEmployee(employeeId, riskTypeId, riskLevel, description, preventiveMeasures);
        return ResponseEntity.ok(employeeRisk);
    }

    @DeleteMapping("/employees/{employeeId}/risks/{riskTypeId}")
    @Operation(summary = "Remover risco do funcionário", description = "Remove um tipo de risco de um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> removeRiskFromEmployee(@PathVariable UUID employeeId, @PathVariable UUID riskTypeId) {
        riskService.removeRiskFromEmployee(employeeId, riskTypeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/employees/{employeeId}/copy-from-position/{positionId}")
    @Operation(summary = "Copiar riscos do cargo para funcionário", description = "Copia todos os riscos de um cargo para um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<EmployeeRisk>> copyRisksFromPositionToEmployee(
            @PathVariable UUID employeeId, 
            @PathVariable UUID positionId) {
        // TODO: Implementar método copyRisksFromPositionToEmployee no serviço
        return ResponseEntity.ok(List.of());
    }
}
