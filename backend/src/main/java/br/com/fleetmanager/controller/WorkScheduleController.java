package br.com.fleetmanager.controller;

import br.com.fleetmanager.security.OperationalPermission;
import br.com.fleetmanager.security.OperationalPermissionService;
import br.com.fleetmanager.service.WorkScheduleService;

import br.com.fleetmanager.dto.WorkScheduleDTO;
import br.com.fleetmanager.model.Employee;
import br.com.fleetmanager.model.WorkPost;
import br.com.fleetmanager.model.WorkSchedule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operational/schedules")
@RequiredArgsConstructor
@Slf4j
public class WorkScheduleController {
    
    private final WorkScheduleService workScheduleService;
    private final OperationalPermissionService permissionService;
    
    /**
     * Criar nova escala de trabalho
     */
    @PostMapping
    public ResponseEntity<WorkSchedule> createWorkSchedule(@Validated @RequestBody WorkScheduleDTO workScheduleDTO) {
        log.info("POST /api/operational/schedules - Criando nova escala");
        
        try {
            // Verificar permissão específica
            permissionService.requirePermission(OperationalPermission.SCHEDULE_CREATE);
            // Converter DTO para entidade
            WorkSchedule workSchedule = WorkSchedule.builder()
                .scheduleDate(workScheduleDTO.getScheduleDate())
                .shift(WorkSchedule.ShiftType.valueOf(workScheduleDTO.getShift()))
                .status(workScheduleDTO.getStatus() != null ? 
                    WorkSchedule.ScheduleStatus.valueOf(workScheduleDTO.getStatus()) : 
                    WorkSchedule.ScheduleStatus.PENDING)
                .observations(workScheduleDTO.getObservations())
                .build();
            
            // Criar objetos Employee e WorkPost com apenas o ID
            Employee employee = new Employee();
            employee.setId(workScheduleDTO.getEmployeeId());
            workSchedule.setEmployee(employee);
            
            WorkPost location = new WorkPost();
            location.setId(workScheduleDTO.getLocationId());
            workSchedule.setLocation(location);
            
            WorkSchedule createdSchedule = workScheduleService.createWorkSchedule(workSchedule);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdSchedule);
        } catch (Exception e) {
            log.error("Erro ao criar escala: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar escala por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<WorkSchedule> getWorkScheduleById(@PathVariable UUID id) {
        log.info("GET /api/operational/schedules/{} - Buscando escala por ID", id);
        
        try {
            WorkSchedule schedule = workScheduleService.getWorkScheduleById(id);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            log.error("Erro ao buscar escala: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Listar todas as escalas
     */
    @GetMapping
    public ResponseEntity<List<WorkSchedule>> getAllWorkSchedules() {
        log.info("GET /api/operational/schedules - Listando todas as escalas");
        
        try {
            List<WorkSchedule> schedules = workScheduleService.getAllWorkSchedules();
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Erro ao listar escalas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar escalas por funcionário
     */
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<WorkSchedule>> getWorkSchedulesByEmployee(@PathVariable UUID employeeId) {
        log.info("GET /api/operational/schedules/employee/{} - Buscando escalas por funcionário", employeeId);
        
        try {
            List<WorkSchedule> schedules = workScheduleService.getWorkSchedulesByEmployee(employeeId);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Erro ao buscar escalas por funcionário: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar escalas por local de trabalho
     */
    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<WorkSchedule>> getWorkSchedulesByLocation(@PathVariable UUID locationId) {
        log.info("GET /api/operational/schedules/location/{} - Buscando escalas por local", locationId);
        
        try {
            List<WorkSchedule> schedules = workScheduleService.getWorkSchedulesByLocation(locationId);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Erro ao buscar escalas por local: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar escalas por data
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<List<WorkSchedule>> getWorkSchedulesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("GET /api/operational/schedules/date/{} - Buscando escalas por data", date);
        
        try {
            List<WorkSchedule> schedules = workScheduleService.getWorkSchedulesByDate(date);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Erro ao buscar escalas por data: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar escalas por período
     */
    @GetMapping("/period")
    public ResponseEntity<List<WorkSchedule>> getWorkSchedulesByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/operational/schedules/period - Buscando escalas por período: {} a {}", startDate, endDate);
        
        try {
            List<WorkSchedule> schedules = workScheduleService.getWorkSchedulesByPeriod(startDate, endDate);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Erro ao buscar escalas por período: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar escalas por status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<WorkSchedule>> getWorkSchedulesByStatus(@PathVariable String status) {
        log.info("GET /api/operational/schedules/status/{} - Buscando escalas por status", status);
        
        try {
            WorkSchedule.ScheduleStatus scheduleStatus = WorkSchedule.ScheduleStatus.valueOf(status.toUpperCase());
            List<WorkSchedule> schedules = workScheduleService.getWorkSchedulesByStatus(scheduleStatus);
            return ResponseEntity.ok(schedules);
        } catch (IllegalArgumentException e) {
            log.error("Status inválido: {}", status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Erro ao buscar escalas por status: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Buscar escalas pendentes
     */
    @GetMapping("/pending")
    public ResponseEntity<List<WorkSchedule>> getPendingWorkSchedules() {
        log.info("GET /api/operational/schedules/pending - Buscando escalas pendentes");
        
        try {
            List<WorkSchedule> schedules = workScheduleService.getPendingWorkSchedules();
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("Erro ao buscar escalas pendentes: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Atualizar escala existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<WorkSchedule> updateWorkSchedule(@PathVariable UUID id, 
                                                         @RequestBody WorkSchedule workScheduleDetails) {
        log.info("PUT /api/operational/schedules/{} - Atualizando escala", id);
        
        try {
            WorkSchedule updatedSchedule = workScheduleService.updateWorkSchedule(id, workScheduleDetails);
            return ResponseEntity.ok(updatedSchedule);
        } catch (Exception e) {
            log.error("Erro ao atualizar escala: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Confirmar escala
     */
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<WorkSchedule> confirmWorkSchedule(@PathVariable UUID id) {
        log.info("PATCH /api/operational/schedules/{}/confirm - Confirmando escala", id);
        
        try {
            WorkSchedule confirmedSchedule = workScheduleService.confirmWorkSchedule(id);
            return ResponseEntity.ok(confirmedSchedule);
        } catch (Exception e) {
            log.error("Erro ao confirmar escala: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Cancelar escala
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<WorkSchedule> cancelWorkSchedule(@PathVariable UUID id, 
                                                         @RequestParam String reason) {
        log.info("PATCH /api/operational/schedules/{}/cancel - Cancelando escala", id);
        
        try {
            WorkSchedule cancelledSchedule = workScheduleService.cancelWorkSchedule(id, reason);
            return ResponseEntity.ok(cancelledSchedule);
        } catch (Exception e) {
            log.error("Erro ao cancelar escala: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Marcar escala como concluída
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<WorkSchedule> completeWorkSchedule(@PathVariable UUID id) {
        log.info("PATCH /api/operational/schedules/{}/complete - Marcando escala como concluída", id);
        
        try {
            WorkSchedule completedSchedule = workScheduleService.completeWorkSchedule(id);
            return ResponseEntity.ok(completedSchedule);
        } catch (Exception e) {
            log.error("Erro ao marcar escala como concluída: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Deletar escala
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkSchedule(@PathVariable UUID id) {
        log.info("DELETE /api/operational/schedules/{} - Deletando escala", id);
        
        try {
            workScheduleService.deleteWorkSchedule(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao deletar escala: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Contar escalas por funcionário e período
     */
    @GetMapping("/count/employee/{employeeId}")
    public ResponseEntity<Long> countWorkSchedulesByEmployeeAndPeriod(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/operational/schedules/count/employee/{} - Contando escalas por funcionário e período", employeeId);
        
        try {
            long count = workScheduleService.countWorkSchedulesByEmployeeAndPeriod(employeeId, startDate, endDate);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            log.error("Erro ao contar escalas: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Verificar disponibilidade do funcionário
     */
    @GetMapping("/availability/{employeeId}")
    public ResponseEntity<Boolean> isEmployeeAvailable(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("GET /api/operational/schedules/availability/{} - Verificando disponibilidade do funcionário", employeeId);
        
        try {
            boolean isAvailable = workScheduleService.isEmployeeAvailable(employeeId, date);
            return ResponseEntity.ok(isAvailable);
        } catch (Exception e) {
            log.error("Erro ao verificar disponibilidade: {}", e.getMessage(), e);
            throw e;
        }
    }
}
