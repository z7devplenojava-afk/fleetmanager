package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ContractRetentionDTO;
import com.z7design.fleet_manager.model.enums.RetentionStatus;
import com.z7design.fleet_manager.service.ContractRetentionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contract-retentions")
@RequiredArgsConstructor
@Tag(name = "Retenção Contratual", description = "Endpoints para gestão de Controle de Retenção Contratual")
public class ContractRetentionController {

    private final ContractRetentionService retentionService;

    @GetMapping
    @Operation(summary = "Listar todas as retenções contratuais")
    public ResponseEntity<List<ContractRetentionDTO>> getAll() {
        return ResponseEntity.ok(retentionService.getAllRetentions());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar retenção contratual por ID")
    public ResponseEntity<ContractRetentionDTO> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(retentionService.getRetentionById(id));
    }

    @PostMapping
    @Operation(summary = "Criar nova retenção contratual")
    public ResponseEntity<ContractRetentionDTO> create(@RequestBody ContractRetentionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(retentionService.createRetention(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar retenção contratual")
    public ResponseEntity<ContractRetentionDTO> update(
            @PathVariable("id") UUID id,
            @RequestBody ContractRetentionDTO dto) {
        return ResponseEntity.ok(retentionService.updateRetention(id, dto));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status da retenção contratual")
    public ResponseEntity<ContractRetentionDTO> updateStatus(
            @PathVariable("id") UUID id,
            @RequestParam("status") RetentionStatus status,
            @RequestParam(value = "actualReleaseDate", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate actualReleaseDate) {
        return ResponseEntity.ok(retentionService.updateStatus(id, status, actualReleaseDate));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar retenção contratual")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        retentionService.deleteRetention(id);
        return ResponseEntity.noContent().build();
    }
}
