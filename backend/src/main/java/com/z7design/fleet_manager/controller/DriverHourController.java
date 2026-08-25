package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.DriverWorkHour;
import com.z7design.fleet_manager.service.DriverHourService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/hr/driver-hours")
@RequiredArgsConstructor
public class DriverHourController {

    private final DriverHourService driverHourService;

    @PostMapping
    public ResponseEntity<DriverWorkHour> saveJornada(@RequestBody DriverWorkHour workHour) {
        return ResponseEntity.ok(driverHourService.saveJornada(workHour));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverWorkHour> getJornada(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(driverHourService.getJornada(id));
    }

    @GetMapping("/by-period")
    public ResponseEntity<java.util.List<DriverWorkHour>> getJornadaByPeriod(
            @RequestParam(value = "DATE") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate start,
            @RequestParam(value = "DATE") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate end) {
        return ResponseEntity.ok(driverHourService.findByPeriod(start, end));
    }

    @GetMapping("/{id}/memory")
    public ResponseEntity<com.z7design.fleet_manager.model.DriverHourCalculationMemory> getCalculationMemory(
            @PathVariable("id") UUID id) {
        return ResponseEntity.ok(driverHourService.getCalculationMemory(id));
    }
}
