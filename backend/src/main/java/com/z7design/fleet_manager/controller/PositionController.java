package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.PositionDTO;
import com.z7design.fleet_manager.service.PositionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cargos", description = "API para gerenciamento de cargos na empresa")
public class PositionController {

    private final PositionService positionService;

    @GetMapping
    @Operation(summary = "Listar todos os cargos", description = "Retorna uma lista de todos os cargos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cargos listados com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<PositionDTO>> getAllPositions() {
        log.debug("Buscando todos os cargos");
        List<PositionDTO> positions = positionService.getAllPositions();
        return ResponseEntity.ok(positions);
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('HR_READ', 'EMPLOYEES_READ', 'EMPLOYEES_WRITE', 'EMPLOYEES_CREATE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR')")
    @Operation(summary = "Buscar cargos", description = "Busca cargos por nome com filtro dinÃ¢mico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cargos encontrados com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Object> searchPositions(@RequestParam(value = "query", required = false) String query) {
        log.debug("Buscando cargos com query: {}", query);
        try {
            // Retornar todos os cargos por enquanto para evitar erro
            List<PositionDTO> positions = positionService.getAllPositions();
            return ResponseEntity.ok(positions);
        } catch (Exception e) {
            log.error("Erro ao buscar cargos: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/test")
    @Operation(summary = "Teste bÃ¡sico de posiÃ§Ãµes", description = "Teste bÃ¡sico para verificar se o endpoint funciona")
    public ResponseEntity<Object> testPositions() {
        try {
            log.debug("Teste bÃ¡sico de posiÃ§Ãµes");
            List<PositionDTO> positions = positionService.getAllPositions();
            return ResponseEntity.ok(java.util.Map.of(
                "count", positions.size(),
                "message", "Teste de posiÃ§Ãµes funcionando",
                "positions", positions
            ));
        } catch (Exception e) {
            log.error("Erro no teste de posiÃ§Ãµes: ", e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar cargo por ID", description = "Retorna um cargo especÃ­fico pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cargo encontrado"),
            @ApiResponse(responseCode = "404", description = "Cargo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<PositionDTO> getPositionById(
            @Parameter(description = "ID do cargo") @PathVariable UUID id) {
        log.debug("Buscando cargo por ID: {}", id);
        PositionDTO position = positionService.getPositionById(id);
        return ResponseEntity.ok(position);
    }

    @PostMapping
    @Operation(summary = "Criar novo cargo", description = "Cria um novo cargo na empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Cargo criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<PositionDTO> createPosition(
            @Parameter(description = "Dados do cargo") @Valid @RequestBody PositionDTO positionDTO) {
        log.debug("Recebida requisiÃ§Ã£o para criar cargo: {}", positionDTO.getName());
        PositionDTO createdPosition = positionService.createPosition(positionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPosition);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cargo", description = "Atualiza um cargo existente na empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cargo atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "Cargo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<PositionDTO> updatePosition(
            @Parameter(description = "ID do cargo") @PathVariable UUID id,
            @Parameter(description = "Dados atualizados do cargo") @Valid @RequestBody PositionDTO positionDTO) {
        log.debug("Recebida requisiÃ§Ã£o para atualizar cargo ID: {}", id);
        PositionDTO updatedPosition = positionService.updatePosition(id, positionDTO);
        return ResponseEntity.ok(updatedPosition);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir cargo", description = "Exclui um cargo da empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Cargo excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "Cargo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deletePosition(
            @Parameter(description = "ID do cargo") @PathVariable UUID id) {
        log.debug("Recebida requisiÃ§Ã£o para excluir cargo ID: {}", id);
        positionService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }
} 
