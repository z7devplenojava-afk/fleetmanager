package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CostSimulationDTO;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.service.CostSimulationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 1: Engenharia de Custos, Orçamento & Precificação Paramétrica.
 */
@RestController
@RequestMapping("/api/cost-simulations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Engenharia de Custos", description = "API de precificação paramétrica (PRD Módulo 1)")
public class CostSimulationController {

    private final CostSimulationService costSimulationService;

    @GetMapping
    @Operation(summary = "Listar simulações de custos")
    public ResponseEntity<List<CostSimulationDTO>> getAll() {
        return ResponseEntity.ok(costSimulationService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar simulação por ID")
    public ResponseEntity<CostSimulationDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(costSimulationService.getById(id));
    }

    @GetMapping("/client/{clientId}")
    @Operation(summary = "Listar simulações por cliente")
    public ResponseEntity<List<CostSimulationDTO>> getByClient(@PathVariable UUID clientId) {
        return ResponseEntity.ok(costSimulationService.getByClient(clientId));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Listar simulações por status")
    public ResponseEntity<List<CostSimulationDTO>> getByStatus(@PathVariable CostSimulationStatus status) {
        return ResponseEntity.ok(costSimulationService.getByStatus(status));
    }

    /**
     * Cria a simulação e retorna a ficha paramétrica calculada.
     */
    @PostMapping
    @Operation(summary = "Criar e calcular simulação de custos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Simulação criada e calculada"),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos")
    })
    public ResponseEntity<CostSimulationDTO> create(@Valid @RequestBody CostSimulationDTO dto) {
        log.info("POST /api/cost-simulations - {}", dto.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(costSimulationService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar e recalcular simulação")
    public ResponseEntity<CostSimulationDTO> update(@PathVariable UUID id, @Valid @RequestBody CostSimulationDTO dto) {
        return ResponseEntity.ok(costSimulationService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir simulação")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        costSimulationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Envia a simulação para validação da Diretoria.
     */
    @PostMapping("/{id}/submit")
    @Operation(summary = "Enviar para aprovação da Diretoria")
    public ResponseEntity<CostSimulationDTO> submitForApproval(@PathVariable UUID id) {
        return ResponseEntity.ok(costSimulationService.submitForApproval(id));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Aprovar simulação (Diretoria)")
    public ResponseEntity<CostSimulationDTO> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String approvedBy = body != null ? body.get("approvedBy") : null;
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(costSimulationService.approve(id, approvedBy, notes));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reprovar simulação (Diretoria)")
    public ResponseEntity<CostSimulationDTO> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String approvedBy = body != null ? body.get("approvedBy") : null;
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(costSimulationService.reject(id, approvedBy, notes));
    }
}
