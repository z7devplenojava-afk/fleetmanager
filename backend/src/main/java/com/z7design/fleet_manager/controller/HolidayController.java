package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Holiday;
import com.z7design.fleet_manager.service.HolidayService;
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
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
@Slf4j
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('HOLIDAY_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getAllHolidays() {
        try {
            List<Holiday> holidays = holidayService.findAll();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", holidays
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar feriados: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HOLIDAY_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getHolidayById(@PathVariable UUID id) {
        try {
            Holiday holiday = holidayService.findById(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", holiday
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar feriado: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('HOLIDAY_CREATE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> createHoliday(@RequestBody Holiday holiday) {
        try {
            Holiday created = holidayService.create(holiday);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Feriado criado com sucesso",
                    "data", created
            ));
        } catch (Exception e) {
            log.error("Erro ao criar feriado: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HOLIDAY_UPDATE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> updateHoliday(@PathVariable UUID id, @RequestBody Holiday holiday) {
        try {
            Holiday updated = holidayService.update(id, holiday);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Feriado atualizado com sucesso",
                    "data", updated
            ));
        } catch (Exception e) {
            log.error("Erro ao atualizar feriado: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HOLIDAY_DELETE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deleteHoliday(@PathVariable UUID id) {
        try {
            holidayService.delete(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Feriado deletado com sucesso"
            ));
        } catch (Exception e) {
            log.error("Erro ao deletar feriado: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/date/{date}")
    @PreAuthorize("hasAnyAuthority('HOLIDAY_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getHolidaysByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<Holiday> holidays = holidayService.findByDate(date);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", holidays
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar feriados por data: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/period")
    @PreAuthorize("hasAnyAuthority('HOLIDAY_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getHolidaysByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<Holiday> holidays = holidayService.findByDateBetween(startDate, endDate);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", holidays
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar feriados por perÃ­odo: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/year/{year}")
    @PreAuthorize("hasAnyAuthority('HOLIDAY_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getHolidaysByYear(@PathVariable int year) {
        try {
            List<Holiday> holidays = holidayService.findByYear(year);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", holidays
            ));
        } catch (Exception e) {
            log.error("Erro ao buscar feriados por ano: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/check/{date}")
    @PreAuthorize("hasAnyAuthority('HOLIDAY_READ', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> checkIsHoliday(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String stateCode,
            @RequestParam(required = false) String cityName) {
        try {
            boolean isHoliday;
            if (stateCode != null || cityName != null) {
                isHoliday = holidayService.isHoliday(date, stateCode, cityName);
            } else {
                isHoliday = holidayService.isHoliday(date);
            }
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "date", date,
                    "isHoliday", isHoliday
            ));
        } catch (Exception e) {
            log.error("Erro ao verificar se Ã© feriado: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}






