package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.LineTimeSlot;
import com.z7design.fleet_manager.model.ScheduleDateOverride;
import com.z7design.fleet_manager.service.LineTimeSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Horarios de partida por linha e tipo de dia (PRD Viasao Sao Silvestre - Fase 1).
 */
@RestController
@RequestMapping("/api/line-time-slots")
@RequiredArgsConstructor
public class LineTimeSlotController {

    private final LineTimeSlotService lineTimeSlotService;

    @GetMapping
    public ResponseEntity<List<LineTimeSlot>> getAll(
            @RequestParam(name = "routeId", required = false) UUID routeId,
            @RequestParam(name = "dayType", required = false) String dayType) {
        try {
            if (routeId != null && dayType != null) {
                return ResponseEntity.ok(lineTimeSlotService.findByRouteAndDayType(routeId, dayType));
            }
            if (routeId != null) {
                return ResponseEntity.ok(lineTimeSlotService.findByRoute(routeId));
            }
            return ResponseEntity.ok(lineTimeSlotService.findAll());
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<LineTimeSlot> getById(@PathVariable("id") UUID id) {
        try {
            return ResponseEntity.ok(lineTimeSlotService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<LineTimeSlot> create(@RequestBody LineTimeSlot slot) {
        return ResponseEntity.ok(lineTimeSlotService.create(slot));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LineTimeSlot> update(@PathVariable("id") UUID id, @RequestBody LineTimeSlot slot) {
        return ResponseEntity.ok(lineTimeSlotService.update(id, slot));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        lineTimeSlotService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Tipo de dia efetivo de uma data (apos excecoes de feriado). */
    @GetMapping("/resolve-day-type")
    public ResponseEntity<Map<String, String>> resolveDayType(
            @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            return ResponseEntity.ok(Map.of(
                    "date", date.toString(),
                    "dayType", lineTimeSlotService.resolveEffectiveDayType(date)));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("date", date.toString(), "dayType", "WEEKDAY"));
        }
    }

    /** Horarios ativos de uma data (apos excecoes), para geracao de escalas. */
    @GetMapping("/active-for-date")
    public ResponseEntity<List<LineTimeSlot>> activeForDate(
            @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            return ResponseEntity.ok(lineTimeSlotService.findActiveSlotsForDate(date));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // ---------------------------------------------------------------
    // Excecoes de calendario (feriado -> horario de domingo)
    // ---------------------------------------------------------------

    @GetMapping("/overrides")
    public ResponseEntity<List<ScheduleDateOverride>> getOverrides() {
        try {
            return ResponseEntity.ok(lineTimeSlotService.findAllOverrides());
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/overrides")
    public ResponseEntity<ScheduleDateOverride> saveOverride(@RequestBody ScheduleDateOverride override) {
        return ResponseEntity.ok(lineTimeSlotService.saveOverride(override));
    }

    @DeleteMapping("/overrides/{id}")
    public ResponseEntity<Void> deleteOverride(@PathVariable("id") UUID id) {
        lineTimeSlotService.deleteOverride(id);
        return ResponseEntity.noContent().build();
    }
}
