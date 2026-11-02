package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.DriverMonthlyClosingDTO;
import com.z7design.fleet_manager.dto.DriverWorkHourDTO;
import com.z7design.fleet_manager.model.DriverHourCalculationMemory;
import com.z7design.fleet_manager.service.DriverHourService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr/driver-hours")
@RequiredArgsConstructor
public class DriverHourController {

    private final DriverHourService driverHourService;

    @PostMapping
    public ResponseEntity<DriverWorkHourDTO> saveJornada(@RequestBody DriverWorkHourDTO dto) {
        return ResponseEntity.ok(driverHourService.saveJornada(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverWorkHourDTO> getJornada(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(driverHourService.getJornada(id));
    }

    @GetMapping("/by-period")
    public ResponseEntity<List<DriverWorkHourDTO>> getJornadaByPeriod(
            @RequestParam(value = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        if (start == null) start = LocalDate.now().withDayOfMonth(1);
        if (end == null) end = LocalDate.now();
        return ResponseEntity.ok(driverHourService.findByPeriod(start, end));
    }

    @PostMapping("/sync")
    public ResponseEntity<List<DriverWorkHourDTO>> syncJornadas(
            @RequestParam(value = "start", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(value = "end", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(driverHourService.syncJornadasFromRecords(start, end));
    }

    @GetMapping("/{id}/memory")
    public ResponseEntity<DriverHourCalculationMemory> getCalculationMemory(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(driverHourService.getCalculationMemory(id));
    }

    @GetMapping("/monthly-summary")
    public ResponseEntity<List<DriverMonthlyClosingDTO>> getMonthlySummary(
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            @RequestParam(value = "employeeId", required = false) UUID employeeId) {
        return ResponseEntity.ok(driverHourService.getMonthlyClosing(year, month, employeeId));
    }

    @PostMapping("/close-month")
    public ResponseEntity<Map<String, String>> closeMonth(
            @RequestParam("year") int year,
            @RequestParam("month") int month,
            @RequestParam(value = "employeeId", required = false) UUID employeeId) {
        driverHourService.closeMonth(year, month, employeeId);
        return ResponseEntity.ok(Map.of("message", "Fechamento mensal realizado com sucesso"));
    }
}
