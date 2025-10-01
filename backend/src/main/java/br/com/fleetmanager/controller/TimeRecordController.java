package br.com.fleetmanager.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.TimeRecordService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.TimeRecord;
import br.com.fleetmanager.model.enums.TimeRecordStatus;
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
@RequestMapping("/api/time-records")
@Tag(name = "Registros de Ponto", description = "Endpoints para gestão de registros de ponto de funcionários.")
@SecurityRequirement(name = "bearerAuth")
public class TimeRecordController {

    @Autowired
    private TimeRecordService timeRecordService;

    @Operation(summary = "Cria um novo registro de ponto",
               description = "Adiciona um novo registro de ponto ao sistema. Requer o papel de ADMIN, GESTOR ou VIGILANTE (para o próprio registro).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro de ponto criado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do registro de ponto para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = TimeRecord.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"recordDate\":\"2024-07-01\", \"entryTime\":\"08:00:00\", \"exitTime\":\"17:00:00\", \"entryLunchTime\":\"12:00:00\", \"exitLunchTime\":\"13:00:00\", \"status\":\"PENDING\"}")))
    @PostMapping
    public ResponseEntity<TimeRecord> create(@RequestBody TimeRecord timeRecord) {
        return ResponseEntity.ok(timeRecordService.create(timeRecord));
    }

    @Operation(summary = "Atualiza um registro de ponto existente",
               description = "Atualiza as informações de um registro de ponto pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro de ponto atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Registro de ponto não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do registro de ponto para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = TimeRecord.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"exitTime\":\"17:30:00\", \"justification\":\"Reunião estendida.\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<TimeRecord> update(@PathVariable UUID id, @RequestBody TimeRecord timeRecord) {
        return ResponseEntity.ok(timeRecordService.update(id, timeRecord));
    }

    @Operation(summary = "Aprova um registro de ponto",
               description = "Altera o status de um registro de ponto para APROVADO. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro de ponto aprovado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Registro de ponto não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/approve")
    public ResponseEntity<TimeRecord> approve(@PathVariable UUID id) {
        return ResponseEntity.ok(timeRecordService.approve(id));
    }

    @Operation(summary = "Rejeita um registro de ponto",
               description = "Altera o status de um registro de ponto para REJEITADO e adiciona uma justificativa. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro de ponto rejeitado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida ou transição de status não permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Registro de ponto não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Justificativa para a rejeição do registro de ponto", required = true)
    @PostMapping("/{id}/reject")
    public ResponseEntity<TimeRecord> reject(@PathVariable UUID id, @RequestParam String justification) {
        return ResponseEntity.ok(timeRecordService.reject(id, justification));
    }

    @Operation(summary = "Ajusta um registro de ponto",
               description = "Ajusta os horários de entrada, saída e almoço de um registro de ponto e adiciona uma justificativa. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro de ponto ajustado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (horários ou justificativa)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Registro de ponto não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "ID do registro de ponto a ser ajustado", required = true)
    @Parameter(description = "Novo horário de entrada (formato HH:MM:SS)", example = "08:15:00", required = true)
    @Parameter(description = "Novo horário de saída (formato HH:MM:SS)", example = "17:45:00", required = true)
    @Parameter(description = "Novo horário de entrada de almoço (formato HH:MM:SS, opcional)", example = "12:05:00")
    @Parameter(description = "Novo horário de saída de almoço (formato HH:MM:SS, opcional)", example = "13:10:00")
    @Parameter(description = "Justificativa para o ajuste do registro de ponto", required = true)
    @PostMapping("/{id}/adjust")
    public ResponseEntity<TimeRecord> adjust(
            @PathVariable UUID id,
            @RequestParam LocalTime entryTime,
            @RequestParam LocalTime exitTime,
            @RequestParam(required = false) LocalTime entryLunchTime,
            @RequestParam(required = false) LocalTime exitLunchTime,
            @RequestParam String justification) {
        return ResponseEntity.ok(timeRecordService.adjust(id, entryTime, exitTime, entryLunchTime, exitLunchTime, justification));
    }

    @Operation(summary = "Busca um registro de ponto pelo ID",
               description = "Retorna as informações de um registro de ponto específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for seu próprio registro).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro de ponto encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Registro de ponto não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<TimeRecord> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(timeRecordService.findById(id));
    }

    @Operation(summary = "Busca registros de ponto por ID de funcionário",
               description = "Retorna uma lista de registros de ponto associados a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de registros de ponto do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TimeRecord>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(timeRecordService.findByEmployeeId(employeeId));
    }

    @Operation(summary = "Busca registros de ponto por ID de funcionário e período",
               description = "Retorna uma lista de registros de ponto de um funcionário dentro de um período de datas específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de registros de ponto por funcionário e período",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de início do período (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do período (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/employee/{employeeId}/period")
    public ResponseEntity<List<TimeRecord>> findByEmployeeIdAndPeriod(
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(timeRecordService.findByEmployeeIdAndRecordDateBetween(employeeId, startDate, endDate));
    }

    @Operation(summary = "Busca registros de ponto por ID de funcionário e status",
               description = "Retorna uma lista de registros de ponto de um funcionário com um status específico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de registros de ponto por funcionário e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = TimeRecord.class))),
            @ApiResponse(responseCode = "400", description = "Status de registro de ponto inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Status do registro de ponto (PENDING, APPROVED, REJECTED)", required = true)
    @GetMapping("/employee/{employeeId}/status")
    public ResponseEntity<List<TimeRecord>> findByEmployeeIdAndStatus(
            @PathVariable UUID employeeId,
            @RequestParam String status) {
        return ResponseEntity.ok(timeRecordService.findByEmployeeIdAndStatus(employeeId, TimeRecordStatus.valueOf(status)));
    }
} 