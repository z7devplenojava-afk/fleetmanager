package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleDreDTO;
import com.z7design.fleet_manager.model.ContractRetention;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.MeasurementCut;
import com.z7design.fleet_manager.service.FinancialClosingService;
import com.z7design.fleet_manager.service.VehicleDreService;
import com.z7design.fleet_manager.service.WorkshopCutService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * MÓDULO 7 — Boletim de Medição, Faturamento & Controladoria Financeira.
 * Cortes de oficina (RF-07.1), DRE por placa (RF-07.5) e caução/boleto (RF-07.4).
 */
@RestController
@RequestMapping("/api/financial-closing")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class FinancialClosingController {

    private final WorkshopCutService workshopCutService;
    private final VehicleDreService vehicleDreService;
    private final FinancialClosingService financialClosingService;

    // ══════════════════ RF-07.1 — Cortes de oficina ══════════════════

    @PostMapping("/measurements/{bulletinId}/workshop-cuts")
    public ResponseEntity<List<WorkshopCutService.VehicleCutResult>> applyWorkshopCuts(
            @PathVariable UUID bulletinId) {
        return ResponseEntity.ok(workshopCutService.applyWorkshopCuts(bulletinId));
    }

    @GetMapping("/measurements/{bulletinId}/workshop-cuts")
    public ResponseEntity<List<MeasurementCut>> getWorkshopCuts(@PathVariable UUID bulletinId) {
        return ResponseEntity.ok(workshopCutService.getCuts(bulletinId));
    }

    @PostMapping("/work-orders/{workOrderId}/reserve-cover")
    public ResponseEntity<FleetWorkOrder> registerReserveCover(
            @PathVariable UUID workOrderId,
            @RequestBody Map<String, Object> body) {
        UUID reserveVehicleId = body.get("reserveVehicleId") != null
                ? UUID.fromString(body.get("reserveVehicleId").toString())
                : null;
        Integer responseMinutes = body.get("responseMinutes") != null
                ? Integer.valueOf(body.get("responseMinutes").toString())
                : null;
        return ResponseEntity.ok(workshopCutService.registerReserveCover(workOrderId, reserveVehicleId, responseMinutes));
    }

    // ══════════════════ RF-07.5 — DRE por placa / cliente ══════════════════

    @GetMapping("/dre/vehicles")
    public ResponseEntity<List<VehicleDreDTO>> getFleetDre(
            @RequestParam String referenceMonth) {
        return ResponseEntity.ok(vehicleDreService.getFleetDre(referenceMonth));
    }

    @GetMapping("/dre/clients")
    public ResponseEntity<Map<String, Object>> getDreByClient(@RequestParam String referenceMonth) {
        return ResponseEntity.ok(vehicleDreService.getDreByClient(referenceMonth));
    }

    // ══════════════════ RF-07.4 — Caução & Boleto ══════════════════

    @GetMapping("/retention-ledger/{contractId}")
    public ResponseEntity<Map<String, Object>> getRetentionLedger(@PathVariable UUID contractId) {
        return ResponseEntity.ok(financialClosingService.getRetentionLedger(contractId));
    }

    @PostMapping("/retentions/{retentionId}/release")
    public ResponseEntity<ContractRetention> releaseRetention(
            @PathVariable UUID retentionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate releaseDate) {
        return ResponseEntity.ok(financialClosingService.releaseRetention(retentionId, releaseDate));
    }

    @PostMapping("/receivables/{receivableId}/boleto")
    public ResponseEntity<Object> registerBoleto(
            @PathVariable UUID receivableId,
            @RequestParam(required = false) Integer contractualDays) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(financialClosingService.registerBoleto(receivableId, contractualDays));
    }

    @GetMapping("/receivables/{receivableId}/boleto-pdf")
    public ResponseEntity<byte[]> getBoletoPdf(@PathVariable UUID receivableId) throws Exception {
        byte[] pdf = financialClosingService.generateBoletoPdf(receivableId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "boleto-" + receivableId + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
