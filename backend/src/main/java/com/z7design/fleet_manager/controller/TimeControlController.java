package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateTimeRecordRequest;
import com.z7design.fleet_manager.dto.TimeRecordResponse;
import com.z7design.fleet_manager.model.TimeRecord;
import com.z7design.fleet_manager.service.TimeRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/time-control")
@RequiredArgsConstructor
public class TimeControlController {

    private final TimeRecordService timeRecordService;

    /**
     * Endpoint básico para registro de ponto
     * POST /api/time-control/records
     */
    @PostMapping("/records")
    public ResponseEntity<TimeRecordResponse> createTimeRecord(
            @Valid @RequestBody CreateTimeRecordRequest request) {

        log.info("Creating time record for employee: {}", request.getEmployeeId());

        try {
            // Usando o serviço existente
            TimeRecord record = timeRecordService.registerTimeRecord(
                    request.getEmployeeId(),
                    TimeRecord.RecordType.valueOf(request.getType()),
                    null, // qrCode não usado nesse endpoint básico
                    null, // location
                    request.getLatitude(),
                    request.getLongitude(),
                    null, // ipAddress
                    request.getDeviceInfo());

            TimeRecordResponse response = mapToResponse(record);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error creating time record: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/time-control/records/{employeeId}/today
     * Busca registros de hoje de um funcionário
     */
    @GetMapping("/records/{employeeId}/today")
    public ResponseEntity<List<TimeRecordResponse>> getTodayRecords(
            @PathVariable("employeeId") UUID employeeId) {

        log.info("Fetching today records for employee: {}", employeeId);

        List<TimeRecord> records = timeRecordService.getTodayRecords(employeeId);
        List<TimeRecordResponse> response = records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/time-control/records/{employeeId}/date/{date}
     * Busca registros de uma data específica
     */
    @GetMapping("/records/{employeeId}/date/{date}")
    public ResponseEntity<List<TimeRecordResponse>> getRecordsByDate(
            @PathVariable("employeeId") UUID employeeId,
            @PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        log.info("Fetching records for employee: {} on date: {}", employeeId, date);

        List<TimeRecord> records = timeRecordService.getRecordsByPeriod(employeeId, date, date);
        List<TimeRecordResponse> response = records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/time-control/records/{employeeId}/next-type
     * Retorna o próximo tipo de registro esperado
     */
    @GetMapping("/records/{employeeId}/next-type")
    public ResponseEntity<String> getNextRecordType(@PathVariable("employeeId") UUID employeeId) {
        TimeRecord.RecordType nextType = timeRecordService.getNextRecordType(employeeId);
        return ResponseEntity.ok(nextType.name());
    }

    /**
     * Mapeia TimeRecord para TimeRecordResponse
     */
    private TimeRecordResponse mapToResponse(TimeRecord record) {
        return TimeRecordResponse.builder()
                .id(record.getId())
                .employeeId(record.getEmployee().getId())
                .employeeName(record.getEmployee().getName())
                .recordedAt(record.getRecordedAt())
                .type(record.getRecordType().name())
                .origin(record.getOrigin())
                .latitude(record.getLatitude())
                .longitude(record.getLongitude())
                .deviceInfo(record.getDeviceInfo())
                .isManual(record.getIsManual())
                .build();
    }
}
