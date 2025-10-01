package br.com.fleetmanager.controller;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.UnitService;

import br.com.fleetmanager.dto.CreateUnitRequest;
import br.com.fleetmanager.dto.UnitDTO;
import br.com.fleetmanager.dto.UpdateUnitRequest;
import br.com.fleetmanager.model.Unit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/units")
@Tag(name = "Unidades/Centros de Custo", description = "Endpoints para gestão de unidades e centros de custo")
// @SecurityRequirement(name = "bearerAuth")
public class UnitController {
    
    private static final Logger log = LoggerFactory.getLogger(UnitController.class);
    
    @Autowired
    private UnitService unitService;
    
    @GetMapping
    @Operation(summary = "Listar todas as unidades", description = "Retorna uma lista de todas as unidades")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de unidades retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<UnitDTO>> getAllUnits() {
        log.debug("Buscando todas as unidades");
        List<UnitDTO> units = unitService.findAllAsDTO();
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/active")
    @Operation(summary = "Listar unidades ativas", description = "Retorna uma lista de todas as unidades ativas")
    public ResponseEntity<List<UnitDTO>> getAllActive() {
        log.debug("Buscando unidades ativas");
        List<UnitDTO> units = unitService.findAllActiveAsDTO();
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar unidade por ID", description = "Retorna uma unidade específica pelo ID")
    public ResponseEntity<UnitDTO> getById(@PathVariable UUID id) {
        log.debug("Buscando unidade por ID: {}", id);
        UnitDTO unit = unitService.findByIdAsDTO(id);
        return ResponseEntity.ok(unit);
    }
    
    @GetMapping("/code/{code}")
    @Operation(summary = "Buscar unidade por código", description = "Retorna uma unidade específica pelo código")
    public ResponseEntity<UnitDTO> getByCode(@PathVariable String code) {
        log.debug("Buscando unidade por código: {}", code);
        UnitDTO unit = unitService.findByCodeAsDTO(code);
        return ResponseEntity.ok(unit);
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar unidades por nome", description = "Retorna unidades que contenham o nome especificado")
    public ResponseEntity<List<UnitDTO>> searchByName(
            @Parameter(description = "Nome para busca") @RequestParam String name) {
        log.debug("Buscando unidades por nome: {}", name);
        List<UnitDTO> units = unitService.findByNameContainingAsDTO(name);
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/search/active")
    @Operation(summary = "Buscar unidades ativas por nome", description = "Retorna unidades ativas que contenham o nome especificado")
    public ResponseEntity<List<UnitDTO>> searchActiveByName(
            @Parameter(description = "Nome para busca") @RequestParam String name) {
        log.debug("Buscando unidades ativas por nome: {}", name);
        List<UnitDTO> units = unitService.findActiveByNameContainingAsDTO(name);
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/root")
    @Operation(summary = "Listar unidades raiz", description = "Retorna unidades que não possuem unidade pai")
    public ResponseEntity<List<UnitDTO>> getRootUnits() {
        log.debug("Buscando unidades raiz");
        List<UnitDTO> units = unitService.findRootUnitsAsDTO();
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/root/active")
    @Operation(summary = "Listar unidades raiz ativas", description = "Retorna unidades raiz que estão ativas")
    public ResponseEntity<List<UnitDTO>> getActiveRootUnits() {
        log.debug("Buscando unidades raiz ativas");
        List<UnitDTO> units = unitService.findActiveRootUnitsAsDTO();
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/{id}/children")
    @Operation(summary = "Listar unidades filhas", description = "Retorna as unidades filhas de uma unidade específica")
    public ResponseEntity<List<UnitDTO>> getChildren(@PathVariable UUID id) {
        log.debug("Buscando unidades filhas de: {}", id);
        List<UnitDTO> units = unitService.findChildrenAsDTO(id);
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Listar unidades por cliente", description = "Retorna unidades associadas a um cliente específico")
    public ResponseEntity<List<UnitDTO>> getByClientId(@PathVariable String clientId) {
        log.debug("Buscando unidades do cliente: {}", clientId);
        List<UnitDTO> units = unitService.findByClientIdAsDTO(UUID.fromString(clientId));
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/client/{clientId}/active")
    @Operation(summary = "Listar unidades ativas por cliente", description = "Retorna unidades ativas associadas a um cliente específico")
    public ResponseEntity<List<UnitDTO>> getActiveByClientId(@PathVariable String clientId) {
        log.debug("Buscando unidades ativas do cliente: {}", clientId);
        List<UnitDTO> units = unitService.findActiveByClientIdAsDTO(UUID.fromString(clientId));
        return ResponseEntity.ok(units);
    }
    
    @PostMapping
    @Operation(summary = "Criar nova unidade", description = "Cria uma nova unidade/centro de custo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Unidade criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UnitDTO> createUnit(@Valid @RequestBody CreateUnitRequest request) {
        log.info("Criando nova unidade: {}", request.getName());
        UnitDTO createdUnit = unitService.createUnitFromRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUnit);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar unidade", description = "Atualiza uma unidade existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unidade atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Unidade não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UnitDTO> updateUnit(@PathVariable UUID id, @Valid @RequestBody UpdateUnitRequest request) {
        log.info("Atualizando unidade: {}", id);
        UnitDTO updatedUnit = unitService.updateUnitFromRequest(id, request);
        return ResponseEntity.ok(updatedUnit);
    }
    
    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Ativar/Desativar unidade", description = "Alterna o status ativo/inativo de uma unidade")
    public ResponseEntity<UnitDTO> toggleActive(@PathVariable UUID id) {
        log.info("Alternando status da unidade: {}", id);
        UnitDTO updatedUnit = unitService.toggleActiveAsDTO(id);
        return ResponseEntity.ok(updatedUnit);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir unidade", description = "Desativa uma unidade (soft delete)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Unidade excluída com sucesso"),
            @ApiResponse(responseCode = "404", description = "Unidade não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteUnit(@PathVariable UUID id) {
        log.info("Excluindo unidade: {}", id);
        unitService.deleteUnit(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/stats/count-active")
    @Operation(summary = "Contar unidades ativas", description = "Retorna o número total de unidades ativas")
    public ResponseEntity<Long> countActiveUnits() {
        log.debug("Contando unidades ativas");
        long count = unitService.findAllActiveAsDTO().size();
        return ResponseEntity.ok(count);
    }


} 