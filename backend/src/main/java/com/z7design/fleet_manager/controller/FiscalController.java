package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.FiscalDocument;
import com.z7design.fleet_manager.service.FiscalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fiscal")
@RequiredArgsConstructor
@Slf4j
public class FiscalController {

    private final FiscalService service;

    @GetMapping
    public ResponseEntity<List<FiscalDocument>> findAll() {
        log.info("GET /api/fiscal - Listando todos os documentos fiscais");
        try {
            List<FiscalDocument> documents = service.findAll();
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            log.error("Erro ao listar documentos fiscais: {}", e.getMessage());
            return ResponseEntity.ok(java.util.List.of()); // Retorna lista vazia para evitar 500 no front
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<FiscalDocument> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping("/upload")
    public ResponseEntity<FiscalDocument> uploadDocument(@RequestParam("file") MultipartFile file) {
        // TODO: Salvar arquivo e processar
        return ResponseEntity.ok(new FiscalDocument());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
