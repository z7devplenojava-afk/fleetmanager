package br.com.fleetmanager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.OvertimeService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.Overtime;
import br.com.fleetmanager.model.enums.OvertimeStatus;
import br.com.fleetmanager.model.enums.OvertimeType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Parameter;

@RestController
@RequestMapping("/api/overtimes")
@Tag(name = "Horas Extras", description = "Endpoints para gestão de solicitações de horas extras.")
@SecurityRequirement(name = "bearerAuth")
public class OvertimeController {

    @Autowired
    private OvertimeService overtimeService;

    @Operation(summary = "Cria uma nova solicitação de horas extras",
               description = "Adiciona uma nova solicitação de horas extras ao sistema. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de horas extras criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitação de horas extras para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Overtime.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"overtimeDate\":\"2024-06-20\", \"overtimeHours\":2.5, \"overtimeType\":\"EXTRA_HOURS\", \"status\":\"PENDING\", \"justification\":\"Conclusão de projeto urgente\"}")))
    @PostMapping
    public ResponseEntity<Overtime> create(@RequestBody Overtime overtime) {
        return ResponseEntity.ok(overtimeService.create(overtime));
    }

    @Operation(summary = "Atualiza uma solicitação de horas extras existente",
               description = "Atualiza as informações de uma solicitação de horas extras pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de horas extras atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação de horas extras não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitação de horas extras para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Overtime.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"overtimeHours\":3.0, \"justification\":\"Conclusão de projeto urgente - atualizado\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Overtime> update(@PathVariable UUID id, @RequestBody Overtime overtime) {
        return ResponseEntity.ok(overtimeService.update(id, overtime));
    }

    @Operation(summary = "Aprova uma solicitação de horas extras",
               description = "Altera o status de uma solicitação para APROVADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação aprovada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "ID do usuário que aprovou a solicitação", required = true)
    @PostMapping("/{id}/approve")
    public ResponseEntity<Overtime> approve(@PathVariable UUID id, @RequestParam UUID approvedBy) {
        return ResponseEntity.ok(overtimeService.approve(id, approvedBy));
    }

    @Operation(summary = "Rejeita uma solicitação de horas extras",
               description = "Altera o status de uma solicitação para REJEITADA e adiciona uma justificativa. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação rejeitada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Justificativa para a rejeição da solicitação", required = true)
    @PostMapping("/{id}/reject")
    public ResponseEntity<Overtime> reject(@PathVariable UUID id, @RequestParam String justification) {
        return ResponseEntity.ok(overtimeService.reject(id, justification));
    }

    @Operation(summary = "Marca uma solicitação de horas extras como compensada",
               description = "Altera o status de uma solicitação para COMPENSADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação compensada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/compensate")
    public ResponseEntity<Overtime> compensate(@PathVariable UUID id) {
        return ResponseEntity.ok(overtimeService.compensate(id));
    }

    @Operation(summary = "Busca uma solicitação de horas extras pelo ID",
               description = "Retorna as informações de uma solicitação de horas extras específica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria solicitação).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Solicitação de horas extras encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Solicitação de horas extras não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Overtime> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(overtimeService.findById(id));
    }

    @Operation(summary = "Busca solicitações de horas extras por ID de funcionário",
               description = "Retorna uma lista de solicitações de horas extras associadas a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações de horas extras do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Overtime.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Overtime>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(overtimeService.findByEmployeeId(employeeId));
    }

    @Operation(summary = "Busca solicitações de horas extras por ID de funcionário e status",
               description = "Retorna uma lista de solicitações de horas extras de um funcionário com um status específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações de horas extras por funcionário e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Status de horas extras inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Status das horas extras (PENDING, APPROVED, REJECTED, COMPENSATED)", required = true)
    @GetMapping("/employee/{employeeId}/status")
    public ResponseEntity<List<Overtime>> findByEmployeeIdAndStatus(
            @PathVariable UUID employeeId,
            @RequestParam String status) {
        return ResponseEntity.ok(overtimeService.findByEmployeeIdAndStatus(employeeId, OvertimeStatus.valueOf(status)));
    }

    @Operation(summary = "Busca solicitações de horas extras por ID de funcionário e tipo",
               description = "Retorna uma lista de solicitações de horas extras de um funcionário com um tipo específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações de horas extras por funcionário e tipo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Tipo de horas extras inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Tipo de horas extras (EXTRA_HOURS, BANK_HOURS)", required = true)
    @GetMapping("/employee/{employeeId}/type")
    public ResponseEntity<List<Overtime>> findByEmployeeIdAndType(
            @PathVariable UUID employeeId,
            @RequestParam String type) {
        return ResponseEntity.ok(overtimeService.findByEmployeeIdAndType(employeeId, OvertimeType.valueOf(type)));
    }

    @Operation(summary = "Busca solicitações de horas extras por ID de funcionário e período",
               description = "Retorna uma lista de solicitações de horas extras de um funcionário dentro de um período de datas específico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitações de horas extras por funcionário e período",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de início do período (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do período (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/employee/{employeeId}/period")
    public ResponseEntity<List<Overtime>> findByEmployeeIdAndPeriod(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(overtimeService.findByEmployeeIdAndOvertimeDateBetween(employeeId, startDate, endDate));
    }
} 