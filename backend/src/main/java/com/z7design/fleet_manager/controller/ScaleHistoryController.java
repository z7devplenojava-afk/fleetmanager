package com.z7design.fleet_manager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.model.ScaleHistory;
import com.z7design.fleet_manager.service.ScaleHistoryService;
import com.z7design.fleet_manager.dto.ErrorResponse;

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
@Tag(name = "HistÃ³rico de Escalas", description = "Endpoints para gestÃ£o do histÃ³rico de escalas de trabalho dos funcionÃ¡rios.")
@SecurityRequirement(name = "bearerAuth")
public class ScaleHistoryController {
    
    private final ScaleHistoryService scaleHistoryService;
    
    @Operation(summary = "Cria um novo registro de histÃ³rico de escala",
               description = "Adiciona um novo registro de histÃ³rico de escala ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico de escala criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do histÃ³rico de escala para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = ScaleHistory.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"scale\":{\"id\":\"UUID_DA_ESCALA\"}, \"date\":\"2024-06-20\", \"notes\":\"MudanÃ§a de escala devido a feriado.\", \"shift\":\"NIGHT\", \"status\":\"ACTIVE\"}")))
    @PostMapping
    public ResponseEntity<ScaleHistory> create(@RequestBody ScaleHistory scaleHistory) {
        return ResponseEntity.ok(scaleHistoryService.create(scaleHistory));
    }
    
    @Operation(summary = "Atualiza um registro de histÃ³rico de escala existente",
               description = "Atualiza as informaÃ§Ãµes de um registro de histÃ³rico de escala pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico de escala atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "HistÃ³rico de escala nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do histÃ³rico de escala para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = ScaleHistory.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"notes\":\"MudanÃ§a de escala ajustada.\", \"status\":\"INACTIVE\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<ScaleHistory> update(@PathVariable("id") UUID id, @RequestBody ScaleHistory scaleHistory) {
        return ResponseEntity.ok(scaleHistoryService.update(id, scaleHistory));
    }
    
    @Operation(summary = "Exclui um registro de histÃ³rico de escala",
               description = "Exclui um registro de histÃ³rico de escala pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "HistÃ³rico de escala excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "HistÃ³rico de escala nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        scaleHistoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca um registro de histÃ³rico de escala pelo ID",
               description = "Retorna as informaÃ§Ãµes de um registro de histÃ³rico de escala especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "HistÃ³rico de escala encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "HistÃ³rico de escala nÃ£o encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<ScaleHistory> findById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(scaleHistoryService.findById(id));
    }
    
    @Operation(summary = "Busca registros de histÃ³rico de escala por ID de funcionÃ¡rio",
               description = "Retorna uma lista de registros de histÃ³rico de escala associados a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de histÃ³ricos de escala do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<ScaleHistory>> findByEmployeeId(@PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(scaleHistoryService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca registros de histÃ³rico de escala por intervalo de datas",
               description = "Retorna uma lista de registros de histÃ³rico de escala que caem dentro de um perÃ­odo especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de histÃ³ricos de escala por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de inÃ­cio do perÃ­odo (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do perÃ­odo (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<ScaleHistory>> findByDateRange(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(scaleHistoryService.findByDateRange(startDate, endDate));
    }
    
    @Operation(summary = "Busca registros de histÃ³rico de escala por ID de funcionÃ¡rio e intervalo de datas",
               description = "Retorna uma lista de registros de histÃ³rico de escala de um funcionÃ¡rio dentro de um perÃ­odo especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de histÃ³ricos de escala do funcionÃ¡rio por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "ID do funcionÃ¡rio para filtrar o histÃ³rico de escala", required = true)
    @Parameter(description = "Data de inÃ­cio do perÃ­odo (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do perÃ­odo (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/employee/{employeeId}/date-range")
    public ResponseEntity<List<ScaleHistory>> findByEmployeeIdAndDateRange(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(scaleHistoryService.findByEmployeeIdAndDateRange(employeeId, startDate, endDate));
    }
    
    @Operation(summary = "Retorna todos os registros de histÃ³rico de escala",
               description = "Retorna uma lista de todos os registros de histÃ³rico de escala cadastrados. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todos os histÃ³ricos de escala",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = ScaleHistory.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<ScaleHistory>> findAll() {
        return ResponseEntity.ok(scaleHistoryService.findAll());
    }
} 
