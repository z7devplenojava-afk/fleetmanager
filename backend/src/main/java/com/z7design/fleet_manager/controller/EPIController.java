package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.model.EPI;
import com.z7design.fleet_manager.model.EPIStatus;
import com.z7design.fleet_manager.service.EPIService;
import com.z7design.fleet_manager.dto.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/epis")
@RequiredArgsConstructor
@Tag(name = "EPIs", description = "Endpoints para gestÃ£o de Equipamentos de ProteÃ§Ã£o Individual (EPIs).")
@SecurityRequirement(name = "bearerAuth")
public class EPIController {
    
    private final EPIService epiService;
    
    @Operation(summary = "Cria um novo EPI",
               description = "Adiciona um novo EPI ao sistema. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "EPI criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do EPI para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = EPI.class),
                    examples = @ExampleObject(value = "{\"name\": \"Capacete de SeguranÃ§a\", \"description\": \"Capacete de proteÃ§Ã£o\", \"issueDate\": \"2023-01-01\", \"dueDate\": \"2024-12-31\", \"status\": \"ACTIVE\", \"employee\": {\"id\": \"UUID_DO_FUNCIONARIO\"}, \"position\": {\"id\": \"UUID_DA_POSICAO\"}}")))
    @PostMapping
    public ResponseEntity<EPI> create(@RequestBody EPI epi) {
        return ResponseEntity.ok(epiService.create(epi));
    }
    
    @Operation(summary = "Atualiza um EPI existente",
               description = "Atualiza as informaÃ§Ãµes de um EPI pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "EPI atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "EPI nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do EPI para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = EPI.class),
                    examples = @ExampleObject(value = "{\"id\": \"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"name\": \"Capacete de SeguranÃ§a Atualizado\", \"description\": \"Capacete de proteÃ§Ã£o com ajuste\", \"issueDate\": \"2023-01-01\", \"dueDate\": \"2025-12-31\", \"status\": \"EXPIRED\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<EPI> update(@PathVariable("id") UUID id, @RequestBody EPI epi) {
        return ResponseEntity.ok(epiService.update(id, epi));
    }
    
    @Operation(summary = "Exclui um EPI",
               description = "Exclui um EPI pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "EPI excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "EPI nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        epiService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca um EPI pelo ID",
               description = "Retorna as informaÃ§Ãµes de um EPI especÃ­fico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "EPI encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "EPI nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<EPI> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(epiService.findById(id));
    }
    
    @Operation(summary = "Busca EPIs por ID de funcionÃ¡rio",
               description = "Retorna uma lista de EPIs associados a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de EPIs do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EPI>> findByEmployeeId(@PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(epiService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca EPIs por ID de posiÃ§Ã£o",
               description = "Retorna uma lista de EPIs associados a uma posiÃ§Ã£o especÃ­fica. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de EPIs da posiÃ§Ã£o",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/position/{positionId}")
    public ResponseEntity<List<EPI>> findByPositionId(@PathVariable("positionId") UUID positionId) {
        return ResponseEntity.ok(epiService.findByPositionId(positionId));
    }
    
    @Operation(summary = "Busca EPIs por status",
               description = "Retorna uma lista de EPIs com um status especÃ­fico (ex: ACTIVE, EXPIRED). Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de EPIs por status",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<List<EPI>> findByStatus(@PathVariable("status") EPIStatus status) {
        return ResponseEntity.ok(epiService.findByStatus(status));
    }
    
    @Operation(summary = "Busca EPIs prÃ³ximos da expiraÃ§Ã£o",
               description = "Retorna uma lista de EPIs cuja data de validade estÃ¡ prÃ³xima. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de EPIs prÃ³ximos da expiraÃ§Ã£o",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/expiring")
    public ResponseEntity<List<EPI>> findExpiringEPIs() {
        return ResponseEntity.ok(epiService.findExpiringEPIs());
    }
    
    @Operation(summary = "Retorna todos os EPIs",
               description = "Retorna uma lista de todos os EPIs cadastrados. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todos os EPIs",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<EPI>> findAll() {
        return ResponseEntity.ok(epiService.findAll());
    }
} 
