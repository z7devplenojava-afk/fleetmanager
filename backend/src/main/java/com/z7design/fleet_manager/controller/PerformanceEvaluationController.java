package com.z7design.fleet_manager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.model.PerformanceEvaluation;
import com.z7design.fleet_manager.model.enums.EvaluationStatus;
import com.z7design.fleet_manager.service.PerformanceEvaluationService;
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
@RequestMapping("/api/performance-evaluations")
@RequiredArgsConstructor
@Tag(name = "AvaliaÃ§Ãµes de Desempenho", description = "Endpoints para gestÃ£o de avaliaÃ§Ãµes de desempenho de funcionÃ¡rios.")
@SecurityRequirement(name = "bearerAuth")
public class PerformanceEvaluationController {
    
    private final PerformanceEvaluationService evaluationService;
    
    @Operation(summary = "Cria uma nova avaliaÃ§Ã£o de desempenho",
               description = "Adiciona uma nova avaliaÃ§Ã£o de desempenho ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "AvaliaÃ§Ã£o criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da avaliaÃ§Ã£o de desempenho para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = PerformanceEvaluation.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"evaluator\":{\"id\":\"UUID_DO_AVALIADOR\"}, \"evaluationDate\":\"2024-06-30\", \"score\":0.0, \"feedback\":\"Feedback inicial.\", \"status\":\"PENDING\"}")))
    @PostMapping
    public ResponseEntity<PerformanceEvaluation> create(@RequestBody PerformanceEvaluation evaluation) {
        return ResponseEntity.ok(evaluationService.create(evaluation));
    }
    
    @Operation(summary = "Atualiza uma avaliaÃ§Ã£o de desempenho existente",
               description = "Atualiza as informaÃ§Ãµes de uma avaliaÃ§Ã£o de desempenho pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "AvaliaÃ§Ã£o atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "AvaliaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da avaliaÃ§Ã£o de desempenho para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = PerformanceEvaluation.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"score\":8.5, \"feedback\":\"Feedback atualizado com melhorias.\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<PerformanceEvaluation> update(@PathVariable UUID id, @RequestBody PerformanceEvaluation evaluation) {
        return ResponseEntity.ok(evaluationService.update(id, evaluation));
    }
    
    @Operation(summary = "Inicia uma avaliaÃ§Ã£o de desempenho",
               description = "Altera o status de uma avaliaÃ§Ã£o para IN_PROGRESS. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "AvaliaÃ§Ã£o iniciada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "AvaliaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/start")
    public ResponseEntity<PerformanceEvaluation> startEvaluation(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.startEvaluation(id));
    }
    
    @Operation(summary = "Completa uma avaliaÃ§Ã£o de desempenho",
               description = "Altera o status de uma avaliaÃ§Ã£o para COMPLETED. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "AvaliaÃ§Ã£o completada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "AvaliaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/complete")
    public ResponseEntity<PerformanceEvaluation> completeEvaluation(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.completeEvaluation(id));
    }
    
    @Operation(summary = "Revisa uma avaliaÃ§Ã£o de desempenho",
               description = "Altera o status de uma avaliaÃ§Ã£o para UNDER_REVIEW. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "AvaliaÃ§Ã£o revisada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "AvaliaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/review")
    public ResponseEntity<PerformanceEvaluation> reviewEvaluation(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.reviewEvaluation(id));
    }
    
    @Operation(summary = "Aprova uma avaliaÃ§Ã£o de desempenho",
               description = "Altera o status de uma avaliaÃ§Ã£o para APPROVED. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "AvaliaÃ§Ã£o aprovada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "AvaliaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/approve")
    public ResponseEntity<PerformanceEvaluation> approveEvaluation(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.approveEvaluation(id));
    }
    
    @Operation(summary = "Busca uma avaliaÃ§Ã£o de desempenho pelo ID",
               description = "Retorna as informaÃ§Ãµes de uma avaliaÃ§Ã£o de desempenho especÃ­fica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria avaliaÃ§Ã£o).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "AvaliaÃ§Ã£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "AvaliaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<PerformanceEvaluation> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.findById(id));
    }
    
    @Operation(summary = "Busca avaliaÃ§Ãµes de desempenho por ID de funcionÃ¡rio",
               description = "Retorna uma lista de avaliaÃ§Ãµes de desempenho associadas a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliaÃ§Ãµes de desempenho do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PerformanceEvaluation>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(evaluationService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca avaliaÃ§Ãµes de desempenho por ID do avaliador",
               description = "Retorna uma lista de avaliaÃ§Ãµes de desempenho realizadas por um avaliador especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliaÃ§Ãµes de desempenho por avaliador",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/evaluator/{evaluatorId}")
    public ResponseEntity<List<PerformanceEvaluation>> findByEvaluatorId(@PathVariable UUID evaluatorId) {
        return ResponseEntity.ok(evaluationService.findByEvaluatorId(evaluatorId));
    }
    
    @Operation(summary = "Busca avaliaÃ§Ãµes de desempenho por ID de funcionÃ¡rio e status",
               description = "Retorna uma lista de avaliaÃ§Ãµes de desempenho de um funcionÃ¡rio com um status especÃ­fico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliaÃ§Ãµes de desempenho por funcionÃ¡rio e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Status de avaliaÃ§Ã£o invÃ¡lido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Status da avaliaÃ§Ã£o (PENDING, IN_PROGRESS, COMPLETED, UNDER_REVIEW, APPROVED)", required = true)
    @GetMapping("/employee/{employeeId}/status/{status}")
    public ResponseEntity<List<PerformanceEvaluation>> findByEmployeeIdAndStatus(
            @PathVariable UUID employeeId,
            @PathVariable EvaluationStatus status) {
        return ResponseEntity.ok(evaluationService.findByEmployeeIdAndStatus(employeeId, status));
    }
    
    @Operation(summary = "Busca avaliaÃ§Ãµes de desempenho por intervalo de datas de avaliaÃ§Ã£o",
               description = "Retorna uma lista de avaliaÃ§Ãµes de desempenho que foram realizadas dentro de um perÃ­odo especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliaÃ§Ãµes de desempenho por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de inÃ­cio do perÃ­odo (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do perÃ­odo (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<PerformanceEvaluation>> findByEvaluationDateBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(evaluationService.findByEvaluationDateBetween(startDate, endDate));
    }
} 
