package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.VisitScheduleService;

import br.com.fleetmanager.dto.VisitScheduleDTO;
import br.com.fleetmanager.model.VisitSchedule;
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
@RequestMapping("/api/visit-schedules")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Escalas de Visitas", description = "Gerenciamento de escalas de visitas com otimização de rota")
public class VisitScheduleController {
    
    private final VisitScheduleService visitScheduleService;
    
    @PostMapping("/create-optimized")
    @Operation(summary = "Criar escala otimizada", 
               description = "Cria uma nova escala de visitas com otimização automática de rota")
    public ResponseEntity<VisitScheduleDTO> createOptimizedSchedule(
            @RequestParam UUID supervisorId,
            @RequestParam UUID clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate scheduleDate,
            @RequestParam List<UUID> unitIds,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime startTime,
            @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime endTime,
            @RequestParam(required = false) String observations) {
        
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
    public ResponseEntity<VisitSchedule> reoptimizeSchedule(@PathVariable UUID scheduleId) {
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
               description = "Lista escalas de um supervisor em um período específico")
    public ResponseEntity<List<VisitScheduleDTO>> getSchedulesBySupervisor(
            @PathVariable UUID supervisorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Buscando escalas do supervisor {} entre {} e {}", supervisorId, startDate, endDate);
        List<VisitScheduleDTO> schedules = visitScheduleService.getSchedulesBySupervisorAndPeriodDTO(
            supervisorId, startDate, endDate);
        
        return ResponseEntity.ok(schedules);
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Listar escalas por cliente", 
               description = "Lista escalas de um cliente em um período específico")
    public ResponseEntity<List<VisitSchedule>> getSchedulesByClient(
            @PathVariable UUID clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<VisitSchedule> schedules = visitScheduleService.getSchedulesByClientAndPeriod(
            clientId, startDate, endDate);
        
        return ResponseEntity.ok(schedules);
    }
    
    @PostMapping("/{scheduleId}/start")
    @Operation(summary = "Iniciar escala", 
               description = "Marca uma escala como iniciada")
    public ResponseEntity<VisitSchedule> startSchedule(@PathVariable UUID scheduleId) {
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
               description = "Marca uma escala como concluída")
    public ResponseEntity<VisitSchedule> completeSchedule(@PathVariable UUID scheduleId) {
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
            @PathVariable UUID scheduleId,
            @RequestParam String reason) {
        try {
            VisitSchedule schedule = visitScheduleService.cancelSchedule(scheduleId, reason);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("Erro ao cancelar escala", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/efficiency-report/{supervisorId}")
    @Operation(summary = "Relatório de eficiência", 
               description = "Gera relatório de eficiência das escalas de um supervisor")
    public ResponseEntity<Map<String, Object>> getEfficiencyReport(
            @PathVariable UUID supervisorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> report = visitScheduleService.generateEfficiencyReport(
            supervisorId, startDate, endDate);
        
        return ResponseEntity.ok(report);
    }
}
