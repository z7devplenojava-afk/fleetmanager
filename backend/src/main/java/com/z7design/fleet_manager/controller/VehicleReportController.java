package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.VehicleReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles/report")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class VehicleReportController {
    
    private final VehicleReportService vehicleReportService;
    
    @GetMapping("/pdf")
    public ResponseEntity<?> generateVehicleReportPDF(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "companyId", required = false) java.util.UUID companyId) {
        
        try {
            log.info("Gerando relatÃ³rio PDF de veÃ­culos - Status: {}", status);
            
            byte[] pdfBytes = vehicleReportService.generateVehicleReportPDF(status, companyId);
            
            if (pdfBytes == null || pdfBytes.length == 0) {
                log.warn("RelatÃ³rio PDF gerado estÃ¡ vazio");
                Map<String, String> error = new HashMap<>();
                error.put("error", "RelatÃ³rio PDF gerado estÃ¡ vazio");
                error.put("message", "NÃ£o foi possÃ­vel gerar o relatÃ³rio. Tente novamente.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(error);
            }
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = String.format("relatorio_veiculos_%s.pdf", timestamp);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);
            
            log.info("RelatÃ³rio PDF de veÃ­culos gerado com sucesso. Tamanho: {} bytes", pdfBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
                    
        } catch (IOException e) {
            log.error("Erro ao gerar relatÃ³rio PDF de veÃ­culos", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro ao gerar relatÃ³rio PDF");
            error.put("message", e.getMessage());
            error.put("cause", e.getCause() != null ? e.getCause().getMessage() : "Causa desconhecida");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatÃ³rio PDF de veÃ­culos", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro inesperado ao gerar relatÃ³rio PDF");
            error.put("message", e.getMessage());
            error.put("cause", e.getCause() != null ? e.getCause().getMessage() : "Causa desconhecida");
            error.put("class", e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(error);
        }
    }
}

