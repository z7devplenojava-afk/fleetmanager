package com.z7design.fleet_manager.controller;

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

import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.service.UnitService;
import com.z7design.fleet_manager.dto.UnitDTO;
import com.z7design.fleet_manager.dto.CreateUnitRequest;
import com.z7design.fleet_manager.dto.UpdateUnitRequest;

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
@Tag(name = "Unidades/Centros de Custo", description = "Endpoints para gestÃ£o de unidades e centros de custo")
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
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de unidades ativas retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<UnitDTO>> getAllActive() {
        log.debug("Buscando unidades ativas");
        List<UnitDTO> units = unitService.findAllActiveAsDTO();
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_READ','ADMIN','SUPER_ADMIN','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    @Operation(summary = "Buscar unidade por ID", description = "Retorna uma unidade especÃ­fica pelo ID")
    public ResponseEntity<UnitDTO> getById(@PathVariable("id") UUID id) {
        log.debug("Buscando unidade por ID: {}", id);
        UnitDTO unit = unitService.findByIdAsDTO(id);
        return ResponseEntity.ok(unit);
    }
    
    @GetMapping("/code/{code}")
    @Operation(summary = "Buscar unidade por cÃ³digo", description = "Retorna uma unidade especÃ­fica pelo cÃ³digo")
    public ResponseEntity<UnitDTO> getByCode(@PathVariable("code") String code) {
        log.debug("Buscando unidade por cÃ³digo: {}", code);
        UnitDTO unit = unitService.findByCodeAsDTO(code);
        return ResponseEntity.ok(unit);
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('HR_READ','ADMIN','SUPER_ADMIN','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    @Operation(summary = "Buscar unidades por nome", description = "Retorna unidades que contenham o nome especificado")
    public ResponseEntity<List<UnitDTO>> searchByName(
            @Parameter(description = "Nome para busca") @RequestParam(value = "name") String name) {
        log.debug("Buscando unidades por nome: {}", name);
        List<UnitDTO> units = unitService.findByNameContainingAsDTO(name);
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/search/active")
    @Operation(summary = "Buscar unidades ativas por nome", description = "Retorna unidades ativas que contenham o nome especificado")
    public ResponseEntity<List<UnitDTO>> searchActiveByName(
            @Parameter(description = "Nome para busca") @RequestParam(value = "name") String name) {
        log.debug("Buscando unidades ativas por nome: {}", name);
        List<UnitDTO> units = unitService.findActiveByNameContainingAsDTO(name);
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/root")
    @Operation(summary = "Listar unidades raiz", description = "Retorna unidades que nÃ£o possuem unidade pai")
    public ResponseEntity<List<UnitDTO>> getRootUnits() {
        log.debug("Buscando unidades raiz");
        List<UnitDTO> units = unitService.findRootUnitsAsDTO();
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/root/active")
    @Operation(summary = "Listar unidades raiz ativas", description = "Retorna unidades raiz que estÃ£o ativas")
    public ResponseEntity<List<UnitDTO>> getActiveRootUnits() {
        log.debug("Buscando unidades raiz ativas");
        List<UnitDTO> units = unitService.findActiveRootUnitsAsDTO();
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/{id}/children")
    @Operation(summary = "Listar unidades filhas", description = "Retorna as unidades filhas de uma unidade especÃ­fica")
    public ResponseEntity<List<UnitDTO>> getChildren(@PathVariable("id") UUID id) {
        log.debug("Buscando unidades filhas de: {}", id);
        List<UnitDTO> units = unitService.findChildrenAsDTO(id);
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Listar unidades por cliente", description = "Retorna unidades associadas a um cliente especÃ­fico")
    public ResponseEntity<List<UnitDTO>> getByClientId(@PathVariable("clientId") String clientId) {
        log.debug("Buscando unidades do cliente: {}", clientId);
        List<UnitDTO> units = unitService.findByClientIdAsDTO(UUID.fromString(clientId));
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/client/{clientId}/active")
    @Operation(summary = "Listar unidades ativas por cliente", description = "Retorna unidades ativas associadas a um cliente especÃ­fico")
    public ResponseEntity<List<UnitDTO>> getActiveByClientId(@PathVariable("clientId") String clientId) {
        log.debug("Buscando unidades ativas do cliente: {}", clientId);
        List<UnitDTO> units = unitService.findActiveByClientIdAsDTO(UUID.fromString(clientId));
        return ResponseEntity.ok(units);
    }
    
    @PostMapping
    @PreAuthorize("hasAnyAuthority('HR_WRITE','ADMIN','SUPER_ADMIN','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    @Operation(summary = "Criar nova unidade", description = "Cria uma nova unidade/centro de custo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Unidade criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UnitDTO> createUnit(@Valid @RequestBody CreateUnitRequest request) {
        try {
            log.info("Criando nova unidade: {}", request.getName());
            UnitDTO createdUnit = unitService.createUnitFromRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUnit);
        } catch (Exception e) {
            log.error("Erro ao criar unidade: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_WRITE','ADMIN','SUPER_ADMIN','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    @Operation(summary = "Atualizar unidade", description = "Atualiza uma unidade existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unidade atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "Unidade nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UnitDTO> updateUnit(@PathVariable("id") UUID id, @Valid @RequestBody UpdateUnitRequest request) {
        log.info("Atualizando unidade: {}", id);
        UnitDTO updatedUnit = unitService.updateUnitFromRequest(id, request);
        return ResponseEntity.ok(updatedUnit);
    }
    
    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Ativar/Desativar unidade", description = "Alterna o status ativo/inativo de uma unidade")
    public ResponseEntity<UnitDTO> toggleActive(@PathVariable("id") UUID id) {
        log.info("Alternando status da unidade: {}", id);
        UnitDTO updatedUnit = unitService.toggleActiveAsDTO(id);
        return ResponseEntity.ok(updatedUnit);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('HR_DELETE','ADMIN','SUPER_ADMIN','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    @Operation(summary = "Excluir unidade", description = "Desativa uma unidade (soft delete)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Unidade excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "404", description = "Unidade nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteUnit(@PathVariable("id") UUID id) {
        log.info("Excluindo unidade: {}", id);
        unitService.deleteUnit(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{id}/with-dependencies")
    @PreAuthorize("hasAnyAuthority('HR_DELETE','ADMIN','SUPER_ADMIN','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    @Operation(summary = "Excluir unidade com dependÃªncias", description = "Exclui uma unidade e todas as suas dependÃªncias (funcionÃ¡rios, subunidades, etc)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Unidade e dependÃªncias excluÃ­das com sucesso"),
            @ApiResponse(responseCode = "404", description = "Unidade nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteUnitWithDependencies(@PathVariable("id") UUID id) {
        log.warn("Excluindo unidade {} com todas as dependÃªncias", id);
        unitService.deleteUnitWithDependencies(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{id}/can-delete")
    @PreAuthorize("hasAnyAuthority('HR_READ','ADMIN','SUPER_ADMIN','ROLE_ADMIN','ROLE_SUPER_ADMIN')")
    @Operation(summary = "Verificar possibilidade de exclusÃ£o", description = "Verifica se uma unidade pode ser excluÃ­da verificando suas dependÃªncias")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "VerificaÃ§Ã£o realizada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Unidade nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Map<String, Object>> checkDeletePossibility(@PathVariable("id") UUID id) {
        log.debug("Verificando possibilidade de exclusÃ£o da unidade: {}", id);
        Map<String, Object> result = unitService.checkDeletePossibility(id);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/stats/count-active")
    @Operation(summary = "Contar unidades ativas", description = "Retorna o nÃºmero total de unidades ativas")
    public ResponseEntity<Long> countActiveUnits() {
        log.debug("Contando unidades ativas");
        long count = unitService.findAllActiveAsDTO().size();
        return ResponseEntity.ok(count);
    }


} 
