package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.AccidentRecordDTO;
import com.z7design.fleet_manager.model.AccidentRecord;
import com.z7design.fleet_manager.model.NearMissRecord;
import com.z7design.fleet_manager.service.EmployeeService;
import com.z7design.fleet_manager.service.SSTAccidentService;
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
    private final EmployeeService employeeService;

    // ========== ACIDENTES ==========

    @GetMapping
    @Operation(summary = "Listar acidentes", description = "Retorna todos os acidentes registrados")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<AccidentRecordDTO>> getAllAccidents() {
        List<AccidentRecord> accidents = accidentService.getAllAccidents();
        List<AccidentRecordDTO> dtos = accidents.stream()
                .map(this::convertToDTO)
                .toList();
        return ResponseEntity.ok(dtos);
    }
    
    private AccidentRecordDTO convertToDTO(AccidentRecord accident) {
        return AccidentRecordDTO.builder()
                .id(accident.getId())
                .employeeId(accident.getEmployee().getId())
                .employeeName(accident.getEmployee().getName())
                .accidentDate(accident.getAccidentDate())
                .accidentTime(accident.getAccidentTime())
                .location(accident.getLocation())
                .accidentType(accident.getAccidentType())
                .description(accident.getDescription())
                .injuryDescription(accident.getInjuryDescription())
                .bodyPartsAffected(accident.getBodyPartsAffected())
                .immediateCauses(accident.getImmediateCauses())
                .rootCauses(accident.getRootCauses())
                .correctiveActions(accident.getCorrectiveActions())
                .preventiveActions(accident.getPreventiveActions())
                .catNumber(accident.getCatNumber())
                .catIssuedDate(accident.getCatIssuedDate())
                .daysOff(accident.getDaysOff())
                .returnToWorkDate(accident.getReturnToWorkDate())
                .witnessNames(accident.getWitnessNames())
                .status(accident.getStatus())
                .photosUrls(accident.getPhotosUrls())
                .documentsUrls(accident.getDocumentsUrls())
                .createdAt(accident.getCreatedAt())
                .updatedAt(accident.getUpdatedAt())
                .build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar acidente por ID", description = "Retorna um acidente especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<AccidentRecord> getAccidentById(@PathVariable("id") UUID id) {
        AccidentRecord accident = accidentService.getAccidentById(id);
        if (accident == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(accident);
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Listar acidentes por funcionÃ¡rio", description = "Retorna acidentes de um funcionÃ¡rio especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<AccidentRecord>> getAccidentsByEmployee(@PathVariable("employeeId") UUID employeeId) {
        List<AccidentRecord> accidents = accidentService.getAccidentsByEmployee(employeeId);
        return ResponseEntity.ok(accidents);
    }

    @GetMapping("/period")
    @Operation(summary = "Listar acidentes por perÃ­odo", description = "Retorna acidentes em um perÃ­odo especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<AccidentRecord>> getAccidentsByPeriod(
            @RequestParam(value = "startDate") LocalDate startDate, 
            @RequestParam(value = "endDate") LocalDate endDate) {
        List<AccidentRecord> accidents = accidentService.getAccidentsByPeriod(startDate, endDate);
        return ResponseEntity.ok(accidents);
    }

    @PostMapping
    @Operation(summary = "Registrar acidente", description = "Registra um novo acidente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<AccidentRecord> createAccident(@RequestBody AccidentRecordDTO dto) {
        // Converter DTO para modelo
        AccidentRecord accident = AccidentRecord.builder()
                .employee(employeeService.findById(dto.getEmployeeId()))
                .accidentDate(dto.getAccidentDate())
                .accidentTime(dto.getAccidentTime())
                .location(dto.getLocation())
                .accidentType(dto.getAccidentType())
                .description(dto.getDescription())
                .injuryDescription(dto.getInjuryDescription())
                .bodyPartsAffected(dto.getBodyPartsAffected())
                .immediateCauses(dto.getImmediateCauses())
                .rootCauses(dto.getRootCauses())
                .correctiveActions(dto.getCorrectiveActions())
                .preventiveActions(dto.getPreventiveActions())
                .catNumber(dto.getCatNumber())
                .catIssuedDate(dto.getCatIssuedDate())
                .daysOff(dto.getDaysOff() != null ? dto.getDaysOff() : 0)
                .returnToWorkDate(dto.getReturnToWorkDate())
                .witnessNames(dto.getWitnessNames())
                .status(dto.getStatus() != null ? dto.getStatus() : com.z7design.fleet_manager.model.enums.AccidentStatus.REGISTRADO)
                .photosUrls(dto.getPhotosUrls())
                .documentsUrls(dto.getDocumentsUrls())
                .build();
        
        AccidentRecord created = accidentService.createAccident(accident);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar acidente", description = "Atualiza um acidente existente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<AccidentRecord> updateAccident(@PathVariable("id") UUID id, @RequestBody AccidentRecord accident) {
        AccidentRecord updated = accidentService.updateAccident(id, accident);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir acidente", description = "Exclui um acidente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteAccident(@PathVariable("id") UUID id) {
        accidentService.deleteAccident(id);
        return ResponseEntity.noContent().build();
    }

    // ========== QUASE-ACIDENTES ==========

    @GetMapping("/near-misses")
    @Operation(summary = "Listar quase-acidentes", description = "Retorna todos os quase-acidentes registrados")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<NearMissRecord>> getAllNearMisses() {
        List<NearMissRecord> nearMisses = accidentService.getAllNearMisses();
        return ResponseEntity.ok(nearMisses);
    }

    @GetMapping("/near-misses/{id}")
    @Operation(summary = "Buscar quase-acidente por ID", description = "Retorna um quase-acidente especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<NearMissRecord> getNearMissById(@PathVariable("id") UUID id) {
        NearMissRecord nearMiss = accidentService.getNearMissById(id);
        if (nearMiss == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(nearMiss);
    }

    @GetMapping("/near-misses/employee/{employeeId}")
    @Operation(summary = "Listar quase-acidentes por funcionÃ¡rio", description = "Retorna quase-acidentes de um funcionÃ¡rio especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<NearMissRecord>> getNearMissesByEmployee(@PathVariable("employeeId") UUID employeeId) {
        List<NearMissRecord> nearMisses = accidentService.getNearMissesByEmployee(employeeId);
        return ResponseEntity.ok(nearMisses);
    }

    @PostMapping("/near-misses")
    @Operation(summary = "Registrar quase-acidente", description = "Registra um novo quase-acidente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<NearMissRecord> createNearMiss(@RequestBody NearMissRecord nearMiss) {
        NearMissRecord created = accidentService.createNearMiss(nearMiss);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/near-misses/{id}")
    @Operation(summary = "Atualizar quase-acidente", description = "Atualiza um quase-acidente existente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<NearMissRecord> updateNearMiss(@PathVariable("id") UUID id, @RequestBody NearMissRecord nearMiss) {
        NearMissRecord updated = accidentService.updateNearMiss(id, nearMiss);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/near-misses/{id}")
    @Operation(summary = "Excluir quase-acidente", description = "Exclui um quase-acidente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteNearMiss(@PathVariable("id") UUID id) {
        accidentService.deleteNearMiss(id);
        return ResponseEntity.noContent().build();
    }

    // ========== RELATÃ“RIOS E ESTATÃSTICAS ==========

    @GetMapping("/statistics/monthly")
    @Operation(summary = "EstatÃ­sticas mensais de acidentes", description = "Retorna estatÃ­sticas de acidentes por mÃªs")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTAccidentService.AccidentStatistics> getMonthlyStatistics(@RequestParam(value = "year") int year) {
        SSTAccidentService.AccidentStatistics statistics = accidentService.getMonthlyStatistics(year);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/statistics/employee/{employeeId}")
    @Operation(summary = "EstatÃ­sticas de acidentes por funcionÃ¡rio", description = "Retorna estatÃ­sticas de acidentes de um funcionÃ¡rio")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<SSTAccidentService.EmployeeAccidentStatistics> getEmployeeStatistics(@PathVariable("employeeId") UUID employeeId) {
        SSTAccidentService.EmployeeAccidentStatistics statistics = accidentService.getEmployeeStatistics(employeeId);
        return ResponseEntity.ok(statistics);
    }

}

