package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.model.enums.ExpenseType;
import com.z7design.fleet_manager.service.ContasAPagarReportService;
import com.z7design.fleet_manager.service.ReportTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.beans.factory.annotation.Value;
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
@Tag(name = "RelatÃ³rios", description = "Endpoints para geraÃ§Ã£o de relatÃ³rios")
public class ReportController {
    
    private final ContasAPagarReportService contasAPagarReportService;
    private final ReportTemplateService reportTemplateService;
    private final com.z7design.fleet_manager.service.ReportService reportService;
    private final com.z7design.fleet_manager.service.EmailService emailService;
    @Value("${accounting.email:contabilidade@empresa.com}")
    private String defaultAccountingEmail;
    
    @GetMapping("/contas-a-pagar")
    @Operation(summary = "RelatÃ³rio de Contas a Pagar por PerÃ­odo", 
               description = "Gera relatÃ³rio de contas a pagar para um perÃ­odo especÃ­fico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "ParÃ¢metros invÃ¡lidos"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<?> generateContasAPagarReport(
            @Parameter(description = "Data de inÃ­cio do perÃ­odo") 
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data de fim do perÃ­odo") 
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(value = "format", defaultValue = "html") String format) {
        
        try {
            log.info("Gerando relatÃ³rio de contas a pagar para perÃ­odo: {} a {}, formato: {}", startDate, endDate, format);
            
            HttpHeaders headers = new HttpHeaders();
            
            if ("pdf".equalsIgnoreCase(format)) {
                // Usar novo mÃ©todo PDF com layout padrÃ£o
                byte[] pdfBytes = contasAPagarReportService.generateContasAPagarReportPDF(startDate, endDate, null, null);
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-contas-a-pagar-" + startDate + "-" + endDate + ".pdf");
                headers.setContentLength(pdfBytes.length);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(pdfBytes);
            } else {
                // Formato HTML (padrÃ£o)
                String report = contasAPagarReportService.generateContasAPagarReport(startDate, endDate);
                headers.setContentType(MediaType.TEXT_HTML);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(report);
            }
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de contas a pagar: {}", e.getMessage(), e);
            if ("pdf".equalsIgnoreCase(format)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(("Erro ao gerar relatÃ³rio: " + e.getMessage()).getBytes());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erro ao gerar relatÃ³rio: " + e.getMessage());
            }
        }
    }

