package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.VehicleReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/vehicles/report")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class VehicleReportController {
    
    private final VehicleReportService vehicleReportService;
    
    @GetMapping("/pdf")
    public ResponseEntity<byte[]> generateVehicleReportPDF(
            @RequestParam(required = false) String status) {
        
        try {
            log.info("Gerando relatório PDF de veículos - Status: {}", status);
            
            byte[] pdfBytes = vehicleReportService.generateVehicleReportPDF(status);
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = String.format("relatorio_veiculos_%s.pdf", timestamp);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);
            
            log.info("Relatório PDF de veículos gerado com sucesso. Tamanho: {} bytes", pdfBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
                    
        } catch (IOException e) {
            log.error("Erro ao gerar relatório PDF de veículos", e);
            return ResponseEntity.internalServerError()
                    .body(("Erro ao gerar relatório: " + e.getMessage()).getBytes());
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar relatório PDF de veículos", e);
            return ResponseEntity.internalServerError()
                    .body(("Erro inesperado: " + e.getMessage()).getBytes());
        }
    }
}
