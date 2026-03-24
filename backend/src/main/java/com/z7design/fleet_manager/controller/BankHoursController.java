package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.BankHours;
import com.z7design.fleet_manager.model.BankHoursTransaction;
import com.z7design.fleet_manager.service.BankHoursService;
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
@RequestMapping("/api/bank-hours")
@RequiredArgsConstructor
@Slf4j
public class BankHoursController {

    private final BankHoursService bankHoursService;

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('BANK_HOURS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<?> getBankHours(
            @PathVariable UUID employeeId,
            @RequestParam(required = false) UUID contractId) {
        try {
            BankHours bankHours = bankHoursService.getBankHours(employeeId, contractId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", bankHours != null ? bankHours : Map.of("balanceHours", 0, "employeeId", employeeId)
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar banco de horas: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/credit")
    @PreAuthorize("hasAnyAuthority('BANK_HOURS_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> creditHours(
            @RequestBody Map<String, Object> request) {
        try {
            UUID employeeId = UUID.fromString((String) request.get("employeeId"));
            UUID contractId = request.get("contractId") != null ? 
                    UUID.fromString((String) request.get("contractId")) : null;
            BigDecimal hours = new BigDecimal(request.get("hours").toString());
            UUID sourcePayrollClosureId = request.get("sourcePayrollClosureId") != null ?
                    UUID.fromString((String) request.get("sourcePayrollClosureId")) : null;
            String description = (String) request.get("description");
            UUID createdById = request.get("createdById") != null ?
                    UUID.fromString((String) request.get("createdById")) : null;

            BankHoursTransaction transaction = bankHoursService.creditHours(
                    employeeId, contractId, hours, sourcePayrollClosureId, description, createdById);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Horas creditadas com sucesso",
                    "data", transaction
            ));
        } catch (Exception e) {
            log.error("Erro ao creditar horas: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/debit")
    @PreAuthorize("hasAnyAuthority('BANK_HOURS_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> debitHours(
            @RequestBody Map<String, Object> request) {
        try {
            UUID employeeId = UUID.fromString((String) request.get("employeeId"));
            UUID contractId = request.get("contractId") != null ? 
                    UUID.fromString((String) request.get("contractId")) : null;
            BigDecimal hours = new BigDecimal(request.get("hours").toString());
            String sourceTypeStr = (String) request.getOrDefault("sourceType", "COMPENSATION");
            BankHoursTransaction.SourceType sourceType = BankHoursTransaction.SourceType.valueOf(sourceTypeStr);
            String description = (String) request.get("description");
            UUID createdById = request.get("createdById") != null ?
                    UUID.fromString((String) request.get("createdById")) : null;

            BankHoursTransaction transaction = bankHoursService.debitHours(
                    employeeId, contractId, hours, sourceType, description, createdById);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Horas debitadas com sucesso",
                    "data", transaction
            ));
        } catch (Exception e) {
            log.error("Erro ao debitar horas: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyAuthority('BANK_HOURS_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> adjustBalance(
            @RequestBody Map<String, Object> request) {
        try {
            UUID employeeId = UUID.fromString((String) request.get("employeeId"));
            UUID contractId = request.get("contractId") != null ? 
                    UUID.fromString((String) request.get("contractId")) : null;
            BigDecimal hours = new BigDecimal(request.get("hours").toString());
            String typeStr = (String) request.get("type");
            BankHoursTransaction.TransactionType type = BankHoursTransaction.TransactionType.valueOf(typeStr);
            String description = (String) request.get("description");
            UUID createdById = request.get("createdById") != null ?
                    UUID.fromString((String) request.get("createdById")) : null;

            BankHoursTransaction transaction = bankHoursService.adjustBalance(
                    employeeId, contractId, hours, type, description, createdById);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Ajuste realizado com sucesso",
                    "data", transaction
            ));
        } catch (Exception e) {
            log.error("Erro ao ajustar saldo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/employee/{employeeId}/transactions")
    @PreAuthorize("hasAnyAuthority('BANK_HOURS_TRANSACTION_READ', 'BANK_HOURS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<?> getTransactionHistory(@PathVariable UUID employeeId) {
        try {
            List<BankHoursTransaction> transactions = bankHoursService.getTransactionHistory(employeeId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", transactions
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar histÃ³rico: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/expiring")
    @PreAuthorize("hasAnyAuthority('BANK_HOURS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<?> getExpiringBalances(@RequestParam(defaultValue = "30") int daysAhead) {
        try {
            List<BankHours> expiring = bankHoursService.findExpiringBalances(daysAhead);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", expiring,
                    "count", expiring.size()
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar saldos prÃ³ximos ao vencimento: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}






