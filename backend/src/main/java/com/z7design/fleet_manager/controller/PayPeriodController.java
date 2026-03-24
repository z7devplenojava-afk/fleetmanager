package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.PayPeriod;
import com.z7design.fleet_manager.service.PayPeriodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pay-periods")
@RequiredArgsConstructor
@Slf4j
public class PayPeriodController {

    private final PayPeriodService payPeriodService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getAllPeriods(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String type) {
        try {
            List<PayPeriod> periods;
            
            if (year != null) {
                periods = payPeriodService.findByYear(year);
            } else if (type != null) {
                PayPeriod.PeriodType periodType = PayPeriod.PeriodType.valueOf(type.toUpperCase());
                periods = payPeriodService.findByType(periodType);
            } else {
                periods = payPeriodService.findAll();
            }
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", periods
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar perÃ­odos: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getPeriodById(@PathVariable UUID id) {
        try {
            PayPeriod period = payPeriodService.findById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", period
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar perÃ­odo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/monthly/{year}/{month}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getOrCreateMonthlyPeriod(@PathVariable int year, @PathVariable int month) {
        try {
            PayPeriod period = payPeriodService.getOrCreateMonthlyPeriod(year, month);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", period
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar/criar perÃ­odo mensal: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/custom")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> createCustomPeriod(
            @RequestParam String name,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String description) {
        try {
            PayPeriod period = payPeriodService.createCustomPeriod(name, startDate, endDate, description);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "PerÃ­odo customizado criado com sucesso",
                    "data", period
            ));
        } catch (Exception e) {
            log.error("Erro ao criar perÃ­odo customizado: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/biweekly/{year}/{month}/{quinzena}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> createBiweeklyPeriod(
            @PathVariable int year,
            @PathVariable int month,
            @PathVariable int quinzena) {
        try {
            PayPeriod period = payPeriodService.createBiweeklyPeriod(year, month, quinzena);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "PerÃ­odo quinzenal criado com sucesso",
                    "data", period
            ));
        } catch (Exception e) {
            log.error("Erro ao criar perÃ­odo quinzenal: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> createPeriod(@RequestBody PayPeriod period) {
        try {
            PayPeriod created = payPeriodService.create(period);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "PerÃ­odo criado com sucesso",
                    "data", created
            ));
        } catch (Exception e) {
            log.error("Erro ao criar perÃ­odo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> updatePeriod(@PathVariable UUID id, @RequestBody PayPeriod period) {
        try {
            PayPeriod updated = payPeriodService.update(id, period);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "PerÃ­odo atualizado com sucesso",
                    "data", updated
            ));
        } catch (Exception e) {
            log.error("Erro ao atualizar perÃ­odo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> closePeriod(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID closedById) {
        try {
            // Se closedById nÃ£o for fornecido, usar um UUID padrÃ£o ou null
            // (o service pode lidar com isso ou podemos buscar do contexto de seguranÃ§a)
            UUID userId = closedById != null ? closedById : null;
            PayPeriod closed = payPeriodService.closePeriod(id, userId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "PerÃ­odo fechado com sucesso",
                    "data", closed
            ));
        } catch (Exception e) {
            log.error("Erro ao fechar perÃ­odo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_MANAGE') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deletePeriod(@PathVariable UUID id) {
        try {
            payPeriodService.delete(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "PerÃ­odo deletado com sucesso"
            ));
        } catch (Exception e) {
            log.error("Erro ao deletar perÃ­odo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/year/{year}")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getPeriodsByYear(@PathVariable int year) {
        try {
            List<PayPeriod> periods = payPeriodService.findByYear(year);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", periods
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar perÃ­odos por ano: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/open")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getOpenPeriods() {
        try {
            List<PayPeriod> periods = payPeriodService.findOpenPeriods();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", periods
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar perÃ­odos abertos: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/closed")
    @PreAuthorize("hasAnyAuthority('PAYROLL_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getClosedPeriods() {
        try {
            List<PayPeriod> periods = payPeriodService.findClosedPeriods();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", periods
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar perÃ­odos fechados: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}






