package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.ExtractDataHolerites;
import com.z7design.fleet_manager.service.ExtractDataHoleritesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/extract-data-holerites")
@RequiredArgsConstructor
@Slf4j
public class ExtractDataHoleritesController {
    
    private final ExtractDataHoleritesService extractDataHoleritesService;
    
    /**
     * Listar todos os dados extraÃ­dos
     */
    @GetMapping
    public ResponseEntity<List<ExtractDataHolerites>> getAllExtractData() {
        log.info("ðŸ“‹ Listando todos os dados extraÃ­dos de holerites");
        List<ExtractDataHolerites> data = extractDataHoleritesService.findAll();
        return ResponseEntity.ok(data);
    }
    
    /**
     * Buscar por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExtractDataHolerites> getById(@PathVariable UUID id) {
        log.info("ðŸ” Buscando dados extraÃ­dos por ID: {}", id);
        Optional<ExtractDataHolerites> data = extractDataHoleritesService.findById(id);
        return data.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Buscar por CPF
     */
    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<ExtractDataHolerites> getByCpf(@PathVariable String cpf) {
        log.info("ðŸ” Buscando dados extraÃ­dos por CPF: {}", cpf);
        Optional<ExtractDataHolerites> data = extractDataHoleritesService.findByCpf(cpf);
        return data.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Buscar por CPF e perÃ­odo
     */
    @GetMapping("/cpf/{cpf}/period/{mes}/{ano}")
    public ResponseEntity<ExtractDataHolerites> getByCpfAndPeriod(
            @PathVariable String cpf,
            @PathVariable String mes,
            @PathVariable Integer ano) {
        log.info("ðŸ” Buscando dados extraÃ­dos por CPF: {} e perÃ­odo: {}/{}", cpf, mes, ano);
        Optional<ExtractDataHolerites> data = extractDataHoleritesService.findByCpfAndPeriod(cpf, mes, ano);
        return data.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Buscar por perÃ­odo
     */
    @GetMapping("/period/{mes}/{ano}")
    public ResponseEntity<List<ExtractDataHolerites>> getByPeriod(
            @PathVariable String mes,
            @PathVariable Integer ano) {
        log.info("ðŸ” Buscando dados extraÃ­dos por perÃ­odo: {}/{}", mes, ano);
        List<ExtractDataHolerites> data = extractDataHoleritesService.findByPeriod(mes, ano);
        return ResponseEntity.ok(data);
    }
    
    /**
     * Buscar por nome
     */
    @GetMapping("/search")
    public ResponseEntity<List<ExtractDataHolerites>> searchByName(@RequestParam String nome) {
        log.info("ðŸ” Buscando dados extraÃ­dos por nome: {}", nome);
        List<ExtractDataHolerites> data = extractDataHoleritesService.findByNome(nome);
        return ResponseEntity.ok(data);
    }
    
    /**
     * Deletar por ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable UUID id) {
        log.info("ðŸ—‘ï¸ Deletando dados extraÃ­dos por ID: {}", id);
        try {
            extractDataHoleritesService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("âŒ Erro ao deletar dados extraÃ­dos: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
} 
