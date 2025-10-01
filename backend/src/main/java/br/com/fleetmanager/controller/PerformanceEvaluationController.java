package br.com.fleetmanager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.PerformanceEvaluationService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.PerformanceEvaluation;
import br.com.fleetmanager.model.enums.EvaluationStatus;
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
@Tag(name = "Avaliações de Desempenho", description = "Endpoints para gestão de avaliações de desempenho de funcionários.")
@SecurityRequirement(name = "bearerAuth")
public class PerformanceEvaluationController {
    
    private final PerformanceEvaluationService evaluationService;
    
    @Operation(summary = "Cria uma nova avaliação de desempenho",
               description = "Adiciona uma nova avaliação de desempenho ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da avaliação de desempenho para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = PerformanceEvaluation.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"evaluator\":{\"id\":\"UUID_DO_AVALIADOR\"}, \"evaluationDate\":\"2024-06-30\", \"score\":0.0, \"feedback\":\"Feedback inicial.\", \"status\":\"PENDING\"}")))
    @PostMapping
    public ResponseEntity<PerformanceEvaluation> create(@RequestBody PerformanceEvaluation evaluation) {
        return ResponseEntity.ok(evaluationService.create(evaluation));
    }
    
    @Operation(summary = "Atualiza uma avaliação de desempenho existente",
               description = "Atualiza as informações de uma avaliação de desempenho pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da avaliação de desempenho para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = PerformanceEvaluation.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"score\":8.5, \"feedback\":\"Feedback atualizado com melhorias.\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<PerformanceEvaluation> update(@PathVariable UUID id, @RequestBody PerformanceEvaluation evaluation) {
        return ResponseEntity.ok(evaluationService.update(id, evaluation));
    }
    
    @Operation(summary = "Inicia uma avaliação de desempenho",
               description = "Altera o status de uma avaliação para IN_PROGRESS. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação iniciada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/start")
    public ResponseEntity<PerformanceEvaluation> startEvaluation(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.startEvaluation(id));
    }
    
    @Operation(summary = "Completa uma avaliação de desempenho",
               description = "Altera o status de uma avaliação para COMPLETED. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação completada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/complete")
    public ResponseEntity<PerformanceEvaluation> completeEvaluation(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.completeEvaluation(id));
    }
    
    @Operation(summary = "Revisa uma avaliação de desempenho",
               description = "Altera o status de uma avaliação para UNDER_REVIEW. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação revisada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/review")
    public ResponseEntity<PerformanceEvaluation> reviewEvaluation(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.reviewEvaluation(id));
    }
    
    @Operation(summary = "Aprova uma avaliação de desempenho",
               description = "Altera o status de uma avaliação para APPROVED. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação aprovada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/approve")
    public ResponseEntity<PerformanceEvaluation> approveEvaluation(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.approveEvaluation(id));
    }
    
    @Operation(summary = "Busca uma avaliação de desempenho pelo ID",
               description = "Retorna as informações de uma avaliação de desempenho específica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria avaliação).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Avaliação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<PerformanceEvaluation> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(evaluationService.findById(id));
    }
    
    @Operation(summary = "Busca avaliações de desempenho por ID de funcionário",
               description = "Retorna uma lista de avaliações de desempenho associadas a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliações de desempenho do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PerformanceEvaluation>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(evaluationService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca avaliações de desempenho por ID do avaliador",
               description = "Retorna uma lista de avaliações de desempenho realizadas por um avaliador específico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliações de desempenho por avaliador",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/evaluator/{evaluatorId}")
    public ResponseEntity<List<PerformanceEvaluation>> findByEvaluatorId(@PathVariable UUID evaluatorId) {
        return ResponseEntity.ok(evaluationService.findByEvaluatorId(evaluatorId));
    }
    
    @Operation(summary = "Busca avaliações de desempenho por ID de funcionário e status",
               description = "Retorna uma lista de avaliações de desempenho de um funcionário com um status específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliações de desempenho por funcionário e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Status de avaliação inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Status da avaliação (PENDING, IN_PROGRESS, COMPLETED, UNDER_REVIEW, APPROVED)", required = true)
    @GetMapping("/employee/{employeeId}/status/{status}")
    public ResponseEntity<List<PerformanceEvaluation>> findByEmployeeIdAndStatus(
            @PathVariable UUID employeeId,
            @PathVariable EvaluationStatus status) {
        return ResponseEntity.ok(evaluationService.findByEmployeeIdAndStatus(employeeId, status));
    }
    
    @Operation(summary = "Busca avaliações de desempenho por intervalo de datas de avaliação",
               description = "Retorna uma lista de avaliações de desempenho que foram realizadas dentro de um período específico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de avaliações de desempenho por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = PerformanceEvaluation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de início do período (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do período (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<PerformanceEvaluation>> findByEvaluationDateBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(evaluationService.findByEvaluationDateBetween(startDate, endDate));
    }
} 