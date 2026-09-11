package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.PontoProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ponto-processing")
@RequiredArgsConstructor
@Slf4j
public class PontoProcessingController {

    private final PontoProcessingService pontoProcessingService;

    @PostMapping("/process/{employeeId}")
    @PreAuthorize("hasAnyAuthority('PONTO_RAW_IMPORT', 'TIME_RECORD_CREATE', 'SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> processBatidasForEmployee(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            PontoProcessingService.ProcessingResult result = 
                    pontoProcessingService.processBatidasForEmployee(employeeId, startDate, endDate);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Processamento concluÃ­do",
                    "data", result
            ));
        } catch (Exception e) {
            log.error("Erro ao processar batidas: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}






