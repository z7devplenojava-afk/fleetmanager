package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.worker.UnificationWorker;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller para gerenciar o processo de unificaÃ§Ã£o de holerites e comprovantes
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/unification")
@RequiredArgsConstructor
@Tag(name = "Unification", description = "API para gerenciar unificaÃ§Ã£o de holerites e comprovantes")
public class UnificationController {
    
    private final UnificationWorker unificationWorker;
    
    @PostMapping("/run")
    @Operation(
        summary = "Executar processo de unificaÃ§Ã£o manualmente",
        description = "Inicia o processo de matching e unificaÃ§Ã£o entre holerites e comprovantes jÃ¡ processados"
    )
    public ResponseEntity<Map<String, Object>> runUnification() {
        try {
            log.info("ðŸ”„ Iniciando processo de unificaÃ§Ã£o manual...");
            
            // Executar unificaÃ§Ã£o em thread separada para nÃ£o bloquear
            new Thread(() -> {
                try {
                    unificationWorker.processUnification();
                } catch (Exception e) {
                    log.error("âŒ Erro ao executar unificaÃ§Ã£o", e);
                }
            }).start();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "PROCESSING");
            response.put("message", "Processo de unificaÃ§Ã£o iniciado. Verifique os logs para acompanhar o progresso.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("âŒ Erro ao iniciar processo de unificaÃ§Ã£o", e);
            Map<String, Object> error = new HashMap<>();
            error.put("status", "ERROR");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}


