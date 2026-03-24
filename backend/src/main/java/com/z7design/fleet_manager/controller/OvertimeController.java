package com.z7design.fleet_manager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.model.Overtime;
import com.z7design.fleet_manager.model.enums.OvertimeStatus;
import com.z7design.fleet_manager.model.enums.OvertimeType;
import com.z7design.fleet_manager.service.OvertimeService;
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

@RestController
@RequestMapping("/api/overtimes")
@Tag(name = "Horas Extras", description = "Endpoints para gestÃ£o de solicitaÃ§Ãµes de horas extras.")
@SecurityRequirement(name = "bearerAuth")
public class OvertimeController {

    @Autowired
    private OvertimeService overtimeService;

    @Operation(summary = "Cria uma nova solicitaÃ§Ã£o de horas extras",
               description = "Adiciona uma nova solicitaÃ§Ã£o de horas extras ao sistema. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o de horas extras criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitaÃ§Ã£o de horas extras para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Overtime.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"overtimeDate\":\"2024-06-20\", \"overtimeHours\":2.5, \"overtimeType\":\"EXTRA_HOURS\", \"status\":\"PENDING\", \"justification\":\"ConclusÃ£o de projeto urgente\"}")))
    @PostMapping
    public ResponseEntity<Overtime> create(@RequestBody Overtime overtime) {
        return ResponseEntity.ok(overtimeService.create(overtime));
    }

    @Operation(summary = "Atualiza uma solicitaÃ§Ã£o de horas extras existente",
               description = "Atualiza as informaÃ§Ãµes de uma solicitaÃ§Ã£o de horas extras pelo seu ID. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o de horas extras atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o de horas extras nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitaÃ§Ã£o de horas extras para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Overtime.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"overtimeHours\":3.0, \"justification\":\"ConclusÃ£o de projeto urgente - atualizado\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Overtime> update(@PathVariable UUID id, @RequestBody Overtime overtime) {
        return ResponseEntity.ok(overtimeService.update(id, overtime));
    }

    @Operation(summary = "Aprova uma solicitaÃ§Ã£o de horas extras",
               description = "Altera o status de uma solicitaÃ§Ã£o para APROVADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o aprovada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "ID do usuÃ¡rio que aprovou a solicitaÃ§Ã£o", required = true)
    @PostMapping("/{id}/approve")
    public ResponseEntity<Overtime> approve(@PathVariable UUID id, @RequestParam UUID approvedBy) {
        return ResponseEntity.ok(overtimeService.approve(id, approvedBy));
    }

    @Operation(summary = "Rejeita uma solicitaÃ§Ã£o de horas extras",
               description = "Altera o status de uma solicitaÃ§Ã£o para REJEITADA e adiciona uma justificativa. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o rejeitada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Justificativa para a rejeiÃ§Ã£o da solicitaÃ§Ã£o", required = true)
    @PostMapping("/{id}/reject")
    public ResponseEntity<Overtime> reject(@PathVariable UUID id, @RequestParam String justification) {
        return ResponseEntity.ok(overtimeService.reject(id, justification));
    }

    @Operation(summary = "Marca uma solicitaÃ§Ã£o de horas extras como compensada",
               description = "Altera o status de uma solicitaÃ§Ã£o para COMPENSADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o compensada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/compensate")
    public ResponseEntity<Overtime> compensate(@PathVariable UUID id) {
        return ResponseEntity.ok(overtimeService.compensate(id));
    }

    @Operation(summary = "Busca uma solicitaÃ§Ã£o de horas extras pelo ID",
               description = "Retorna as informaÃ§Ãµes de uma solicitaÃ§Ã£o de horas extras especÃ­fica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria solicitaÃ§Ã£o).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o de horas extras encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Overtime.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o de horas extras nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Overtime> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(overtimeService.findById(id));
    }

    @Operation(summary = "Busca solicitaÃ§Ãµes de horas extras por ID de funcionÃ¡rio",
               description = "Retorna uma lista de solicitaÃ§Ãµes de horas extras associadas a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes de horas extras do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Overtime.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Overtime>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(overtimeService.findByEmployeeId(employeeId));
    }

    @Operation(summary = "Busca solicitaÃ§Ãµes de horas extras por ID de funcionÃ¡rio e status",
               description = "Retorna uma lista de solicitaÃ§Ãµes de horas extras de um funcionÃ¡rio com um status especÃ­fico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes de horas extras por funcionÃ¡rio e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Status de horas extras invÃ¡lido",
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

    @Operation(summary = "Busca solicitaÃ§Ãµes de horas extras por ID de funcionÃ¡rio e tipo",
               description = "Retorna uma lista de solicitaÃ§Ãµes de horas extras de um funcionÃ¡rio com um tipo especÃ­fico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes de horas extras por funcionÃ¡rio e tipo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "Tipo de horas extras invÃ¡lido",
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

    @Operation(summary = "Busca solicitaÃ§Ãµes de horas extras por ID de funcionÃ¡rio e perÃ­odo",
               description = "Retorna uma lista de solicitaÃ§Ãµes de horas extras de um funcionÃ¡rio dentro de um perÃ­odo de datas especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes de horas extras por funcionÃ¡rio e perÃ­odo",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Overtime.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de inÃ­cio do perÃ­odo (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do perÃ­odo (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/employee/{employeeId}/period")
    public ResponseEntity<List<Overtime>> findByEmployeeIdAndPeriod(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(overtimeService.findByEmployeeIdAndOvertimeDateBetween(employeeId, startDate, endDate));
    }
} 
