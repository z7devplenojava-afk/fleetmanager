package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.EmployeeService;
import br.com.fleetmanager.service.HRService;

import br.com.fleetmanager.dto.EmployeeDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@Tag(name = "RH", description = "Endpoints para gestão de recursos humanos")
public class HRController {
    
    private final EmployeeService employeeService;
    private final HRService hrService;
    
    @GetMapping("/employees/probation-expiring")
    @Operation(summary = "Buscar funcionários com experiência vencendo", 
               description = "Retorna funcionários cujo período de experiência vence nos próximos X dias")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesWithExpiringProbation(
            @RequestParam(defaultValue = "7") int days) {
        List<EmployeeDTO> employees = hrService.getEmployeesWithExpiringProbation(days);
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Estatísticas de RH", 
               description = "Retorna estatísticas gerais de recursos humanos")
    public ResponseEntity<Map<String, Object>> getHRStats() {
        Map<String, Object> stats = hrService.getHRStats();
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/employees/active")
    @Operation(summary = "Buscar funcionários ativos", 
               description = "Retorna todos os funcionários com status ativo")
    public ResponseEntity<List<EmployeeDTO>> getActiveEmployees() {
        List<EmployeeDTO> employees = hrService.getActiveEmployees();
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/employees/on-vacation")
    @Operation(summary = "Buscar funcionários de férias", 
               description = "Retorna funcionários que estão de férias")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesOnVacation() {
        List<EmployeeDTO> employees = hrService.getEmployeesOnVacation();
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/employees/on-sick-leave")
    @Operation(summary = "Buscar funcionários de licença médica", 
               description = "Retorna funcionários que estão de licença médica")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesOnSickLeave() {
        List<EmployeeDTO> employees = hrService.getEmployeesOnSickLeave();
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/employees/by-unit/{unitId}")
    @Operation(summary = "Buscar funcionários por unidade", 
               description = "Retorna funcionários de uma unidade específica")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByUnit(@PathVariable String unitId) {
        List<EmployeeDTO> employees = hrService.getEmployeesByUnit(unitId);
        return ResponseEntity.ok(employees);
    }
    
    @GetMapping("/employees/by-position/{positionId}")
    @Operation(summary = "Buscar funcionários por posição", 
               description = "Retorna funcionários de uma posição específica")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesByPosition(@PathVariable String positionId) {
        List<EmployeeDTO> employees = hrService.getEmployeesByPosition(positionId);
        return ResponseEntity.ok(employees);
    }
} 