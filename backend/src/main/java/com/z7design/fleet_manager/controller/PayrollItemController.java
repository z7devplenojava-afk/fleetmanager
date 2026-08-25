package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.PayrollItem;
import com.z7design.fleet_manager.service.PayrollItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll-items")
@RequiredArgsConstructor
@Slf4j
public class PayrollItemController {

    private final PayrollItemService payrollItemService;

    @GetMapping("/closure/{payrollClosureId}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE', 'PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getItemsByClosure(@PathVariable("payrollClosureId") UUID payrollClosureId) {
        try {
            List<PayrollItem> items = payrollItemService.getItemsByClosure(payrollClosureId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", items,
                    "count", items.size()
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar itens de folha: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE', 'PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getItemsByEmployee(@PathVariable("employeeId") UUID employeeId) {
        try {
            List<PayrollItem> items = payrollItemService.getItemsByEmployee(employeeId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", items,
                    "count", items.size()
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar itens de folha: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/closure/{payrollClosureId}/summary")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE', 'PAYROLL_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getClosureSummary(@PathVariable("payrollClosureId") UUID payrollClosureId) {
        try {
            BigDecimal totalEarnings = payrollItemService.calculateTotalEarnings(payrollClosureId);
            BigDecimal totalDeductions = payrollItemService.calculateTotalDeductions(payrollClosureId);
            BigDecimal netAmount = totalEarnings.add(totalDeductions); // Deductions jÃ¡ sÃ£o negativos

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "totalEarnings", totalEarnings,
                            "totalDeductions", totalDeductions,
                            "netAmount", netAmount
                    )
            ));
        } catch (Exception e) {
            log.error("Erro ao calcular resumo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/closure/{payrollClosureId}/regenerate")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> regenerateItems(
            @PathVariable("payrollClosureId") UUID payrollClosureId,
            @RequestParam(value = "hourlyRate", required = false) BigDecimal hourlyRate) {
        try {
            // Se nÃ£o fornecido, serÃ¡ calculado no service
            List<PayrollItem> items = payrollItemService.generateItemsFromClosure(
                    payrollClosureId, hourlyRate != null ? hourlyRate : BigDecimal.ZERO);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Itens regenerados com sucesso",
                    "data", items,
                    "count", items.size()
            ));
        } catch (Exception e) {
            log.error("Erro ao regenerar itens: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}






