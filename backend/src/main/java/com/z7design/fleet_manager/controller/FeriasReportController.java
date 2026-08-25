package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FeriasReportDTO;
import com.z7design.fleet_manager.service.FeriasReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports/ferias")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "RelatÃ³rios de FÃ©rias", description = "Endpoints para geraÃ§Ã£o de relatÃ³rios de fÃ©rias e afastamentos")
public class FeriasReportController {

    private final FeriasReportService feriasReportService;

    @GetMapping("/stats")
    @Operation(summary = "EstatÃ­sticas gerais", description = "Retorna estatÃ­sticas gerais de fÃ©rias e afastamentos")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            log.info("Gerando estatÃ­sticas de fÃ©rias e afastamentos");
            Map<String, Object> stats = feriasReportService.getStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Erro ao gerar estatÃ­sticas", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats/ferias")
    @Operation(summary = "EstatÃ­sticas de fÃ©rias", description = "Retorna estatÃ­sticas especÃ­ficas de fÃ©rias")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<Map<String, Object>> getFeriasStats() {
        try {
            log.info("Gerando estatÃ­sticas de fÃ©rias");
            Map<String, Object> stats = feriasReportService.getFeriasStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Erro ao gerar estatÃ­sticas de fÃ©rias", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats/afastamentos")
    @Operation(summary = "EstatÃ­sticas de afastamentos", description = "Retorna estatÃ­sticas especÃ­ficas de afastamentos")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<Map<String, Object>> getAfastamentosStats() {
        try {
            log.info("Gerando estatÃ­sticas de afastamentos");
            Map<String, Object> stats = feriasReportService.getAfastamentosStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Erro ao gerar estatÃ­sticas de afastamentos", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/ferias/excel")
    @Operation(summary = "RelatÃ³rio de fÃ©rias em Excel", description = "Gera relatÃ³rio detalhado de fÃ©rias em Excel")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<ByteArrayResource> generateFeriasExcelReport(
            @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "tipo", required = false) String tipo,
            @RequestParam(value = "dataInicio", required = false) LocalDate dataInicio,
            @RequestParam(value = "dataFim", required = false) LocalDate dataFim) {
        
        try {
            log.info("Gerando relatÃ³rio Excel de fÃ©rias");
            
            FeriasReportDTO filters = FeriasReportDTO.builder()
                .employeeId(employeeId)
                .status(status)
                .tipo(tipo)
                .dataInicio(dataInicio)
                .dataFim(dataFim)
                .build();
            
            byte[] excelBytes = feriasReportService.generateFeriasExcelReport(filters);
            ByteArrayResource resource = new ByteArrayResource(excelBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=relatorio_ferias.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(excelBytes.length)
                    .body(resource);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio Excel de fÃ©rias: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/afastamentos/excel")
    @Operation(summary = "RelatÃ³rio de afastamentos em Excel", description = "Gera relatÃ³rio detalhado de afastamentos em Excel")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<ByteArrayResource> generateAfastamentosExcelReport(
            @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "tipo", required = false) String tipo,
            @RequestParam(value = "dataInicio", required = false) LocalDate dataInicio,
            @RequestParam(value = "dataFim", required = false) LocalDate dataFim) {
        
        try {
            log.info("Gerando relatÃ³rio Excel de afastamentos");
            
            FeriasReportDTO filters = FeriasReportDTO.builder()
                .employeeId(employeeId)
                .status(status)
                .tipo(tipo)
                .dataInicio(dataInicio)
                .dataFim(dataFim)
                .build();
            
            byte[] excelBytes = feriasReportService.generateAfastamentosExcelReport(filters);
            ByteArrayResource resource = new ByteArrayResource(excelBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=relatorio_afastamentos.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(excelBytes.length)
                    .body(resource);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio Excel de afastamentos: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/consolidado/excel")
    @Operation(summary = "RelatÃ³rio consolidado em Excel", description = "Gera relatÃ³rio consolidado de fÃ©rias e afastamentos em Excel")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN','ADMIN','GESTOR','RH','ROLE_SUPER_ADMIN','ROLE_ADMIN','ROLE_GESTOR','ROLE_RH')")
    public ResponseEntity<ByteArrayResource> generateConsolidadoExcelReport(
            @RequestParam(value = "employeeId", required = false) UUID employeeId,
            @RequestParam(value = "dataInicio", required = false) LocalDate dataInicio,
            @RequestParam(value = "dataFim", required = false) LocalDate dataFim) {
        
        try {
            log.info("Gerando relatÃ³rio Excel consolidado");
            
            FeriasReportDTO filters = FeriasReportDTO.builder()
                .employeeId(employeeId)
                .dataInicio(dataInicio)
                .dataFim(dataFim)
                .build();
            
            byte[] excelBytes = feriasReportService.generateConsolidadoExcelReport(filters);
            ByteArrayResource resource = new ByteArrayResource(excelBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=relatorio_consolidado_ferias_afastamentos.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(excelBytes.length)
                    .body(resource);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio Excel consolidado: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

