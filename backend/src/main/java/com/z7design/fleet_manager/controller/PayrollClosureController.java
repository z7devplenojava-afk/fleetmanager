package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.PayrollClosure;
import com.z7design.fleet_manager.service.PayrollClosureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll-closures")
@RequiredArgsConstructor
@Slf4j
public class PayrollClosureController {

    private final PayrollClosureService payrollClosureService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> generateClosure(@RequestBody Map<String, Object> request) {
        try {
            UUID employeeId = UUID.fromString((String) request.get("employeeId"));
            int month = (Integer) request.get("month");
            int year = (Integer) request.get("year");
            UUID closedById = request.get("closedById") != null ? 
                    UUID.fromString((String) request.get("closedById")) : null;

            PayrollClosure closure = payrollClosureService.generateClosure(
                    employeeId, month, year, closedById);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Fechamento gerado com sucesso",
                    "data", closure
            ));

        } catch (Exception e) {
            log.error("Erro ao gerar fechamento: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/generate-for-period")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> generateClosureForPeriod(@RequestBody Map<String, Object> request) {
        try {
            UUID employeeId = UUID.fromString((String) request.get("employeeId"));
            UUID payPeriodId = UUID.fromString((String) request.get("payPeriodId"));
            UUID closedById = request.get("closedById") != null ? 
                    UUID.fromString((String) request.get("closedById")) : null;

            PayrollClosure closure = payrollClosureService.generateClosureForPeriod(
                    employeeId, payPeriodId, closedById);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Fechamento gerado com sucesso",
                    "data", closure
            ));
        } catch (Exception e) {
            log.error("Erro ao gerar fechamento para perÃ­odo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/generate-batch")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> generateBatchClosures(@RequestBody Map<String, Object> request) {
        try {
            int month = (Integer) request.get("month");
            int year = (Integer) request.get("year");
            UUID closedById = request.get("closedById") != null ? 
                    UUID.fromString((String) request.get("closedById")) : null;

            List<PayrollClosure> closures = payrollClosureService.generateBatchClosures(
                    month, year, closedById);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", String.format("%d fechamentos gerados com sucesso", closures.size()),
                    "data", closures,
                    "total", closures.size()
            ));

        } catch (Exception e) {
            log.error("Erro ao gerar fechamentos em lote: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getClosuresByEmployee(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "12") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PayrollClosure> closures = payrollClosureService.getClosuresByEmployee(
                    employeeId, pageable);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", closures.getContent(),
                    "totalPages", closures.getTotalPages(),
                    "totalElements", closures.getTotalElements(),
                    "currentPage", closures.getNumber()
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar fechamentos do funcionÃ¡rio: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getClosures(
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "employeeId", required = false) UUID employeeId) {
        try {
            List<PayrollClosure> closures;
            
            if (month != null && year != null) {
                // Buscar por perÃ­odo
                closures = payrollClosureService.getClosuresByPeriod(month, year);
            } else if (employeeId != null) {
                // Buscar por funcionÃ¡rio (primeira pÃ¡gina)
                Pageable pageable = PageRequest.of(0, 100);
                Page<PayrollClosure> page = payrollClosureService.getClosuresByEmployee(employeeId, pageable);
                closures = page.getContent();
            } else {
                // Retornar lista vazia se nÃ£o houver filtros
                closures = List.of();
            }
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", closures,
                    "total", closures.size()
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar fechamentos: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/period")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getClosuresByPeriod(
            @RequestParam(value = "month") int month,
            @RequestParam(value = "year") int year) {
        try {
            List<PayrollClosure> closures = payrollClosureService.getClosuresByPeriod(month, year);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", closures,
                    "total", closures.size()
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar fechamentos por perÃ­odo: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/{closureId}/close")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> closeClosure(
            @PathVariable("closureId") UUID closureId,
            @RequestBody(required = false) Map<String, String> request) {
        try {
            UUID closedById = (request != null && request.get("closedById") != null) ? 
                    UUID.fromString(request.get("closedById")) : null;
            PayrollClosure closure = payrollClosureService.closeClosure(closureId, closedById);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Fechamento finalizado com sucesso",
                    "data", closure
            ));
        } catch (Exception e) {
            log.error("Erro ao finalizar fechamento: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{closureId}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getClosureById(@PathVariable("closureId") UUID closureId) {
        try {
            PayrollClosure closure = payrollClosureService.getClosureById(closureId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", closure
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar fechamento: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}


