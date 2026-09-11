package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.AccountingFormService;
import com.z7design.fleet_manager.service.AccountingFormPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/accounting-forms")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AccountingFormController {

    private final AccountingFormService accountingFormService;
    private final AccountingFormPdfService accountingFormPdfService;

    /**
     * Gera ficha de contabilidade em HTML para um funcionÃ¡rio
     */
    @GetMapping("/{employeeId}/html")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_READ')")
    public ResponseEntity<String> generateAccountingFormHtml(@PathVariable("employeeId") UUID employeeId) {
        try {
            log.info("ðŸ“„ Gerando ficha de contabilidade HTML para funcionÃ¡rio: {}", employeeId);
            
            String html = accountingFormService.generateAccountingFormHtml(employeeId);
            
            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=ficha_contabilidade_" + employeeId + ".html")
                .body(html);
                
        } catch (Exception e) {
            log.error("âŒ Erro ao gerar ficha de contabilidade: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body("<html><body><h1>Erro ao gerar ficha</h1><p>" + e.getMessage() + "</p></body></html>");
        }
    }

    /**
     * Gera ficha de contabilidade em PDF para um funcionÃ¡rio
     */
    @GetMapping("/{employeeId}/pdf")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_READ')")
    public ResponseEntity<byte[]> generateAccountingFormPdf(@PathVariable("employeeId") UUID employeeId) {
        try {
            log.info("ðŸ“„ Gerando ficha de contabilidade PDF para funcionÃ¡rio: {}", employeeId);
            
            byte[] pdf = accountingFormPdfService.generateAccountingFormPdf(employeeId);
            
            String fileName = "ficha_contabilidade_" + employeeId + ".pdf";
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(pdf);
                
        } catch (Exception e) {
            log.error("âŒ Erro ao gerar ficha de contabilidade PDF: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Gera ficha de contabilidade em Excel para um funcionÃ¡rio
     */
    @GetMapping("/{employeeId}/excel")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'EMPLOYEES_READ')")
    public ResponseEntity<byte[]> generateAccountingFormExcel(@PathVariable("employeeId") UUID employeeId) {
        try {
            log.info("ðŸ“Š Gerando ficha de contabilidade Excel para funcionÃ¡rio: {}", employeeId);

            byte[] excel = accountingFormPdfService.generateAccountingFormExcel(employeeId);

            String fileName = "ficha_contabilidade_" + employeeId + ".xlsx";

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(excel);

        } catch (Exception e) {
            log.error("âŒ Erro ao gerar ficha de contabilidade Excel: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}


