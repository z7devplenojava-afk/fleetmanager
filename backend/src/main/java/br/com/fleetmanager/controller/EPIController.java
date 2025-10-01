package br.com.fleetmanager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.EPIService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.EPI;
import br.com.fleetmanager.model.EPIStatus;
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
@Tag(name = "EPIs", description = "Endpoints para gestão de Equipamentos de Proteção Individual (EPIs).")
@SecurityRequirement(name = "bearerAuth")
public class EPIController {
    
    private final EPIService epiService;
    
    @Operation(summary = "Cria um novo EPI",
               description = "Adiciona um novo EPI ao sistema. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "EPI criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do EPI para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = EPI.class),
                    examples = @ExampleObject(value = "{\"name\": \"Capacete de Segurança\", \"description\": \"Capacete de proteção\", \"issueDate\": \"2023-01-01\", \"dueDate\": \"2024-12-31\", \"status\": \"ACTIVE\", \"employee\": {\"id\": \"UUID_DO_FUNCIONARIO\"}, \"position\": {\"id\": \"UUID_DA_POSICAO\"}}")))
    @PostMapping
    public ResponseEntity<EPI> create(@RequestBody EPI epi) {
        return ResponseEntity.ok(epiService.create(epi));
    }
    
    @Operation(summary = "Atualiza um EPI existente",
               description = "Atualiza as informações de um EPI pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "EPI atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "EPI não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do EPI para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = EPI.class),
                    examples = @ExampleObject(value = "{\"id\": \"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"name\": \"Capacete de Segurança Atualizado\", \"description\": \"Capacete de proteção com ajuste\", \"issueDate\": \"2023-01-01\", \"dueDate\": \"2025-12-31\", \"status\": \"EXPIRED\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<EPI> update(@PathVariable UUID id, @RequestBody EPI epi) {
        return ResponseEntity.ok(epiService.update(id, epi));
    }
    
    @Operation(summary = "Exclui um EPI",
               description = "Exclui um EPI pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "EPI excluído com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "EPI não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        epiService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca um EPI pelo ID",
               description = "Retorna as informações de um EPI específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "EPI encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "EPI não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<EPI> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(epiService.findById(id));
    }
    
    @Operation(summary = "Busca EPIs por ID de funcionário",
               description = "Retorna uma lista de EPIs associados a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de EPIs do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EPI>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(epiService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca EPIs por ID de posição",
               description = "Retorna uma lista de EPIs associados a uma posição específica. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de EPIs da posição",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/position/{positionId}")
    public ResponseEntity<List<EPI>> findByPositionId(@PathVariable UUID positionId) {
        return ResponseEntity.ok(epiService.findByPositionId(positionId));
    }
    
    @Operation(summary = "Busca EPIs por status",
               description = "Retorna uma lista de EPIs com um status específico (ex: ACTIVE, EXPIRED). Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de EPIs por status",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EPI.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<List<EPI>> findByStatus(@PathVariable EPIStatus status) {
        return ResponseEntity.ok(epiService.findByStatus(status));
    }
    
    @Operation(summary = "Busca EPIs próximos da expiração",
               description = "Retorna uma lista de EPIs cuja data de validade está próxima. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de EPIs próximos da expiração",
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