package br.com.fleetmanager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.fleetmanager.service.VacationService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.Vacation;
import br.com.fleetmanager.model.enums.VacationStatus;
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
@RequestMapping("/api/vacations")
@RequiredArgsConstructor
@Tag(name = "Férias", description = "Endpoints para gestão de solicitações de férias de funcionários.")
@SecurityRequirement(name = "bearerAuth")
public class VacationController {
    
    private final VacationService vacationService;
    
    @Operation(summary = "Cria uma nova solicitação de férias",
               description = "Adiciona uma nova solicitação de férias ao sistema. Requer o papel de ADMIN, GESTOR ou o próprio funcionário.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de férias criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitação de férias para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Vacation.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"startDate\":\"2024-08-01\", \"endDate\":\"2024-08-30\", \"status\":\"PENDING\"}")))
    @PostMapping
    public ResponseEntity<Vacation> create(@RequestBody Vacation vacation) {
        return ResponseEntity.ok(vacationService.create(vacation));
    }
    
    @Operation(summary = "Atualiza uma solicitação de férias existente",
               description = "Atualiza as informações de uma solicitação de férias pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de férias atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação de férias não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitação de férias para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Vacation.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"startDate\":\"2024-09-01\", \"endDate\":\"2024-09-20\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Vacation> update(@PathVariable UUID id, @RequestBody Vacation vacation) {
        return ResponseEntity.ok(vacationService.update(id, vacation));
    }
    
    @Operation(summary = "Aprova uma solicitação de férias",
               description = "Altera o status de uma solicitação de férias para APROVADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de férias aprovada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação de férias não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "ID do usuário que aprovou a solicitação", required = true)
    @PutMapping("/{id}/approve")
    public ResponseEntity<Vacation> approve(@PathVariable UUID id, @RequestParam UUID approvedBy) {
        return ResponseEntity.ok(vacationService.approve(id, approvedBy));
    }
    
    @Operation(summary = "Rejeita uma solicitação de férias",
               description = "Altera o status de uma solicitação de férias para REJEITADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de férias rejeitada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação de férias não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/reject")
    public ResponseEntity<Vacation> reject(@PathVariable UUID id) {
        return ResponseEntity.ok(vacationService.reject(id));
    }
    
    @Operation(summary = "Cancela uma solicitação de férias",
               description = "Altera o status de uma solicitação de férias para CANCELADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de férias cancelada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação de férias não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Vacation> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(vacationService.cancel(id));
    }
    
    @Operation(summary = "Exclui uma solicitação de férias",
               description = "Exclui uma solicitação de férias pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Solicitação de férias excluída com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação de férias não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        vacationService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca uma solicitação de férias pelo ID",
               description = "Retorna as informações de uma solicitação de férias específica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria solicitação).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de férias encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação de férias não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Vacation> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(vacationService.findById(id));
    }
    
    @Operation(summary = "Busca solicitações de férias por ID de funcionário",
               description = "Retorna uma lista de solicitações de férias associadas a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações de férias do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Vacation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Vacation>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(vacationService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca solicitações de férias por ID de funcionário e status",
               description = "Retorna uma lista de solicitações de férias de um funcionário com um status específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações de férias por funcionário e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "Status de férias inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Status da solicitação de férias (PENDING, APPROVED, REJECTED, CANCELLED)", required = true)
    @GetMapping("/employee/{employeeId}/status/{status}")
    public ResponseEntity<List<Vacation>> findByEmployeeIdAndStatus(
            @PathVariable UUID employeeId,
            @PathVariable VacationStatus status) {
        return ResponseEntity.ok(vacationService.findByEmployeeIdAndStatus(employeeId, status));
    }
    
    @Operation(summary = "Busca solicitações de férias por intervalo de datas de início",
               description = "Retorna uma lista de solicitações de férias cujo período de início cai dentro de um intervalo de datas especificado. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações de férias por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de início do período (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do período (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<Vacation>> findByStartDateBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(vacationService.findByStartDateBetween(startDate, endDate));
    }
    
    @Operation(summary = "Retorna todas as solicitações de férias",
               description = "Retorna uma lista de todas as solicitações de férias cadastradas. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todas as solicitações de férias",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Vacation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<Vacation>> findAll() {
        return ResponseEntity.ok(vacationService.findAll());
    }
} 