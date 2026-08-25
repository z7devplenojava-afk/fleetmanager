package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.TimeRecord;
import com.z7design.fleet_manager.service.TimeRecordReportService;
import com.z7design.fleet_manager.service.TimeRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/time-records")
@RequiredArgsConstructor
@Slf4j
public class TimeRecordController {

    private final TimeRecordService timeRecordService;
    private final TimeRecordReportService timeRecordReportService;

    @PostMapping("/register")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_CREATE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> registerTimeRecord(@RequestBody Map<String, Object> request) {
        try {
            UUID employeeId = UUID.fromString((String) request.get("employeeId"));
            TimeRecord.RecordType recordType = TimeRecord.RecordType.valueOf(
                    (String) request.get("recordType"));
            String qrCode = (String) request.get("qrCode");
            String location = (String) request.get("location");
            Double latitude = request.get("latitude") != null
                    ? Double.valueOf(request.get("latitude").toString())
                    : null;
            Double longitude = request.get("longitude") != null
                    ? Double.valueOf(request.get("longitude").toString())
                    : null;
            String ipAddress = (String) request.get("ipAddress");
            String userAgent = (String) request.get("userAgent");

            TimeRecord record = timeRecordService.registerTimeRecord(
                    employeeId, recordType, qrCode, location, latitude, longitude,
                    ipAddress, userAgent);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Ponto registrado com sucesso",
                    "data", record));

        } catch (Exception e) {
            log.error("Erro ao registrar ponto: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/today/{employeeId}")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getTodayRecords(@PathVariable("employeeId") UUID employeeId) {
        try {
            List<TimeRecord> records = timeRecordService.getTodayRecords(employeeId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", records));
        } catch (Exception e) {
            log.error("Erro ao buscar registros do dia: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getEmployeeRecords(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<TimeRecord> records = timeRecordService.getRecordsByEmployee(employeeId, pageable);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", records.getContent(),
                    "totalPages", records.getTotalPages(),
                    "totalElements", records.getTotalElements(),
                    "currentPage", records.getNumber()));
        } catch (Exception e) {
            log.error("Erro ao buscar registros do funcionÃ¡rio: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/period/{employeeId}")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getRecordsByPeriod(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<TimeRecord> records = timeRecordService.getRecordsByPeriod(
                    employeeId, startDate, endDate);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", records));
        } catch (Exception e) {
            log.error("Erro ao buscar registros por perÃ­odo: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/next-record-type/{employeeId}")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getNextRecordType(@PathVariable("employeeId") UUID employeeId) {
        try {
            TimeRecord.RecordType nextType = timeRecordService.getNextRecordType(employeeId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "nextRecordType", nextType.name()));
        } catch (Exception e) {
            log.error("Erro ao buscar prÃ³ximo tipo de registro: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getPendingRecords(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<TimeRecord> records = timeRecordService.getPendingRecords(pageable);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", records.getContent(),
                    "totalPages", records.getTotalPages(),
                    "totalElements", records.getTotalElements()));
        } catch (Exception e) {
            log.error("Erro ao buscar registros pendentes: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @PutMapping("/{recordId}/approve")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> approveRecord(
            @PathVariable("recordId") UUID recordId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            UUID approverId = UUID.fromString(request.get("approverId"));
            TimeRecord record = timeRecordService.approveRecord(recordId, approverId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Registro aprovado com sucesso",
                    "data", record));
        } catch (Exception e) {
            log.error("Erro ao aprovar registro: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @PutMapping("/{recordId}/reject")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> rejectRecord(
            @PathVariable("recordId") UUID recordId,
            @RequestBody Map<String, String> request) {
        try {
            UUID approverId = UUID.fromString(request.get("approverId"));
            String reason = request.get("reason");
            TimeRecord record = timeRecordService.rejectRecord(recordId, approverId, reason);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Registro rejeitado com sucesso",
                    "data", record));
        } catch (Exception e) {
            log.error("Erro ao rejeitar registro: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    @GetMapping("/report/{employeeId}")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_READ', 'ROLE_MOTORISTA', 'ROLE_MECANICO', 'ROLE_PORTARIA', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getWorkedHoursReport(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", timeRecordService.getWorkedHoursReport(employeeId, startDate, endDate)));
        } catch (Exception e) {
            log.error("Erro ao gerar relatório de horas: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    // ==================== ADMIN / MANAGEMENT ENDPOINTS ====================

    @GetMapping("/admin/consolidated/report/pdf")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportConsolidatedPdf(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            byte[] pdfBytes = timeRecordReportService.generateConsolidatedPdf(startDate, endDate);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment",
                    String.format("relatorio-consolidado-ponto-%s-%s.pdf", startDate, endDate));

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erro ao exportar PDF consolidado: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/admin/consolidated/report/excel")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportConsolidatedExcel(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            byte[] excelBytes = timeRecordReportService.generateConsolidatedExcel(startDate, endDate);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment",
                    String.format("relatorio-consolidado-ponto-%s-%s.xlsx", startDate, endDate));

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
        } catch (Exception e) {
            log.error("Erro ao exportar Excel consolidado: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/admin/consolidated")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> getConsolidatedIndicators(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            Map<String, Object> indicators = timeRecordService.getConsolidatedIndicators(startDate, endDate);
            return ResponseEntity.ok(Map.of("success", true, "data", indicators));
        } catch (Exception e) {
            log.error("Erro ao buscar indicadores consolidados: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/admin/indicators")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getIndicators(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "department", required = false) String department) {
        try {
            Map<String, Object> indicators = timeRecordService.getIndicators(startDate, endDate, department);
            return ResponseEntity.ok(Map.of("success", true, "data", indicators));
        } catch (Exception e) {
            log.error("Erro ao buscar indicadores: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getAdminDashboard() {
        try {
            Map<String, Object> stats = timeRecordService.getDashboardStats();
            return ResponseEntity.ok(Map.of("success", true, "data", stats));
        } catch (Exception e) {
            log.error("Erro ao buscar dashboard admin: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/admin/records")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getAdminRecords(
            @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "department", required = false) String department) {
        try {
            TimeRecord.RecordStatus recordStatus = status != null ? TimeRecord.RecordStatus.valueOf(status.toUpperCase()) : null;
            List<TimeRecord> records = timeRecordService.getAdminRecords(
                    employeeId, startDate, endDate, recordStatus, department);
            return ResponseEntity.ok(Map.of("success", true, "data", records));
        } catch (Exception e) {
            log.error("Erro ao buscar registros admin: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/admin/batch-approve")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> batchApproveRecords(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            @SuppressWarnings("unchecked")
            List<String> recordIdStrings = (List<String>) request.get("recordIds");
            List<UUID> recordIds = recordIdStrings.stream().map(UUID::fromString).toList();
            UUID approverId = UUID.fromString((String) request.get("approverId"));

            List<TimeRecord> records = timeRecordService.batchApproveRecords(recordIds, approverId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", records.size() + " registro(s) aprovado(s)",
                    "data", records));
        } catch (Exception e) {
            log.error("Erro ao aprovar registros em lote: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/admin/batch-reject")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_MANAGE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> batchRejectRecords(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> recordIdStrings = (List<String>) request.get("recordIds");
            List<UUID> recordIds = recordIdStrings.stream().map(UUID::fromString).toList();
            UUID approverId = UUID.fromString((String) request.get("approverId"));
            String reason = (String) request.getOrDefault("reason", "Rejeitado em lote");

            List<TimeRecord> records = timeRecordService.batchRejectRecords(recordIds, approverId, reason);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", records.size() + " registro(s) rejeitado(s)",
                    "data", records));
        } catch (Exception e) {
            log.error("Erro ao rejeitar registros em lote: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{recordId}/justify")
    @PreAuthorize("hasAnyAuthority('TIME_RECORD_CREATE', 'TIME_RECORD_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> submitJustification(
            @PathVariable("recordId") UUID recordId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String justification = request.get("justification");
            UUID employeeId = UUID.fromString(request.get("employeeId"));

            TimeRecord record = timeRecordService.submitJustification(recordId, justification, employeeId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Justificativa enviada com sucesso",
                    "data", record));
        } catch (Exception e) {
            log.error("Erro ao enviar justificativa: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
