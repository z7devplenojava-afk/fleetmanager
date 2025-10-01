package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.VisitService;

import br.com.fleetmanager.dto.VisitDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/visits")
@RequiredArgsConstructor
@Slf4j
public class VisitController {
    
    private final VisitService visitService;
    
    @GetMapping("/supervisor/{supervisorId}")
    public ResponseEntity<List<VisitDTO>> getVisitsBySupervisor(
            @PathVariable UUID supervisorId,
            @RequestParam int year,
            @RequestParam int month) {
        
        log.info("Buscando visitas do supervisor {} para {}/{}", supervisorId, month, year);
        List<VisitDTO> visits = visitService.getVisitsBySupervisorAndMonth(supervisorId, year, month);
        return ResponseEntity.ok(visits);
    }
    
    @PostMapping
    public ResponseEntity<VisitDTO> createVisit(@Valid @RequestBody VisitDTO visitDTO) {
        log.info("Criando nova visita para supervisor {} na unidade {} em {}", 
                visitDTO.getSupervisorId(), visitDTO.getUnitId(), visitDTO.getVisitDate());
        
        VisitDTO createdVisit = visitService.createVisit(visitDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdVisit);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<VisitDTO> updateVisit(@PathVariable UUID id, @Valid @RequestBody VisitDTO visitDTO) {
        log.info("Atualizando visita ID: {}", id);
        VisitDTO updatedVisit = visitService.updateVisit(id, visitDTO);
        return ResponseEntity.ok(updatedVisit);
    }
    
    @PutMapping("/{id}/complete")
    public ResponseEntity<VisitDTO> markVisitAsCompleted(@PathVariable UUID id) {
        log.info("Marcando visita {} como realizada", id);
        VisitDTO completedVisit = visitService.markVisitAsCompleted(id);
        return ResponseEntity.ok(completedVisit);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVisit(@PathVariable UUID id) {
        log.info("Excluindo visita ID: {}", id);
        visitService.deleteVisit(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getVisitStatistics(
            @RequestParam UUID supervisorId,
            @RequestParam int year,
            @RequestParam int month) {
        
        log.info("Buscando estatísticas de visitas para supervisor {} em {}/{}", supervisorId, month, year);
        Map<String, Object> statistics = visitService.getVisitStatistics(supervisorId, year, month);
        return ResponseEntity.ok(statistics);
    }
    
    @GetMapping("/today/{supervisorId}")
    public ResponseEntity<List<VisitDTO>> getTodaysVisits(@PathVariable UUID supervisorId) {
        log.info("Buscando visitas de hoje para supervisor {}", supervisorId);
        List<VisitDTO> todaysVisits = visitService.getTodaysVisits(supervisorId);
        return ResponseEntity.ok(todaysVisits);
    }
    
    @PostMapping("/generate-template")
    public ResponseEntity<List<VisitDTO>> generateMonthlyTemplate(
            @RequestParam UUID supervisorId,
            @RequestParam int year,
            @RequestParam int month) {
        
        log.info("Gerando template de visitas para supervisor {} em {}/{}", supervisorId, month, year);
        List<VisitDTO> template = visitService.generateMonthlyVisitsTemplate(supervisorId, year, month);
        return ResponseEntity.ok(template);
    }
}
