package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.DailyLog;
import com.z7design.fleet_manager.service.DailyLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/daily-logs")
@RequiredArgsConstructor
public class DailyLogController {

    private final DailyLogService service;

    @GetMapping
    public List<DailyLog> getAll() {
        return service.findAll();
    }

    @GetMapping("/range")
    public List<DailyLog> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return service.findByDateRange(start, end);
    }

    @GetMapping("/{id}")
    public DailyLog getById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    public DailyLog create(@RequestBody DailyLog dailyLog) {
        return service.save(dailyLog);
    }

    @PutMapping("/{id}")
    public DailyLog update(@PathVariable UUID id, @RequestBody DailyLog dailyLog) {
        return service.update(id, dailyLog);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
