package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VisitControlDTO;
import com.z7design.fleet_manager.dto.VisitControlStatsDTO;
import com.z7design.fleet_manager.model.enums.VisitControlStatus;
import com.z7design.fleet_manager.service.VisitControlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/visit-controls")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Controle de Visitas", description = "GestÃ£o de controle de visitas")
public class VisitControlController {

    private final VisitControlService visitControlService;

    @GetMapping
    public ResponseEntity<List<VisitControlDTO>> getAllVisitControls() {
        List<VisitControlDTO> visits = visitControlService.getAllVisitControls();
        return ResponseEntity.ok(visits);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitControlDTO> getVisitControlById(@PathVariable UUID id) {
        return visitControlService.getVisitControlById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/today")
    public ResponseEntity<List<VisitControlDTO>> getTodayVisits() {
        List<VisitControlDTO> visits = visitControlService.getTodayVisits();
        return ResponseEntity.ok(visits);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<VisitControlDTO>> getRecentVisits() {
        List<VisitControlDTO> visits = visitControlService.getRecentVisits();
        return ResponseEntity.ok(visits);
    }

    @GetMapping("/stats")
    public ResponseEntity<VisitControlStatsDTO> getVisitStats() {
        VisitControlStatsDTO stats = visitControlService.getVisitStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<VisitControlDTO>> getVisitsByStatus(@PathVariable VisitControlStatus status) {
        List<VisitControlDTO> visits = visitControlService.getVisitsByStatus(status);
        return ResponseEntity.ok(visits);
    }

    @GetMapping("/supervisor/{supervisorId}")
    public ResponseEntity<List<VisitControlDTO>> getVisitsBySupervisor(@PathVariable UUID supervisorId) {
        List<VisitControlDTO> visits = visitControlService.getVisitsBySupervisor(supervisorId);
        return ResponseEntity.ok(visits);
    }

    @PostMapping
    public ResponseEntity<VisitControlDTO> createVisitControl(@Valid @RequestBody VisitControlDTO dto) {
        VisitControlDTO created = visitControlService.createVisitControl(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VisitControlDTO> updateVisitControl(
            @PathVariable UUID id,
            @Valid @RequestBody VisitControlDTO dto) {
        VisitControlDTO updated = visitControlService.updateVisitControl(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<VisitControlDTO> startVisit(@PathVariable UUID id) {
        VisitControlDTO updated = visitControlService.startVisit(id);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<VisitControlDTO> completeVisit(
            @PathVariable UUID id,
            @RequestParam(required = false) String findings,
            @RequestParam(required = false) Boolean isSuccessful) {
        VisitControlDTO updated = visitControlService.completeVisit(id, findings, isSuccessful);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVisitControl(@PathVariable UUID id) {
        visitControlService.deleteVisitControl(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/filtered")
    @Operation(summary = "Buscar visitas com filtros", description = "Busca visitas filtradas por posto de trabalho, status e data")
    public ResponseEntity<List<VisitControlDTO>> getVisitControlsByFilters(
            @RequestParam(required = false) UUID workPostId,
            @RequestParam(required = false) VisitControlStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<VisitControlDTO> visits = visitControlService.getVisitControlsByFilters(workPostId, status, startDate, endDate);
        return ResponseEntity.ok(visits);
    }

    @GetMapping(value = "/report/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Gerar relatÃ³rio PDF de visitas (download direto)", description = "Gera relatÃ³rio PDF filtrado por posto de trabalho, status e data e faz download direto")
    public ResponseEntity<byte[]> generatePDFReport(
            @RequestParam(required = false) UUID workPostId,
            @RequestParam(required = false) VisitControlStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            byte[] pdfBytes = visitControlService.generatePDFReport(workPostId, status, startDate, endDate);
            String fileName = "relatorio-visitas-" + LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF de visitas: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/find-employee")
    @Operation(summary = "Buscar funcionÃ¡rio por CPF ou matrÃ­cula no posto de trabalho", 
               description = "Busca funcionÃ¡rio por CPF ou matrÃ­cula e valida se estÃ¡ atribuÃ­do ao posto de trabalho informado")
    public ResponseEntity<Map<String, Object>> findEmployeeByCpfOrRegistration(
            @RequestParam(required = false) String cpf,
            @RequestParam(required = false) String registrationNumber,
            @RequestParam UUID workPostId) {
        try {
            Map<String, Object> result = visitControlService.findEmployeeByCpfOrRegistration(cpf, registrationNumber, workPostId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao buscar funcionÃ¡rio: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}

















