package br.com.fleetmanager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.ScaleHistoryService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.ScaleHistory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Parameter;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/scale-histories")
@RequiredArgsConstructor
@Tag(name = "Histórico de Escalas", description = "Endpoints para gestão do histórico de escalas de trabalho dos funcionários.")
@SecurityRequirement(name = "bearerAuth")
public class ScaleHistoryController {
    
    private final ScaleHistoryService scaleHistoryService;
    
    @Operation(summary = "Cria um novo registro de histórico de escala",
               description = "Adiciona um novo registro de histórico de escala ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico de escala criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do histórico de escala para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = ScaleHistory.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"scale\":{\"id\":\"UUID_DA_ESCALA\"}, \"date\":\"2024-06-20\", \"notes\":\"Mudança de escala devido a feriado.\", \"shift\":\"NIGHT\", \"status\":\"ACTIVE\"}")))
    @PostMapping
    public ResponseEntity<ScaleHistory> create(@RequestBody ScaleHistory scaleHistory) {
        return ResponseEntity.ok(scaleHistoryService.create(scaleHistory));
    }
    
    @Operation(summary = "Atualiza um registro de histórico de escala existente",
               description = "Atualiza as informações de um registro de histórico de escala pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico de escala atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Histórico de escala não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do histórico de escala para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = ScaleHistory.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"notes\":\"Mudança de escala ajustada.\", \"status\":\"INACTIVE\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<ScaleHistory> update(@PathVariable UUID id, @RequestBody ScaleHistory scaleHistory) {
        return ResponseEntity.ok(scaleHistoryService.update(id, scaleHistory));
    }
    
    @Operation(summary = "Exclui um registro de histórico de escala",
               description = "Exclui um registro de histórico de escala pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Histórico de escala excluído com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Histórico de escala não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        scaleHistoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca um registro de histórico de escala pelo ID",
               description = "Retorna as informações de um registro de histórico de escala específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico de escala encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Histórico de escala não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ScaleHistory> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(scaleHistoryService.findById(id));
    }
    
    @Operation(summary = "Busca registros de histórico de escala por ID de funcionário",
               description = "Retorna uma lista de registros de histórico de escala associados a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de históricos de escala do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<ScaleHistory>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(scaleHistoryService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca registros de histórico de escala por intervalo de datas",
               description = "Retorna uma lista de registros de histórico de escala que caem dentro de um período específico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de históricos de escala por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de início do período (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do período (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<ScaleHistory>> findByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(scaleHistoryService.findByDateRange(startDate, endDate));
    }
    
    @Operation(summary = "Busca registros de histórico de escala por ID de funcionário e intervalo de datas",
               description = "Retorna uma lista de registros de histórico de escala de um funcionário dentro de um período específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de históricos de escala do funcionário por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "ID do funcionário para filtrar o histórico de escala", required = true)
    @Parameter(description = "Data de início do período (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do período (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/employee/{employeeId}/date-range")
    public ResponseEntity<List<ScaleHistory>> findByEmployeeIdAndDateRange(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(scaleHistoryService.findByEmployeeIdAndDateRange(employeeId, startDate, endDate));
    }
    
    @Operation(summary = "Retorna todos os registros de histórico de escala",
               description = "Retorna uma lista de todos os registros de histórico de escala cadastrados. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todos os históricos de escala",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<ScaleHistory>> findAll() {
        return ResponseEntity.ok(scaleHistoryService.findAll());
    }
} 