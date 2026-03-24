package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.TimeRecord;
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

@RestController
@RequestMapping("/api/time-records")
@RequiredArgsConstructor
@Slf4j
public class TimeRecordController {

    private final TimeRecordService timeRecordService;

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
    public ResponseEntity<?> getTodayRecords(@PathVariable UUID employeeId) {
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
            @PathVariable UUID employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
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
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
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
    public ResponseEntity<?> getNextRecordType(@PathVariable UUID employeeId) {
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
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
            @PathVariable UUID recordId,
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
            @PathVariable UUID recordId,
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
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
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
}