    @GetMapping("/payroll/pdf")
    @Operation(summary = "RelatÃ³rio PDF da Folha de Pagamento", description = "Gera relatÃ³rio PDF para envio Ã  contabilidade.")
    public ResponseEntity<byte[]> generatePayrollPdf(
            @RequestParam(value = "referenceMonth", required = false) String referenceMonth,
            @RequestParam(value = "unitId", required = false) java.util.UUID unitId,
            @RequestParam(value = "employeeId", required = false) java.util.UUID employeeId) {
        try {
            byte[] pdf = reportService.generatePayrollReportPdf(referenceMonth, unitId, employeeId);
            return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-folha.pdf")
                .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/payroll/send-email")
    @Operation(summary = "Enviar relatÃ³rio de folha em PDF por email", description = "Gera o PDF e envia para a contabilidade.")
    public ResponseEntity<Void> sendPayrollPdfByEmail(
            @RequestParam(value = "to", required = false) String to,
            @RequestParam(value = "referenceMonth", required = false) String referenceMonth,
            @RequestParam(value = "unitId", required = false) java.util.UUID unitId,
            @RequestParam(value = "employeeId", required = false) java.util.UUID employeeId) {
        try {
            byte[] pdf = reportService.generatePayrollReportPdf(referenceMonth, unitId, employeeId);
            String subject = "RelatÃ³rio de Folha - " + (referenceMonth != null ? referenceMonth : "PerÃ­odo");
            String body = "<p>Segue em anexo o relatÃ³rio de folha de pagamento." + (referenceMonth != null ? (" CompetÃªncia: <strong>" + referenceMonth + "</strong>.") : "") + "</p>";
            String toEmail = (to != null && !to.isBlank()) ? to : defaultAccountingEmail;
            boolean ok = emailService.sendEmailWithAttachment(toEmail, subject, body, pdf, "relatorio-folha.pdf");
            if (ok) return ResponseEntity.ok().build();
            return ResponseEntity.status(500).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/contas-a-pagar/status/{status}")
    @Operation(summary = "RelatÃ³rio de Contas a Pagar por Status", 
               description = "Gera relatÃ³rio de contas a pagar filtrado por status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Status invÃ¡lido"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<?> generateContasAPagarReportByStatus(
            @Parameter(description = "Status das contas") 
            @PathVariable("status") ExpenseStatus status,
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(value = "format", defaultValue = "html") String format) {
        
        try {
            log.info("Gerando relatÃ³rio de contas a pagar por status: {}, formato: {}", status, format);
            
            HttpHeaders headers = new HttpHeaders();
            
            if ("pdf".equalsIgnoreCase(format)) {
                // Usar novo mÃ©todo PDF com layout padrÃ£o
                byte[] pdfBytes = contasAPagarReportService.generateContasAPagarReportPDFByStatus(status);
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-contas-" + status.name().toLowerCase() + ".pdf");
                headers.setContentLength(pdfBytes.length);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(pdfBytes);
            } else {
                // Formato HTML (padrÃ£o)
                String report = contasAPagarReportService.generateContasAPagarReportByStatus(status);
                headers.setContentType(MediaType.TEXT_HTML);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(report);
            }
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio por status: {}", e.getMessage(), e);
            if ("pdf".equalsIgnoreCase(format)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(("Erro ao gerar relatÃ³rio: " + e.getMessage()).getBytes());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erro ao gerar relatÃ³rio: " + e.getMessage());
            }
        }
    }
    
    @GetMapping("/contas-a-pagar/tipo/{type}")
    @Operation(summary = "RelatÃ³rio de Contas a Pagar por Tipo", 
               description = "Gera relatÃ³rio de contas a pagar filtrado por tipo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Tipo invÃ¡lido"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<?> generateContasAPagarReportByType(
            @Parameter(description = "Tipo das contas") 
            @PathVariable("type") ExpenseType type,
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(value = "format", defaultValue = "html") String format) {
        
        try {
            log.info("Gerando relatÃ³rio de contas a pagar por tipo: {}, formato: {}", type, format);
            
            HttpHeaders headers = new HttpHeaders();
            
            if ("pdf".equalsIgnoreCase(format)) {
                // Usar novo mÃ©todo PDF com layout padrÃ£o
                byte[] pdfBytes = contasAPagarReportService.generateContasAPagarReportPDFByType(type);
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-contas-" + type.name().toLowerCase() + ".pdf");
                headers.setContentLength(pdfBytes.length);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(pdfBytes);
            } else {
                // Formato HTML (padrÃ£o)
                String report = contasAPagarReportService.generateContasAPagarReportByType(type);
                headers.setContentType(MediaType.TEXT_HTML);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(report);
            }
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio por tipo: {}", e.getMessage(), e);
            if ("pdf".equalsIgnoreCase(format)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(("Erro ao gerar relatÃ³rio: " + e.getMessage()).getBytes());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erro ao gerar relatÃ³rio: " + e.getMessage());
            }
        }
    }
    
    @GetMapping("/contas-a-pagar/resumo")
    @Operation(summary = "RelatÃ³rio Resumido de Contas a Pagar", 
               description = "Gera relatÃ³rio resumido com todas as contas a pagar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<?> generateContasAPagarSummaryReport(
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(value = "format", defaultValue = "html") String format) {
        
        try {
            log.info("Gerando relatÃ³rio resumido de contas a pagar, formato: {}", format);
            
            HttpHeaders headers = new HttpHeaders();
            
            if ("pdf".equalsIgnoreCase(format)) {
                // Usar novo mÃ©todo PDF com layout padrÃ£o
                byte[] pdfBytes = contasAPagarReportService.generateContasAPagarSummaryReportPDF();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-resumo-contas-a-pagar.pdf");
                headers.setContentLength(pdfBytes.length);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(pdfBytes);
            } else {
                // Formato HTML (padrÃ£o)
                String report = contasAPagarReportService.generateContasAPagarSummaryReport();
                headers.setContentType(MediaType.TEXT_HTML);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(report);
            }
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio resumido: {}", e.getMessage(), e);
            if ("pdf".equalsIgnoreCase(format)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(("Erro ao gerar relatÃ³rio: " + e.getMessage()).getBytes());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erro ao gerar relatÃ³rio: " + e.getMessage());
            }
        }
    }
    
    @GetMapping("/contas-a-pagar/empresa/{companySigla}")
    @Operation(summary = "RelatÃ³rio de Contas a Pagar por Empresa", 
               description = "Gera relatÃ³rio de contas a pagar filtrado por empresa (sigla)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "400", description = "ParÃ¢metros invÃ¡lidos"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<?> generateContasAPagarReportByCompany(
            @Parameter(description = "Sigla da empresa") 
            @PathVariable("companySigla") String companySigla,
            @Parameter(description = "Data de inÃ­cio do perÃ­odo") 
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data de fim do perÃ­odo") 
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Formato de resposta: html ou pdf") 
            @RequestParam(value = "format", defaultValue = "pdf") String format) {
        
        try {
            log.info("Gerando relatÃ³rio de contas a pagar por empresa: {}, formato: {}", companySigla, format);
            
            HttpHeaders headers = new HttpHeaders();
            
            if ("pdf".equalsIgnoreCase(format)) {
                // Usar mÃ©todo PDF com layout padrÃ£o
                byte[] pdfBytes = contasAPagarReportService.generateContasAPagarReportPDFByCompany(
                        companySigla, startDate, endDate);
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                    "relatorio-contas-a-pagar-empresa-" + companySigla + ".pdf");
                headers.setContentLength(pdfBytes.length);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(pdfBytes);
            } else {
                // Formato HTML (fallback - usar mÃ©todo existente)
                String report = contasAPagarReportService.generateContasAPagarReport(
                        startDate != null ? startDate : LocalDate.now().minusMonths(1),
                        endDate != null ? endDate : LocalDate.now());
                headers.setContentType(MediaType.TEXT_HTML);
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(report);
            }
                    
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio por empresa: {}", e.getMessage(), e);
            if ("pdf".equalsIgnoreCase(format)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(("Erro ao gerar relatÃ³rio: " + e.getMessage()).getBytes());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erro ao gerar relatÃ³rio: " + e.getMessage());
            }
        }
    }
    
    @GetMapping("/company-data")
    @Operation(summary = "Dados da Empresa", 
               description = "Retorna os dados da empresa para uso em relatÃ³rios")
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
               description = "Retorna um template especÃ­fico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Template retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Template nÃ£o encontrado")
    })
    public ResponseEntity<String> getTemplate(
            @Parameter(description = "Nome do template") 
            @PathVariable("templateName") String templateName) {
        
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
    
    @GetMapping("/companies/pdf")
    @Operation(summary = "RelatÃ³rio de Empresas em PDF", 
               description = "Gera relatÃ³rio PDF com todas as empresas cadastradas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<byte[]> generateCompaniesReportPdf() {
        try {
            log.info("Gerando relatÃ³rio de empresas em PDF");
            byte[] pdf = reportService.generateCompanyReportPdf(Map.of());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-empresas.pdf")
                    .body(pdf);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de empresas em PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/products/pdf")
    @Operation(summary = "RelatÃ³rio de Produtos em PDF", 
               description = "Gera relatÃ³rio PDF com todos os produtos cadastrados")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<byte[]> generateProductsReportPdf() {
        try {
            log.info("Gerando relatÃ³rio de produtos em PDF");
            byte[] pdf = reportService.generateProductReportPdf(Map.of());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-produtos.pdf")
                    .body(pdf);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de produtos em PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/inventory/pdf")
    @Operation(summary = "RelatÃ³rio de Estoque em PDF", 
               description = "Gera relatÃ³rio PDF com a situaÃ§Ã£o atual do estoque")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<byte[]> generateInventoryReportPdf() {
        try {
            log.info("Gerando relatÃ³rio de estoque em PDF");
            byte[] pdf = reportService.generateInventoryReportPdf(Map.of());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-estoque.pdf")
                    .body(pdf);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio de estoque em PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/consolidated/pdf")
    @Operation(summary = "RelatÃ³rio Consolidado em PDF", 
               description = "Gera relatÃ³rio PDF consolidado com dados de funcionÃ¡rios, empresas, produtos, estoque e transaÃ§Ãµes financeiras")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "RelatÃ³rio gerado com sucesso"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<byte[]> generateConsolidatedReportPdf() {
        try {
            log.info("Gerando relatÃ³rio consolidado em PDF");
            byte[] pdf = reportService.generateConsolidatedReportPdf(Map.of());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-consolidado.pdf")
                    .body(pdf);
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio consolidado em PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
