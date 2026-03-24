package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.EmployeeDTO;
import com.z7design.fleet_manager.dto.VacationDTO;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.service.EmployeeService;
import com.z7design.fleet_manager.service.HRService;
import com.z7design.fleet_manager.service.VacationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@Tag(name = "RH", description = "Endpoints para gestÃ£o de recursos humanos")
public class HRController {
    
    private final EmployeeService employeeService;
    private final HRService hrService;
    private final VacationService vacationService;
    
    @GetMapping("/employees/probation-expiring")
    @Operation(summary = "Buscar funcionÃ¡rios com experiÃªncia vencendo", 
               description = "Retorna funcionÃ¡rios cujo perÃ­odo de experiÃªncia vence nos prÃ³ximos X dias")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesWithExpiringProbation(
            @RequestParam(defaultValue = "7") int days) {
        List<EmployeeDTO> employees = hrService.getEmployeesWithExpiringProbation(days);
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/stats")
    @Operation(summary = "EstatÃ­sticas de RH", 
               description = "Retorna estatÃ­sticas gerais de recursos humanos")
    public ResponseEntity<Map<String, Object>> getHRStats() {
        Map<String, Object> stats = hrService.getHRStats();
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/employees/active")
    @Operation(summary = "Buscar funcionÃ¡rios ativos", 
               description = "Retorna todos os funcionÃ¡rios com status ativo")
    public ResponseEntity<List<EmployeeDTO>> getActiveEmployees() {
        List<EmployeeDTO> employees = hrService.getActiveEmployees();
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/employees/on-vacation")
    @Operation(summary = "Buscar funcionÃ¡rios de fÃ©rias", 
               description = "Retorna funcionÃ¡rios que estÃ£o de fÃ©rias")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesOnVacation() {
        List<EmployeeDTO> employees = hrService.getEmployeesOnVacation();
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/employees/on-sick-leave")
    @Operation(summary = "Buscar funcionÃ¡rios de licenÃ§a mÃ©dica", 
               description = "Retorna funcionÃ¡rios que estÃ£o de licenÃ§a mÃ©dica")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesOnSickLeave() {
        List<EmployeeDTO> employees = hrService.getEmployeesOnSickLeave();
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/employees/by-unit/{unitId}")
    @Operation(summary = "Buscar funcionÃ¡rios por unidade", 
               description = "Retorna funcionÃ¡rios de uma unidade especÃ­fica")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByUnit(@PathVariable String unitId) {
        List<EmployeeDTO> employees = hrService.getEmployeesByUnit(unitId);
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/employees/by-position/{positionId}")
    @Operation(summary = "Buscar funcionÃ¡rios por posiÃ§Ã£o", 
               description = "Retorna funcionÃ¡rios de uma posiÃ§Ã£o especÃ­fica")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByPosition(@PathVariable String positionId) {
        List<EmployeeDTO> employees = hrService.getEmployeesByPosition(positionId);
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/vacations")
    @Operation(summary = "Buscar fÃ©rias", 
               description = "Retorna lista de fÃ©rias com filtros opcionais (status, employeeId, dateFrom, dateTo)")
    public ResponseEntity<List<VacationDTO>> getVacations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        List<VacationDTO> vacations;
        
        // Se status foi fornecido, filtrar por status
        if (status != null && !status.isEmpty()) {
            // Mapear 'PLANNED' do frontend para 'PENDING' do backend
            VacationStatus vacationStatus = null;
            try {
                if ("PLANNED".equalsIgnoreCase(status)) {
                    vacationStatus = VacationStatus.PENDING;
                } else {
                    vacationStatus = VacationStatus.valueOf(status.toUpperCase());
                }
            } catch (IllegalArgumentException e) {
                // Se status invÃ¡lido, retornar todas as fÃ©rias
                vacationStatus = null;
            }
            
            final VacationStatus finalStatus = vacationStatus;
            if (finalStatus != null) {
                // Filtrar por status usando mÃ©todo otimizado
                vacations = vacationService.findByStatus(finalStatus).stream()
                    .map(VacationDTO::fromEntity)
                    .collect(Collectors.toList());
            } else {
                vacations = vacationService.findAll().stream()
                    .map(VacationDTO::fromEntity)
                    .collect(Collectors.toList());
            }
        } else {
            // Retornar todas as fÃ©rias
            vacations = vacationService.findAll().stream()
                .map(VacationDTO::fromEntity)
                .collect(Collectors.toList());
        }
        
        // TODO: Implementar filtros adicionais (employeeId, dateFrom, dateTo) se necessÃ¡rio
        
        return ResponseEntity.ok(vacations);
    }
} 
