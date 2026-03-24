package com.z7design.fleet_manager.controller;

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

import com.z7design.fleet_manager.model.Leave;
import com.z7design.fleet_manager.model.enums.LeaveStatus;
import com.z7design.fleet_manager.model.enums.LeaveType;
import com.z7design.fleet_manager.service.LeaveService;
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
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@Tag(name = "FÃ©rias e AusÃªncias", description = "Endpoints para gestÃ£o de solicitaÃ§Ãµes de fÃ©rias e ausÃªncias.")
@SecurityRequirement(name = "bearerAuth")
public class LeaveController {
    
    private final LeaveService leaveService;
    
    @Operation(summary = "Cria uma nova solicitaÃ§Ã£o de fÃ©rias/ausÃªncia",
               description = "Adiciona uma nova solicitaÃ§Ã£o de fÃ©rias ou ausÃªncia. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitaÃ§Ã£o de fÃ©rias/ausÃªncia",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Leave.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"leaveType\":\"VACATION\", \"startDate\":\"2024-07-01\", \"endDate\":\"2024-07-15\", \"reason\":\"FÃ©rias anuais\", \"status\":\"PENDING\"}")))
    @PostMapping
    public ResponseEntity<Leave> create(@RequestBody Leave leave) {
        return ResponseEntity.ok(leaveService.create(leave));
    }
    
    @Operation(summary = "Atualiza uma solicitaÃ§Ã£o de fÃ©rias/ausÃªncia existente",
               description = "Atualiza as informaÃ§Ãµes de uma solicitaÃ§Ã£o pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitaÃ§Ã£o de fÃ©rias/ausÃªncia para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Leave.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"leaveType\":\"VACATION\", \"startDate\":\"2024-08-01\", \"endDate\":\"2024-08-15\", \"reason\":\"FÃ©rias anuais - alterado\", \"status\":\"PENDING\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Leave> update(@PathVariable UUID id, @RequestBody Leave leave) {
        return ResponseEntity.ok(leaveService.update(id, leave));
    }
    
    @Operation(summary = "Aprova uma solicitaÃ§Ã£o de fÃ©rias/ausÃªncia",
               description = "Altera o status de uma solicitaÃ§Ã£o para APROVADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o aprovada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "ID do usuÃ¡rio que aprovou a solicitaÃ§Ã£o", required = true)
    @PutMapping("/{id}/approve")
    public ResponseEntity<Leave> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedBy) {
        return ResponseEntity.ok(leaveService.approve(id, approvedBy));
    }
    
    @Operation(summary = "Rejeita uma solicitaÃ§Ã£o de fÃ©rias/ausÃªncia",
               description = "Altera o status de uma solicitaÃ§Ã£o para REJEITADA e adiciona uma justificativa. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o rejeitada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Justificativa para a rejeiÃ§Ã£o da solicitaÃ§Ã£o", required = true)
    @PutMapping("/{id}/reject")
    public ResponseEntity<Leave> reject(@PathVariable UUID id, @RequestParam String justification) {
        return ResponseEntity.ok(leaveService.reject(id, justification));
    }
    
    @Operation(summary = "Cancela uma solicitaÃ§Ã£o de fÃ©rias/ausÃªncia",
               description = "Altera o status de uma solicitaÃ§Ã£o para CANCELADA. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o cancelada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Leave> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(leaveService.cancel(id));
    }
    
    @Operation(summary = "Busca uma solicitaÃ§Ã£o de fÃ©rias/ausÃªncia pelo ID",
               description = "Retorna as informaÃ§Ãµes de uma solicitaÃ§Ã£o especÃ­fica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria solicitaÃ§Ã£o).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Leave.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Leave> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(leaveService.findById(id));
    }
    
    @Operation(summary = "Busca solicitaÃ§Ãµes de fÃ©rias/ausÃªncias por ID de funcionÃ¡rio",
               description = "Retorna uma lista de solicitaÃ§Ãµes associadas a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Leave.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Leave>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(leaveService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca solicitaÃ§Ãµes de fÃ©rias/ausÃªncias por ID de funcionÃ¡rio e status",
               description = "Retorna uma lista de solicitaÃ§Ãµes de um funcionÃ¡rio com um status especÃ­fico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes por funcionÃ¡rio e status",
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
    
    @Operation(summary = "Busca solicitaÃ§Ãµes de fÃ©rias/ausÃªncias por ID de funcionÃ¡rio e tipo",
               description = "Retorna uma lista de solicitaÃ§Ãµes de um funcionÃ¡rio com um tipo especÃ­fico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes por funcionÃ¡rio e tipo",
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
    
    @Operation(summary = "Busca solicitaÃ§Ãµes de fÃ©rias/ausÃªncias por intervalo de datas",
               description = "Retorna uma lista de solicitaÃ§Ãµes que iniciam dentro de um perÃ­odo especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Leave.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de inÃ­cio do intervalo (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do intervalo (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<Leave>> findByStartDateBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(leaveService.findByStartDateBetween(startDate, endDate));
    }
} 
