package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleTcoDTO;
import com.z7design.fleet_manager.service.OdometerService;
import com.z7design.fleet_manager.service.TcoReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 6: Painel de Decisão de Substituição do Ativo (TCO)
 * e integração hodômetro ↔ Parte Diária.
 */
@RestController
@RequestMapping("/api/tco")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "TCO da Frota", description = "Painel de decisão de substituição por placa (PRD Módulo 6)")
public class TcoReportController {

    private final TcoReportService tcoReportService;
    private final OdometerService odometerService;

    @GetMapping
    @Operation(summary = "Painel TCO do mês corrente (frota inteira)")
    public ResponseEntity<List<VehicleTcoDTO>> getCurrentMonthFleetTco() {
        return ResponseEntity.ok(tcoReportService.getCurrentMonthFleetTco());
    }

    @GetMapping("/period")
    @Operation(summary = "Painel TCO por período e placa opcional")
    public ResponseEntity<List<VehicleTcoDTO>> getFleetTco(
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(tcoReportService.getFleetTco(plate, start, end));
    }

    /**
     * Rotina de consistência: recalcula hodômetros a partir das Partes Diárias
     * e dispara gatilhos de PMP para toda a frota.
     */
    @PostMapping("/odometer/recalculate")
    @Operation(summary = "Recalcular hodômetros a partir das Partes Diárias (M5→M6)")
    public ResponseEntity<Map<String, Integer>> recalculateOdometers() {
        int updated = odometerService.recalculateAllOdometers();
        return ResponseEntity.ok(Map.of("vehiclesUpdated", updated));
    }

    /**
     * Seed dos planos padrão do PRD (10k/20k/40k/80k km) para um veículo.
     */
    @PostMapping("/odometer/vehicle/{vehicleId}/seed-prd-plans")
    @Operation(summary = "Semear planos padrão de PMP do PRD (RF-06.1)")
    public ResponseEntity<Map<String, Integer>> seedPrdPlans(
            @PathVariable UUID vehicleId,
            @RequestBody(required = false) Map<String, Integer> body) {
        int lastKm = (body != null && body.get("lastExecutionKm") != null) ? body.get("lastExecutionKm") : 0;
        int created = odometerService.seedDefaultPrdPlans(vehicleId, lastKm);
        return ResponseEntity.ok(Map.of("plansCreated", created));
    }
}
