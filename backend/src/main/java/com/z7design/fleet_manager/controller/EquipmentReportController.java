package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.EquipmentReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment-reports")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class EquipmentReportController {

    private final EquipmentReportService equipmentReportService;

    @GetMapping("/equipment-by-employee")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<Map<String, Object>>> getEquipmentByEmployeeReport(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "equipmentType", required = false) String equipmentType) {
        try {
            log.info("Gerando relatÃ³rio de equipamentos por funcionÃ¡rio");
            List<Map<String, Object>> report = equipmentReportService.generateEquipmentByEmployeeReport(
                    startDate, endDate, status, equipmentType);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de equipamentos por funcionÃ¡rio", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/weapon-validity")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<Map<String, Object>>> getWeaponValidityReport(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            log.info("Gerando relatÃ³rio de validade de armas");
            List<Map<String, Object>> report = equipmentReportService.generateWeaponValidityReport(startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de validade de armas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/usage-report")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<Map<String, Object>>> getUsageReport(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            log.info("Gerando relatÃ³rio de uso de equipamentos");
            List<Map<String, Object>> report = equipmentReportService.generateUsageReport(startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de uso de equipamentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/expiration-report")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<Map<String, Object>>> getExpirationReport(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            log.info("Gerando relatÃ³rio de vencimento de equipamentos");
            List<Map<String, Object>> report = equipmentReportService.generateExpirationReport(startDate, endDate);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de vencimento de equipamentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/general-report")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<List<Map<String, Object>>> getGeneralReport(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "equipmentType", required = false) String equipmentType) {
        try {
            log.info("Gerando relatÃ³rio geral de equipamentos");
            List<Map<String, Object>> report = equipmentReportService.generateGeneralReport(
                    startDate, endDate, status, equipmentType);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio geral de equipamentos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/export/pdf")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<byte[]> exportToPdf(@RequestBody Map<String, Object> requestBody) {
        try {
            String reportType = (String) requestBody.get("reportType");
            String startDateStr = (String) requestBody.get("startDate");
            String endDateStr = (String) requestBody.get("endDate");
            String status = (String) requestBody.get("status");
            String equipmentType = (String) requestBody.get("equipmentType");
            
            log.info("Exportando relatÃ³rio para PDF: {}", reportType);
            
            // Criar DTO simples inline
            var reportRequest = new Object() {
                public String getReportType() { return reportType; }
                public LocalDate getStartDate() { 
                    return startDateStr != null ? LocalDate.parse(startDateStr) : null; 
                }
                public LocalDate getEndDate() { 
                    return endDateStr != null ? LocalDate.parse(endDateStr) : null; 
                }
                public String getStatus() { return status; }
                public String getEquipmentType() { return equipmentType; }
            };
            
            byte[] pdfBytes = equipmentReportService.exportToPdf(reportRequest);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                "equipment_report_" + reportType + "_" + LocalDate.now() + ".pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            log.error("Erro ao exportar relatÃ³rio para PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/export/excel")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<byte[]> exportToExcel(@RequestBody Map<String, Object> requestBody) {
        try {
            String reportType = (String) requestBody.get("reportType");
            String startDateStr = (String) requestBody.get("startDate");
            String endDateStr = (String) requestBody.get("endDate");
            String status = (String) requestBody.get("status");
            String equipmentType = (String) requestBody.get("equipmentType");

            log.info("Exportando relatÃ³rio para Excel: {}", reportType);

            // Criar DTO simples inline
            var reportRequest = new Object() {
                public String getReportType() { return reportType; }
                public LocalDate getStartDate() { 
                    return startDateStr != null ? LocalDate.parse(startDateStr) : null; 
                }
                public LocalDate getEndDate() { 
                    return endDateStr != null ? LocalDate.parse(endDateStr) : null; 
                }
                public String getStatus() { return status; }
                public String getEquipmentType() { return equipmentType; }
            };

            byte[] excelBytes = equipmentReportService.exportToExcel(reportRequest);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", 
                "equipment_report_" + reportType + "_" + LocalDate.now() + ".xlsx");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
        } catch (Exception e) {
            log.error("Erro ao exportar relatÃ³rio para Excel", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/export/csv")
    @PreAuthorize("hasAnyAuthority('EQUIPMENTS_READ', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    public ResponseEntity<byte[]> exportToCsv(@RequestBody Map<String, Object> requestBody) {
        try {
            String reportType = (String) requestBody.get("reportType");
            String startDateStr = (String) requestBody.get("startDate");
            String endDateStr = (String) requestBody.get("endDate");
            String status = (String) requestBody.get("status");
            String equipmentType = (String) requestBody.get("equipmentType");

            log.info("Exportando relatÃ³rio para CSV: {}", reportType);

            // Criar DTO simples inline
            var reportRequest = new Object() {
                public String getReportType() { return reportType; }
                public LocalDate getStartDate() { 
                    return startDateStr != null ? LocalDate.parse(startDateStr) : null; 
                }
                public LocalDate getEndDate() { 
                    return endDateStr != null ? LocalDate.parse(endDateStr) : null; 
                }
                public String getStatus() { return status; }
                public String getEquipmentType() { return equipmentType; }
            };

            byte[] csvBytes = equipmentReportService.exportToCsv(reportRequest);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDispositionFormData("attachment", 
                "equipment_report_" + reportType + "_" + LocalDate.now() + ".csv");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(csvBytes);
        } catch (Exception e) {
            log.error("Erro ao exportar relatÃ³rio para CSV", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
