package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.PositionService;

import br.com.fleetmanager.dto.PositionDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
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

    @GetMapping("/{id}")
    @Operation(summary = "Buscar cargo por ID", description = "Retorna um cargo específico pelo ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cargo encontrado"),
            @ApiResponse(responseCode = "404", description = "Cargo não encontrado"),
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
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<PositionDTO> createPosition(
            @Parameter(description = "Dados do cargo") @Valid @RequestBody PositionDTO positionDTO) {
        log.debug("Recebida requisição para criar cargo: {}", positionDTO.getName());
        PositionDTO createdPosition = positionService.createPosition(positionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPosition);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cargo", description = "Atualiza um cargo existente na empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cargo atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Cargo não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<PositionDTO> updatePosition(
            @Parameter(description = "ID do cargo") @PathVariable UUID id,
            @Parameter(description = "Dados atualizados do cargo") @Valid @RequestBody PositionDTO positionDTO) {
        log.debug("Recebida requisição para atualizar cargo ID: {}", id);
        PositionDTO updatedPosition = positionService.updatePosition(id, positionDTO);
        return ResponseEntity.ok(updatedPosition);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir cargo", description = "Exclui um cargo da empresa")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Cargo excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Cargo não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> deletePosition(
            @Parameter(description = "ID do cargo") @PathVariable UUID id) {
        log.debug("Recebida requisição para excluir cargo ID: {}", id);
        positionService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }
} 