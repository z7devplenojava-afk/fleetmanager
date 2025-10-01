package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.SSTAccidentService;

import br.com.fleetmanager.model.AccidentRecord;
import br.com.fleetmanager.model.NearMissRecord;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Controller para gerenciamento de acidentes e quase-acidentes
 */
@RestController
@RequestMapping("/api/sst/accidents")
@RequiredArgsConstructor
@Tag(name = "SST Acidentes", description = "API para gerenciamento de acidentes e quase-acidentes")
public class SSTAccidentController {

    private final SSTAccidentService accidentService;

    // ========== ACIDENTES ==========

    @GetMapping
    @Operation(summary = "Listar acidentes", description = "Retorna todos os acidentes registrados")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AccidentRecord>> getAllAccidents() {
        List<AccidentRecord> accidents = accidentService.getAllAccidents();
        return ResponseEntity.ok(accidents);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar acidente por ID", description = "Retorna um acidente específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<AccidentRecord> getAccidentById(@PathVariable UUID id) {
        AccidentRecord accident = accidentService.getAccidentById(id);
        if (accident == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(accident);
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Listar acidentes por funcionário", description = "Retorna acidentes de um funcionário específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AccidentRecord>> getAccidentsByEmployee(@PathVariable UUID employeeId) {
        List<AccidentRecord> accidents = accidentService.getAccidentsByEmployee(employeeId);
        return ResponseEntity.ok(accidents);
    }

    @GetMapping("/period")
    @Operation(summary = "Listar acidentes por período", description = "Retorna acidentes em um período específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<AccidentRecord>> getAccidentsByPeriod(
            @RequestParam LocalDate startDate, 
            @RequestParam LocalDate endDate) {
        List<AccidentRecord> accidents = accidentService.getAccidentsByPeriod(startDate, endDate);
        return ResponseEntity.ok(accidents);
    }

    @PostMapping
    @Operation(summary = "Registrar acidente", description = "Registra um novo acidente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<AccidentRecord> createAccident(@RequestBody AccidentRecord accident) {
        AccidentRecord created = accidentService.createAccident(accident);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar acidente", description = "Atualiza um acidente existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<AccidentRecord> updateAccident(@PathVariable UUID id, @RequestBody AccidentRecord accident) {
        AccidentRecord updated = accidentService.updateAccident(id, accident);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir acidente", description = "Exclui um acidente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteAccident(@PathVariable UUID id) {
        accidentService.deleteAccident(id);
        return ResponseEntity.noContent().build();
    }

    // ========== QUASE-ACIDENTES ==========

    @GetMapping("/near-misses")
    @Operation(summary = "Listar quase-acidentes", description = "Retorna todos os quase-acidentes registrados")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<NearMissRecord>> getAllNearMisses() {
        List<NearMissRecord> nearMisses = accidentService.getAllNearMisses();
        return ResponseEntity.ok(nearMisses);
    }

    @GetMapping("/near-misses/{id}")
    @Operation(summary = "Buscar quase-acidente por ID", description = "Retorna um quase-acidente específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<NearMissRecord> getNearMissById(@PathVariable UUID id) {
        NearMissRecord nearMiss = accidentService.getNearMissById(id);
        if (nearMiss == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(nearMiss);
    }

    @GetMapping("/near-misses/employee/{employeeId}")
    @Operation(summary = "Listar quase-acidentes por funcionário", description = "Retorna quase-acidentes de um funcionário específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<NearMissRecord>> getNearMissesByEmployee(@PathVariable UUID employeeId) {
        List<NearMissRecord> nearMisses = accidentService.getNearMissesByEmployee(employeeId);
        return ResponseEntity.ok(nearMisses);
    }

    @PostMapping("/near-misses")
    @Operation(summary = "Registrar quase-acidente", description = "Registra um novo quase-acidente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<NearMissRecord> createNearMiss(@RequestBody NearMissRecord nearMiss) {
        NearMissRecord created = accidentService.createNearMiss(nearMiss);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/near-misses/{id}")
    @Operation(summary = "Atualizar quase-acidente", description = "Atualiza um quase-acidente existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<NearMissRecord> updateNearMiss(@PathVariable UUID id, @RequestBody NearMissRecord nearMiss) {
        NearMissRecord updated = accidentService.updateNearMiss(id, nearMiss);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/near-misses/{id}")
    @Operation(summary = "Excluir quase-acidente", description = "Exclui um quase-acidente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteNearMiss(@PathVariable UUID id) {
        accidentService.deleteNearMiss(id);
        return ResponseEntity.noContent().build();
    }

    // ========== RELATÓRIOS E ESTATÍSTICAS ==========

    @GetMapping("/statistics/monthly")
    @Operation(summary = "Estatísticas mensais de acidentes", description = "Retorna estatísticas de acidentes por mês")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<SSTAccidentService.AccidentStatistics> getMonthlyStatistics(@RequestParam int year) {
        SSTAccidentService.AccidentStatistics statistics = accidentService.getMonthlyStatistics(year);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/statistics/employee/{employeeId}")
    @Operation(summary = "Estatísticas de acidentes por funcionário", description = "Retorna estatísticas de acidentes de um funcionário")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<SSTAccidentService.EmployeeAccidentStatistics> getEmployeeStatistics(@PathVariable UUID employeeId) {
        SSTAccidentService.EmployeeAccidentStatistics statistics = accidentService.getEmployeeStatistics(employeeId);
        return ResponseEntity.ok(statistics);
    }

}
