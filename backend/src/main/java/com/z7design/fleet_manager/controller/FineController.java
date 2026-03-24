package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FineDTO;
import com.z7design.fleet_manager.model.Fine;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fines")
@RequiredArgsConstructor
public class FineController {
    
    private final FineService fineService;
    private final DriverRepository driverRepository;
    
    @GetMapping
    public ResponseEntity<List<FineDTO>> getAllFines() {
        try {
            return ResponseEntity.ok(fineService.getAllFines());
        } catch (Exception e) {
            // Evitar 500 para o frontend
            return ResponseEntity.ok(java.util.List.of());
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<FineDTO> getFineById(@PathVariable UUID id) {
        return ResponseEntity.ok(fineService.getFineById(id));
    }
    
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<FineDTO>> getFinesByVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(fineService.getFinesByVehicle(vehicleId));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<FineDTO>> getFinesByStatus(@PathVariable Fine.FineStatus status) {
        return ResponseEntity.ok(fineService.getFinesByStatus(status));
    }
    
    @GetMapping("/vehicle/{vehicleId}/status/{status}")
    public ResponseEntity<List<FineDTO>> getFinesByVehicleAndStatus(
            @PathVariable UUID vehicleId,
            @PathVariable Fine.FineStatus status) {
        return ResponseEntity.ok(fineService.getFinesByVehicleAndStatus(vehicleId, status));
    }
    
    @PostMapping
    public ResponseEntity<FineDTO> createFine(@Valid @RequestBody FineDTO fineDTO) {
        return ResponseEntity.ok(fineService.createFine(fineDTO));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<FineDTO> updateFine(@PathVariable UUID id, @Valid @RequestBody FineDTO fineDTO) {
        return ResponseEntity.ok(fineService.updateFine(id, fineDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFine(@PathVariable UUID id) {
        fineService.deleteFine(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getDrivers() {
        List<Driver> drivers = driverRepository.findAll();
        return ResponseEntity.ok(drivers);
    }
    
    // ===== RELATÃ“RIOS =====
    
    @GetMapping("/report/pdf")
    public ResponseEntity<byte[]> generatePDFReport(
            @RequestParam(required = false) String vehiclePlate,
            @RequestParam(required = false) String driverName,
            @RequestParam(required = false) String infraction,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateEnd,
            @RequestParam(required = false) BigDecimal minValue,
            @RequestParam(required = false) BigDecimal maxValue,
            @RequestParam(required = false) String status) {
        try {
            Fine.FineStatus statusEnum = null;
            if (status != null && !status.isEmpty() && !"all".equals(status)) {
                try {
                    statusEnum = Fine.FineStatus.valueOf(status);
                } catch (IllegalArgumentException e) {
                    // Status invÃ¡lido, ignorar
                }
            }

            byte[] pdfBytes = fineService.generatePDFReport(vehiclePlate, driverName, infraction,
                    startDate, endDate, dueDateStart, dueDateEnd, minValue, maxValue, statusEnum);
            String fileName = "relatorio-multas-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".pdf";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/reports/pdf")
    public ResponseEntity<List<Object>> generateFineReportPDF(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String vehicleFilter,
            @RequestParam(required = false) String driverFilter,
            @RequestParam(required = false) String statusFilter,
            @RequestParam(required = false) BigDecimal amountMin,
            @RequestParam(required = false) BigDecimal amountMax,
            @RequestParam(required = false) List<String> selectedIds) {
        try {
            List<Object> fines = fineService.getFinesForReportSimple(startDate, endDate, vehicleFilter, driverFilter, statusFilter, amountMin, amountMax, selectedIds);
            return ResponseEntity.ok(fines);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/reports/excel")
    public ResponseEntity<byte[]> generateFineReportExcel(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String vehicleFilter,
            @RequestParam(required = false) String driverFilter,
            @RequestParam(required = false) String statusFilter,
            @RequestParam(required = false) BigDecimal amountMin,
            @RequestParam(required = false) BigDecimal amountMax,
            @RequestParam(required = false) List<String> selectedIds) {
        try {
            byte[] reportBytes = fineService.generateFineReportExcel(startDate, endDate, vehicleFilter, driverFilter, statusFilter, amountMin, amountMax, selectedIds);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "relatorio_multas.xlsx");
            headers.setContentLength(reportBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(reportBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
