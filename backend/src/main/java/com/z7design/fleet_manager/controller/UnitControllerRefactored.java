package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreateUnitRequest;
import com.z7design.fleet_manager.dto.UnitDTO;
import com.z7design.fleet_manager.dto.UpdateUnitRequest;
import com.z7design.fleet_manager.service.UnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/units")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Unidades V2", description = "API refatorada para gestÃ£o de unidades e centros de custo")
public class UnitControllerRefactored {
    
    private final UnitService unitService;
    
    @GetMapping
    @Operation(summary = "Listar unidades", description = "Retorna uma lista paginada de unidades")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de unidades retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<UnitDTO>> getAllUnits(
            @PageableDefault(size = 20) Pageable pageable,
            @Parameter(description = "Filtro por nome") @RequestParam(value = "name", required = false) String name,
            @Parameter(description = "Filtro por status ativo") @RequestParam(value = "active", required = false) Boolean active,
            @Parameter(description = "Filtro por cliente") @RequestParam(value = "clientId", required = false) UUID clientId,
            @Parameter(description = "Filtro por unidade pai") @RequestParam(value = "parentId", required = false) UUID parentId) {
        
        log.debug("Buscando unidades com filtros - page: {}, name: {}, active: {}", 
                 pageable.getPageNumber(), name, active);
        
        Page<UnitDTO> units = unitService.findByFilters(name, active, clientId, parentId, pageable);
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/active")
    @Operation(summary = "Listar unidades ativas", description = "Retorna uma lista de todas as unidades ativas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de unidades ativas retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<UnitDTO>> getAllActiveUnits() {
        log.debug("Buscando unidades ativas");
        List<UnitDTO> units = unitService.findAllActiveAsDTO();
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar unidade por ID", description = "Retorna uma unidade especÃ­fica pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unidade encontrada"),
            @ApiResponse(responseCode = "404", description = "Unidade nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UnitDTO> getUnitById(
            @Parameter(description = "ID da unidade") @PathVariable("id") UUID id) {
        log.debug("Buscando unidade por ID: {}", id);
        UnitDTO unit = unitService.findByIdAsDTO(id);
        return ResponseEntity.ok(unit);
    }
    
    @PostMapping
    @Operation(summary = "Criar nova unidade", description = "Cria uma nova unidade/centro de custo")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Unidade criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "409", description = "Conflito - nome, cÃ³digo ou email jÃ¡ existem"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UnitDTO> createUnit(
            @Parameter(description = "Dados da nova unidade") @Valid @RequestBody CreateUnitRequest request) {
        log.info("Criando nova unidade: {}", request.getName());
        UnitDTO createdUnit = unitService.createUnitFromRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUnit);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar unidade", description = "Atualiza uma unidade existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unidade atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "Unidade nÃ£o encontrada"),
            @ApiResponse(responseCode = "409", description = "Conflito - nome, cÃ³digo ou email jÃ¡ existem"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UnitDTO> updateUnit(
            @Parameter(description = "ID da unidade") @PathVariable("id") UUID id,
            @Parameter(description = "Dados atualizados da unidade") @Valid @RequestBody UpdateUnitRequest request) {
        log.info("Atualizando unidade ID: {}", id);
        UnitDTO updatedUnit = unitService.updateUnitFromRequest(id, request);
        return ResponseEntity.ok(updatedUnit);
    }
    
    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Ativar/Desativar unidade", description = "Alterna o status ativo/inativo de uma unidade")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status alterado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Unidade nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<UnitDTO> toggleUnitStatus(
            @Parameter(description = "ID da unidade") @PathVariable("id") UUID id) {
        log.info("Alternando status da unidade ID: {}", id);
        
        UnitDTO updatedUnit = unitService.toggleActiveAsDTO(id);
        return ResponseEntity.ok(updatedUnit);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir unidade", description = "Exclui uma unidade do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Unidade excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "404", description = "Unidade nÃ£o encontrada"),
            @ApiResponse(responseCode = "409", description = "Conflito - unidade possui dependÃªncias"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deleteUnit(
            @Parameter(description = "ID da unidade") @PathVariable("id") UUID id) {
        log.info("Excluindo unidade ID: {}", id);
        unitService.deleteUnit(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/stats/count-active")
    @Operation(summary = "Contar unidades ativas", description = "Retorna o nÃºmero total de unidades ativas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contagem retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Long> countActiveUnits() {
        log.debug("Contando unidades ativas");
        long count = unitService.findAllActiveAsDTO().size();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar unidades", description = "Busca unidades por termo de pesquisa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resultados da busca retornados com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<UnitDTO>> searchUnits(
            @Parameter(description = "Termo de busca") @RequestParam(value = "searchTerm") String searchTerm,
            @Parameter(description = "Buscar apenas unidades ativas") @RequestParam(value = "activeOnly", defaultValue = "false") boolean activeOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.debug("Buscando unidades com termo: {} (apenas ativas: {})", searchTerm, activeOnly);
        
        Page<UnitDTO> units = unitService.findByFilters(
                searchTerm, 
                activeOnly ? true : null, 
                null, 
                null, 
                pageable
        );
        
        return ResponseEntity.ok(units);
    }
    
    @GetMapping("/hierarchy/roots")
    @Operation(summary = "Listar unidades raiz", description = "Retorna unidades que nÃ£o possuem unidade pai")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unidades raiz retornadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<UnitDTO>> getRootUnits(
            @Parameter(description = "Buscar apenas unidades ativas") @RequestParam(value = "activeOnly", defaultValue = "true") boolean activeOnly) {
        
        log.debug("Buscando unidades raiz (apenas ativas: {})", activeOnly);
        
        // Como nÃ£o temos mÃ©todo especÃ­fico no service, vamos usar o filtro
        Page<UnitDTO> units = unitService.findByFilters(null, activeOnly ? true : null, null, null, Pageable.unpaged());
        
        // Filtrar apenas as que nÃ£o tÃªm pai
        List<UnitDTO> rootUnits = units.getContent().stream()
                .filter(unit -> unit.getParentId() == null)
                .toList();
        
        return ResponseEntity.ok(rootUnits);
    }
    
    @GetMapping("/{id}/children")
    @Operation(summary = "Listar unidades filhas", description = "Retorna as unidades filhas de uma unidade especÃ­fica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unidades filhas retornadas com sucesso"),
            @ApiResponse(responseCode = "404", description = "Unidade pai nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<UnitDTO>> getChildrenUnits(
            @Parameter(description = "ID da unidade pai") @PathVariable("id") UUID id,
            @Parameter(description = "Buscar apenas unidades ativas") @RequestParam(value = "activeOnly", defaultValue = "true") boolean activeOnly) {
        
        log.debug("Buscando unidades filhas da unidade ID: {} (apenas ativas: {})", id, activeOnly);
        
        // Verificar se a unidade pai existe
        unitService.findByIdAsDTO(id);
        
        // Buscar filhas
        Page<UnitDTO> units = unitService.findByFilters(null, activeOnly ? true : null, null, id, Pageable.unpaged());
        
        return ResponseEntity.ok(units.getContent());
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Listar unidades por cliente", description = "Retorna unidades associadas a um cliente especÃ­fico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unidades do cliente retornadas com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<UnitDTO>> getUnitsByClient(
            @Parameter(description = "ID do cliente") @PathVariable("clientId") UUID clientId,
            @Parameter(description = "Buscar apenas unidades ativas") @RequestParam(value = "activeOnly", defaultValue = "true") boolean activeOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.debug("Buscando unidades do cliente ID: {} (apenas ativas: {})", clientId, activeOnly);
        
        Page<UnitDTO> units = unitService.findByFilters(null, activeOnly ? true : null, clientId, null, pageable);
        
        return ResponseEntity.ok(units);
    }
}
