package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.ContasAPagarReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/test-reports")
@RequiredArgsConstructor
@Slf4j
public class TestReportController {
    
    private final ContasAPagarReportService contasAPagarReportService;
    
    @GetMapping("/contas-a-pagar/test")
    public ResponseEntity<String> testContasAPagarReport() {
        try {
            log.info("Testando geraÃ§Ã£o de relatÃ³rio de contas a pagar");
            
            // Gera relatÃ³rio para o Ãºltimo mÃªs
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusMonths(1);
            
            String report = contasAPagarReportService.generateContasAPagarReport(startDate, endDate);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_HTML);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
                    
        } catch (Exception e) {
            log.error("Erro ao testar relatÃ³rio: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("Erro ao gerar relatÃ³rio: " + e.getMessage());
        }
    }
    
    @GetMapping("/contas-a-pagar/summary-test")
    public ResponseEntity<String> testSummaryReport() {
        try {
            log.info("Testando geraÃ§Ã£o de relatÃ³rio resumido");
            
            String report = contasAPagarReportService.generateContasAPagarSummaryReport();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_HTML);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(report);
                    
        } catch (Exception e) {
            log.error("Erro ao testar relatÃ³rio resumido: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("Erro ao gerar relatÃ³rio: " + e.getMessage());
        }
    }
}

