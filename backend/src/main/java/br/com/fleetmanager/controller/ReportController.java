package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.ContasAPagarReportService;
import br.com.fleetmanager.service.ReportTemplateService;

import br.com.fleetmanager.model.enums.ExpenseStatus;
import br.com.fleetmanager.model.enums.ExpenseType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Relatórios", description = "Endpoints para geração de relatórios")
public class ReportController {
    
    private final ContasAPagarReportService contasAPagarReportService;
    private final ReportTemplateService reportTemplateService;
    
    @GetMapping("/contas-a-pagar")
    @Operation(summary = "Relatório de Contas a Pagar por Período", 
               description = "Gera relatório de contas a pagar para um período específico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<String> generateContasAPagarReport(
            @Parameter(description = "Data de início do período") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data de fim do período") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(defaultValue = "html") String format) {
        
        try {
            log.info("Gerando relatório de contas a pagar para período: {} a {}", startDate, endDate);
            
            String report = contasAPagarReportService.generateContasAPagarReport(startDate, endDate);
            
            HttpHeaders headers = new HttpHeaders();
            if ("html".equals(format)) {
                headers.setContentType(MediaType.TEXT_HTML);
            } else if ("pdf".equals(format)) {
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-contas-a-pagar-" + startDate + "-" + endDate + ".pdf");
            }
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatório de contas a pagar: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao gerar relatório: " + e.getMessage());
        }
    }
    
    @GetMapping("/contas-a-pagar/status/{status}")
    @Operation(summary = "Relatório de Contas a Pagar por Status", 
               description = "Gera relatório de contas a pagar filtrado por status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status inválido"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<String> generateContasAPagarReportByStatus(
            @Parameter(description = "Status das contas") 
            @PathVariable ExpenseStatus status,
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(defaultValue = "html") String format) {
        
        try {
            log.info("Gerando relatório de contas a pagar por status: {}", status);
            
            String report = contasAPagarReportService.generateContasAPagarReportByStatus(status);
            
            HttpHeaders headers = new HttpHeaders();
            if ("html".equals(format)) {
                headers.setContentType(MediaType.TEXT_HTML);
            } else if ("pdf".equals(format)) {
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-contas-" + status.name().toLowerCase() + ".pdf");
            }
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatório por status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao gerar relatório: " + e.getMessage());
        }
    }
    
    @GetMapping("/contas-a-pagar/tipo/{type}")
    @Operation(summary = "Relatório de Contas a Pagar por Tipo", 
               description = "Gera relatório de contas a pagar filtrado por tipo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Tipo inválido"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<String> generateContasAPagarReportByType(
            @Parameter(description = "Tipo das contas") 
            @PathVariable ExpenseType type,
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(defaultValue = "html") String format) {
        
        try {
            log.info("Gerando relatório de contas a pagar por tipo: {}", type);
            
            String report = contasAPagarReportService.generateContasAPagarReportByType(type);
            
            HttpHeaders headers = new HttpHeaders();
            if ("html".equals(format)) {
                headers.setContentType(MediaType.TEXT_HTML);
            } else if ("pdf".equals(format)) {
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-contas-" + type.name().toLowerCase() + ".pdf");
            }
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatório por tipo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao gerar relatório: " + e.getMessage());
        }
    }
    
    @GetMapping("/contas-a-pagar/resumo")
    @Operation(summary = "Relatório Resumido de Contas a Pagar", 
               description = "Gera relatório resumido com todas as contas a pagar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Relatório gerado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<String> generateContasAPagarSummaryReport(
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(defaultValue = "html") String format) {
        
        try {
            log.info("Gerando relatório resumido de contas a pagar");
            
            String report = contasAPagarReportService.generateContasAPagarSummaryReport();
            
            HttpHeaders headers = new HttpHeaders();
            if ("html".equals(format)) {
                headers.setContentType(MediaType.TEXT_HTML);
            } else if ("pdf".equals(format)) {
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-resumo-contas-a-pagar.pdf");
            }
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatório resumido: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao gerar relatório: " + e.getMessage());
        }
    }
    
    @GetMapping("/company-data")
    @Operation(summary = "Dados da Empresa", 
               description = "Retorna os dados da empresa para uso em relatórios")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dados retornados com sucesso")
    })
    public ResponseEntity<Map<String, String>> getCompanyData() {
        try {
            Map<String, String> companyData = reportTemplateService.getCompanyData();
            return ResponseEntity.ok(companyData);
        } catch (Exception e) {
            log.error("Erro ao obter dados da empresa: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/template/{templateName}")
    @Operation(summary = "Obter Template", 
               description = "Retorna um template específico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Template retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Template não encontrado")
    })
    public ResponseEntity<String> getTemplate(
            @Parameter(description = "Nome do template") 
            @PathVariable String templateName) {
        
        try {
            String template = reportTemplateService.loadTemplate(templateName);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(template);
        } catch (Exception e) {
            log.error("Erro ao obter template {}: {}", templateName, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }
}