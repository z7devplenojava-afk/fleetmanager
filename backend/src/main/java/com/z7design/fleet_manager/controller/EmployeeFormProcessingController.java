package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.EmployeeFormProcessingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "FuncionÃ¡rios - Processamento de Ficha")
public class EmployeeFormProcessingController {

    private final EmployeeFormProcessingService processingService;

    @PostMapping("/process-form")
    @Operation(summary = "Processar Ficha de Registro (PDF)", description = "Extrai dados da ficha PDF e devolve JSON para preenchimento do formulÃ¡rio")
    public ResponseEntity<Map<String, Object>> processForm(@RequestParam("file") MultipartFile file) {
        try {
            log.info("Recebido PDF de ficha de funcionÃ¡rio: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
            Map<String, Object> data = processingService.processEmployeeForm(file);
            return ResponseEntity.ok(data);
        } catch (IllegalArgumentException e) {
            log.warn("ValidaÃ§Ã£o falhou ao processar ficha: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        } catch (IOException e) {
            log.error("Erro ao processar ficha PDF: ", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Erro ao ler PDF"));
        } catch (Exception e) {
            log.error("Erro inesperado no processamento de ficha: ", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "Erro interno do servidor"));
        }
    }
}



