package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.EquipmentReportService;

import br.com.fleetmanager.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/equipment-reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Relatórios de Equipamentos", description = "Endpoints para geração de relatórios e filtros avançados")
@SecurityRequirement(name = "bearerAuth")
public class EquipmentReportController {
    
    private final EquipmentReportService reportService;
    
    @PostMapping("/generate")
    @Operation(summary = "Gerar relatório", description = "Gera relatório de equipamentos com filtros avançados")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Filtros inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<EquipmentReportDTO> generateReport(@RequestBody EquipmentReportFiltersDTO filters) {
        log.info("Recebida solicitação para gerar relatório: {}", filters.getReportType());
        EquipmentReportDTO report = reportService.generateReport(filters);
        return ResponseEntity.ok(report);
    }
    
    @PostMapping("/equipment-by-employee")
    @Operation(summary = "Relatório por funcionário", description = "Gera relatório de equipamentos agrupados por funcionário")
    @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso")
    public ResponseEntity<EquipmentReportDTO> generateEquipmentByEmployeeReport(@RequestBody EquipmentReportFiltersDTO filters) {
        log.info("Gerando relatório de equipamentos por funcionário");
        filters.setReportType("equipment_by_employee");
        EquipmentReportDTO report = reportService.generateReport(filters);
        return ResponseEntity.ok(report);
    }
    
    @PostMapping("/weapon-validity")
    @Operation(summary = "Relatório de validade de armas", description = "Gera relatório específico para validade de registros de armas")
    @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso")
    public ResponseEntity<EquipmentReportDTO> generateWeaponValidityReport(@RequestBody EquipmentReportFiltersDTO filters) {
        log.info("Gerando relatório de validade de armas");
        filters.setReportType("weapon_validity");
        filters.setIsDangerous(true); // Forçar filtro para equipamentos perigosos
        EquipmentReportDTO report = reportService.generateReport(filters);
        return ResponseEntity.ok(report);
    }
    
    @PostMapping("/usage-report")
    @Operation(summary = "Relatório de uso", description = "Gera relatório de uso e movimentações de equipamentos")
    @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso")
    public ResponseEntity<EquipmentReportDTO> generateUsageReport(@RequestBody EquipmentReportFiltersDTO filters) {
        log.info("Gerando relatório de uso de equipamentos");
        filters.setReportType("usage_report");
        filters.setIncludeMovements(true);
        EquipmentReportDTO report = reportService.generateReport(filters);
        return ResponseEntity.ok(report);
    }
    
    @PostMapping("/expiry-report")
    @Operation(summary = "Relatório de vencimento", description = "Gera relatório de equipamentos vencidos ou vencendo em breve")
    @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso")
    public ResponseEntity<EquipmentReportDTO> generateExpiryReport(@RequestBody EquipmentReportFiltersDTO filters) {
        log.info("Gerando relatório de vencimento de equipamentos");
        filters.setReportType("expiry_report");
        EquipmentReportDTO report = reportService.generateReport(filters);
        return ResponseEntity.ok(report);
    }
    
    @PostMapping("/export/pdf")
    @Operation(summary = "Exportar PDF", description = "Gera e exporta relatório em formato PDF")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "PDF gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Erro na geração do PDF"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<byte[]> exportToPdf(@RequestBody EquipmentReportFiltersDTO filters) {
        log.info("Exportando relatório para PDF: {}", filters.getReportType());
        filters.setExportFormat("pdf");
        
        // TODO: Implementar geração de PDF
        // Por enquanto, retorna um placeholder
        String placeholder = "PDF do relatório será implementado";
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"relatorio_equipamentos.pdf\"")
                .body(placeholder.getBytes());
    }
    
    @PostMapping("/export/excel")
    @Operation(summary = "Exportar Excel", description = "Gera e exporta relatório em formato Excel")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Excel gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Erro na geração do Excel"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<byte[]> exportToExcel(@RequestBody EquipmentReportFiltersDTO filters) {
        log.info("Exportando relatório para Excel: {}", filters.getReportType());
        filters.setExportFormat("excel");
        
        // TODO: Implementar geração de Excel
        // Por enquanto, retorna um placeholder
        String placeholder = "Excel do relatório será implementado";
        return ResponseEntity.ok()
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", "attachment; filename=\"relatorio_equipamentos.xlsx\"")
                .body(placeholder.getBytes());
    }
    
    @GetMapping("/filters/options")
    @Operation(summary = "Opções de filtros", description = "Retorna opções disponíveis para filtros")
    @ApiResponse(responseCode = "200", description = "Opções retornadas com sucesso")
    public ResponseEntity<Object> getFilterOptions() {
        log.info("Retornando opções de filtros");
        
        // TODO: Implementar retorno das opções de filtros
        // Por enquanto, retorna um objeto vazio
        return ResponseEntity.ok(new Object());
    }
} 