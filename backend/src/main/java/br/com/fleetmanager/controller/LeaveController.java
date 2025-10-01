package br.com.fleetmanager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.fleetmanager.service.LeaveService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.Leave;
import br.com.fleetmanager.model.enums.LeaveStatus;
import br.com.fleetmanager.model.enums.LeaveType;
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
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@Tag(name = "Férias e Ausências", description = "Endpoints para gestão de solicitações de férias e ausências.")
@SecurityRequirement(name = "bearerAuth")
public class LeaveController {
    
    private final LeaveService leaveService;
    
    @Operation(summary = "Cria uma nova solicitação de férias/ausência",
               description = "Adiciona uma nova solicitação de férias ou ausência. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitação de férias/ausência",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Leave.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"leaveType\":\"VACATION\", \"startDate\":\"2024-07-01\", \"endDate\":\"2024-07-15\", \"reason\":\"Férias anuais\", \"status\":\"PENDING\"}")))
    @PostMapping
    public ResponseEntity<Leave> create(@RequestBody Leave leave) {
        return ResponseEntity.ok(leaveService.create(leave));
    }
    
    @Operation(summary = "Atualiza uma solicitação de férias/ausência existente",
               description = "Atualiza as informações de uma solicitação pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitação de férias/ausência para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Leave.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"leaveType\":\"VACATION\", \"startDate\":\"2024-08-01\", \"endDate\":\"2024-08-15\", \"reason\":\"Férias anuais - alterado\", \"status\":\"PENDING\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Leave> update(@PathVariable UUID id, @RequestBody Leave leave) {
        return ResponseEntity.ok(leaveService.update(id, leave));
    }
    
    @Operation(summary = "Aprova uma solicitação de férias/ausência",
               description = "Altera o status de uma solicitação para APROVADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação aprovada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "ID do usuário que aprovou a solicitação", required = true)
    @PutMapping("/{id}/approve")
    public ResponseEntity<Leave> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedBy) {
        return ResponseEntity.ok(leaveService.approve(id, approvedBy));
    }
    
    @Operation(summary = "Rejeita uma solicitação de férias/ausência",
               description = "Altera o status de uma solicitação para REJEITADA e adiciona uma justificativa. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação rejeitada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Justificativa para a rejeição da solicitação", required = true)
    @PutMapping("/{id}/reject")
    public ResponseEntity<Leave> reject(@PathVariable UUID id, @RequestParam String justification) {
        return ResponseEntity.ok(leaveService.reject(id, justification));
    }
    
    @Operation(summary = "Cancela uma solicitação de férias/ausência",
               description = "Altera o status de uma solicitação para CANCELADA. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação cancelada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Leave> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(leaveService.cancel(id));
    }
    
    @Operation(summary = "Busca uma solicitação de férias/ausência pelo ID",
               description = "Retorna as informações de uma solicitação específica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria solicitação).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Leave> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(leaveService.findById(id));
    }
    
    @Operation(summary = "Busca solicitações de férias/ausências por ID de funcionário",
               description = "Retorna uma lista de solicitações associadas a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Leave.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Leave>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(leaveService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca solicitações de férias/ausências por ID de funcionário e status",
               description = "Retorna uma lista de solicitações de um funcionário com um status específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações por funcionário e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Leave.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}/status/{status}")
    public ResponseEntity<List<Leave>> findByEmployeeIdAndStatus(
            @PathVariable UUID employeeId,
            @PathVariable LeaveStatus status) {
        return ResponseEntity.ok(leaveService.findByEmployeeIdAndStatus(employeeId, status));
    }
    
    @Operation(summary = "Busca solicitações de férias/ausências por ID de funcionário e tipo",
               description = "Retorna uma lista de solicitações de um funcionário com um tipo específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações por funcionário e tipo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Leave.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}/type/{leaveType}")
    public ResponseEntity<List<Leave>> findByEmployeeIdAndLeaveType(
            @PathVariable UUID employeeId,
            @PathVariable LeaveType leaveType) {
        return ResponseEntity.ok(leaveService.findByEmployeeIdAndLeaveType(employeeId, leaveType));
    }
    
    @Operation(summary = "Busca solicitações de férias/ausências por intervalo de datas",
               description = "Retorna uma lista de solicitações que iniciam dentro de um período específico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de início do intervalo (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do intervalo (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<Leave>> findByStartDateBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(leaveService.findByStartDateBetween(startDate, endDate));
    }
} 