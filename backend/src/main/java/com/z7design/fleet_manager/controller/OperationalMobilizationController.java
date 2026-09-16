package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.VehicleEligibilityDTO;
import com.z7design.fleet_manager.model.DailyLogBook;
import com.z7design.fleet_manager.model.DailyLogBookEntry;
import com.z7design.fleet_manager.model.MobilizationInspection;
import com.z7design.fleet_manager.model.enums.DailyLogBookStatus;
import com.z7design.fleet_manager.service.DailyLogBookService;
import com.z7design.fleet_manager.service.FleetEligibilityService;
import com.z7design.fleet_manager.service.MobilizationInspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 3: Gestão Operacional, Tráfego & Mobilização.
 * RF-03.1 (elegibilidade), RF-03.3 (vistoria de mobilização) e RF-03.5 (talões).
 */
@RestController
@RequestMapping("/api/operational-mobilization")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Operacional & Mobilização", description = "Elegibilidade de frota, vistorias e talões (PRD Módulo 3)")
public class OperationalMobilizationController {

    private final FleetEligibilityService fleetEligibilityService;
    private final MobilizationInspectionService inspectionService;
    private final DailyLogBookService bookService;

    // ===== RF-03.1: Elegibilidade de frota =====

    @GetMapping("/eligibility/{vehicleId}")
    @Operation(summary = "Verificar elegibilidade do veículo (idade ≤5 anos, ar, cinto, retarder, câmera, telemetria)")
    public ResponseEntity<VehicleEligibilityDTO> checkEligibility(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(fleetEligibilityService.checkVehicleById(vehicleId));
    }

    @GetMapping("/eligibility")
    @Operation(summary = "Filtro de frota elegível (includeIneligible=false retorna só os aprovados)")
    public ResponseEntity<List<VehicleEligibilityDTO>> filterEligibleFleet(
            @RequestParam(defaultValue = "false") boolean includeIneligible) {
        return ResponseEntity.ok(fleetEligibilityService.filterEligibleFleet(includeIneligible));
    }

    // ===== RF-03.3: Vistoria de mobilização =====

    @GetMapping("/inspections")
    @Operation(summary = "Listar vistorias de mobilização")
    public ResponseEntity<List<MobilizationInspection>> listInspections(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) UUID clientId) {
        if (vehicleId != null) {
            return ResponseEntity.ok(inspectionService.findByVehicle(vehicleId));
        }
        if (clientId != null) {
            return ResponseEntity.ok(inspectionService.findByClient(clientId));
        }
        return ResponseEntity.ok(inspectionService.findAll());
    }

    @GetMapping("/inspections/{id}")
    @Operation(summary = "Buscar vistoria por ID")
    public ResponseEntity<MobilizationInspection> getInspection(@PathVariable UUID id) {
        return ResponseEntity.ok(inspectionService.findById(id));
    }

    @PostMapping("/inspections")
    @Operation(summary = "Registrar vistoria de mobilização com checklist")
    public ResponseEntity<MobilizationInspection> createInspection(@RequestBody MobilizationInspection inspection) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inspectionService.create(inspection));
    }

    @PostMapping("/inspections/{id}/approve")
    @Operation(summary = "Aprovar vistoria (exige checklist completo + assinaturas conjuntas)")
    public ResponseEntity<MobilizationInspection> approveInspection(@PathVariable UUID id) {
        return ResponseEntity.ok(inspectionService.approve(id));
    }

    @GetMapping("/inspections/{id}/pdf")
    @Operation(summary = "Baixar Termo de Vistoria e Mobilização em PDF")
    public ResponseEntity<byte[]> inspectionPdf(@PathVariable UUID id) {
        byte[] pdf = inspectionService.generatePdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=vistoria-mobilizacao-" + id + ".pdf")
                .body(pdf);
    }

    @DeleteMapping("/inspections/{id}")
    @Operation(summary = "Excluir vistoria")
    public ResponseEntity<Void> deleteInspection(@PathVariable UUID id) {
        inspectionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ===== RF-03.5: Talões de Parte Diária =====

    @GetMapping("/books")
    @Operation(summary = "Listar talões de Parte Diária")
    public ResponseEntity<List<DailyLogBook>> listBooks(
            @RequestParam(required = false) DailyLogBookStatus status,
            @RequestParam(required = false) UUID vehicleId) {
        if (status != null) {
            return ResponseEntity.ok(bookService.findByStatus(status));
        }
        if (vehicleId != null) {
            return ResponseEntity.ok(bookService.findByVehicle(vehicleId));
        }
        return ResponseEntity.ok(bookService.findAll());
    }

    @GetMapping("/books/{id}")
    @Operation(summary = "Buscar talão por ID")
    public ResponseEntity<DailyLogBook> getBook(@PathVariable UUID id) {
        return ResponseEntity.ok(bookService.findById(id));
    }

    @PostMapping("/books")
    @Operation(summary = "Emitir talão com faixa sequencial")
    public ResponseEntity<DailyLogBook> issueBook(
            @RequestBody DailyLogBook request,
            @RequestParam(defaultValue = "50") int sheetsQuantity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.issueBook(request, sheetsQuantity));
    }

    /** M3 → M5: consome a próxima folha e vincula à Parte Diária. */
    @PostMapping("/books/{id}/consume-sheet")
    @Operation(summary = "Consumir próxima folha do talão e vincular à Parte Diária")
    public ResponseEntity<DailyLogBookEntry> consumeSheet(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID dailyLogId,
            @RequestParam(required = false) String usedBy) {
        return ResponseEntity.ok(bookService.consumeNextSheet(id, dailyLogId, usedBy));
    }

    @GetMapping("/books/{id}/entries")
    @Operation(summary = "Folhas consumidas do talão")
    public ResponseEntity<List<DailyLogBookEntry>> getBookEntries(@PathVariable UUID id) {
        return ResponseEntity.ok(bookService.getBookEntries(id));
    }

    @PatchMapping("/books/{id}/status")
    @Operation(summary = "Atualizar status do talão (extraviado, cancelado...)")
    public ResponseEntity<DailyLogBook> updateBookStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        DailyLogBookStatus status = DailyLogBookStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(bookService.updateStatus(id, status));
    }

    @DeleteMapping("/books/{id}")
    @Operation(summary = "Excluir talão")
    public ResponseEntity<Void> deleteBook(@PathVariable UUID id) {
        bookService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
