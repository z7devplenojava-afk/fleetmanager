package br.com.fleetmanager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.OccurrenceService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.Occurrence;
import br.com.fleetmanager.model.OccurrenceType;
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
@RequestMapping("/api/occurrences")
@RequiredArgsConstructor
@Tag(name = "Ocorrências", description = "Endpoints para gestão de ocorrências de segurança.")
@SecurityRequirement(name = "bearerAuth")
public class OccurrenceController {
    
    private final OccurrenceService occurrenceService;
    
    @Operation(summary = "Cria uma nova ocorrência",
               description = "Adiciona uma nova ocorrência ao sistema. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ocorrência criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Occurrence.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da ocorrência para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Occurrence.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"occurrenceType\":\"INCIDENT\", \"description\":\"Incidente de segurança na portaria.\", \"occurrenceDate\":\"2024-06-20T10:30:00\", \"status\":\"REPORTED\"}")))
    @PostMapping
    public ResponseEntity<Occurrence> create(@RequestBody Occurrence occurrence) {
        return ResponseEntity.ok(occurrenceService.create(occurrence));
    }
    
    @Operation(summary = "Atualiza uma ocorrência existente",
               description = "Atualiza as informações de uma ocorrência pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ocorrência atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Occurrence.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Ocorrência não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da ocorrência para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Occurrence.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"description\":\"Incidente de segurança resolvido.\", \"status\":\"RESOLVED\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Occurrence> update(@PathVariable UUID id, @RequestBody Occurrence occurrence) {
        return ResponseEntity.ok(occurrenceService.update(id, occurrence));
    }
    
    @Operation(summary = "Exclui uma ocorrência",
               description = "Exclui uma ocorrência pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Ocorrência excluída com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Ocorrência não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        occurrenceService.delete(id);
        return ResponseEntity.ok().build();
    }
    
    @Operation(summary = "Busca uma ocorrência pelo ID",
               description = "Retorna as informações de uma ocorrência específica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for relacionado ao funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ocorrência encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Occurrence.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Ocorrência não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Occurrence> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(occurrenceService.findById(id));
    }
    
    @Operation(summary = "Busca ocorrências por ID de funcionário",
               description = "Retorna uma lista de ocorrências associadas a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de ocorrências do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Occurrence.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Occurrence>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(occurrenceService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca ocorrências por tipo",
               description = "Retorna uma lista de ocorrências de um tipo específico (ex: INCIDENT, ACCIDENT). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de ocorrências por tipo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Occurrence.class))),
            @ApiResponse(responseCode = "400", description = "Tipo de ocorrência inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Occurrence>> findByType(@PathVariable String type) {
        return ResponseEntity.ok(occurrenceService.findByType(OccurrenceType.valueOf(type.toUpperCase())));
    }
    
    @Operation(summary = "Busca ocorrências por status",
               description = "Retorna uma lista de ocorrências com um status específico (ex: REPORTED, IN_PROGRESS, RESOLVED). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de ocorrências por status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Occurrence.class))),
            @ApiResponse(responseCode = "400", description = "Status de ocorrência inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Occurrence>> findByStatus(@PathVariable String status) {
        return ResponseEntity.ok(occurrenceService.findByStatus(status));
    }
    
    @Operation(summary = "Retorna todas as ocorrências",
               description = "Retorna uma lista de todas as ocorrências cadastradas. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todas as ocorrências",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Occurrence.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<Occurrence>> findAll() {
        return ResponseEntity.ok(occurrenceService.findAll());
    }
} 