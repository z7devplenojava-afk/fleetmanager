package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VisitScheduleDTO;
import com.z7design.fleet_manager.model.VisitSchedule;
import com.z7design.fleet_manager.service.VisitScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "feature.visitSchedule.enabled", havingValue = "true", matchIfMissing = false)
@RequestMapping("/api/visit-schedules")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Escalas de Visitas", description = "Gerenciamento de escalas de visitas com otimizaÃ§Ã£o de rota")
public class VisitScheduleController {
    
    private final VisitScheduleService visitScheduleService;
    
    @PostMapping("/create-optimized")
    @Operation(summary = "Criar escala otimizada", 
               description = "Cria uma nova escala de visitas com otimizaÃ§Ã£o automÃ¡tica de rota")
    public ResponseEntity<VisitScheduleDTO> createOptimizedSchedule(
            @RequestParam(value = "supervisorId") UUID supervisorId,
            @RequestParam(value = "clientId") UUID clientId,
            @RequestParam(value = "scheduleDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate scheduleDate,
            @RequestParam(value = "unitIds") List<UUID> unitIds,
            @RequestParam(value = "startTime") @DateTimeFormat(pattern = "HH:mm") LocalTime startTime,
            @RequestParam(value = "endTime") @DateTimeFormat(pattern = "HH:mm") LocalTime endTime,
            @RequestParam(value = "observations", required = false) String observations) {
        
        try {
            log.info("Criando escala otimizada - Supervisor: {}, Cliente: {}, Data: {}, Unidades: {}", 
                    supervisorId, clientId, scheduleDate, unitIds.size());
            
            VisitScheduleDTO schedule = visitScheduleService.createOptimizedScheduleDTO(
                supervisorId, clientId, scheduleDate, unitIds, startTime, endTime, observations);
            
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("Erro ao criar escala otimizada", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{scheduleId}/reoptimize")
    @Operation(summary = "Re-otimizar escala", 
               description = "Re-otimiza uma escala existente recalculando a melhor rota")
    public ResponseEntity<VisitSchedule> reoptimizeSchedule(@PathVariable("scheduleId") UUID scheduleId) {
        try {
            VisitSchedule schedule = visitScheduleService.reoptimizeSchedule(scheduleId);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("Erro ao re-otimizar escala", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/supervisor/{supervisorId}")
    @Operation(summary = "Listar escalas por supervisor", 
               description = "Lista escalas de um supervisor em um perÃ­odo especÃ­fico")
    public ResponseEntity<List<VisitScheduleDTO>> getSchedulesBySupervisor(
            @PathVariable("supervisorId") UUID supervisorId,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Buscando escalas do supervisor {} entre {} e {}", supervisorId, startDate, endDate);
        List<VisitScheduleDTO> schedules = visitScheduleService.getSchedulesBySupervisorAndPeriodDTO(
            supervisorId, startDate, endDate);
        
        return ResponseEntity.ok(schedules);
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Listar escalas por cliente", 
               description = "Lista escalas de um cliente em um perÃ­odo especÃ­fico")
    public ResponseEntity<List<VisitSchedule>> getSchedulesByClient(
            @PathVariable("clientId") UUID clientId,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<VisitSchedule> schedules = visitScheduleService.getSchedulesByClientAndPeriod(
            clientId, startDate, endDate);
        
        return ResponseEntity.ok(schedules);
    }
    
    @PostMapping("/{scheduleId}/start")
    @Operation(summary = "Iniciar escala", 
               description = "Marca uma escala como iniciada")
    public ResponseEntity<VisitSchedule> startSchedule(@PathVariable("scheduleId") UUID scheduleId) {
        try {
            VisitSchedule schedule = visitScheduleService.startSchedule(scheduleId);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("Erro ao iniciar escala", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{scheduleId}/complete")
    @Operation(summary = "Completar escala", 
               description = "Marca uma escala como concluÃ­da")
    public ResponseEntity<VisitSchedule> completeSchedule(@PathVariable("scheduleId") UUID scheduleId) {
        try {
            VisitSchedule schedule = visitScheduleService.completeSchedule(scheduleId);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("Erro ao completar escala", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{scheduleId}/cancel")
    @Operation(summary = "Cancelar escala", 
               description = "Cancela uma escala com motivo")
    public ResponseEntity<VisitSchedule> cancelSchedule(
            @PathVariable("scheduleId") UUID scheduleId,
            @RequestParam(value = "reason") String reason) {
        try {
            VisitSchedule schedule = visitScheduleService.cancelSchedule(scheduleId, reason);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("Erro ao cancelar escala", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/efficiency-report/{supervisorId}")
    @Operation(summary = "RelatÃ³rio de eficiÃªncia", 
               description = "Gera relatÃ³rio de eficiÃªncia das escalas de um supervisor")
    public ResponseEntity<Map<String, Object>> getEfficiencyReport(
            @PathVariable("supervisorId") UUID supervisorId,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> report = visitScheduleService.generateEfficiencyReport(
            supervisorId, startDate, endDate);
        
        return ResponseEntity.ok(report);
    }
}

