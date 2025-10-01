package br.com.fleetmanager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.fleetmanager.service.ScheduleService;

import br.com.fleetmanager.dto.CreateScheduleDTO;
import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.Schedule;
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
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@Tag(name = "Escalas de Trabalho", description = "Endpoints para gestão de escalas de trabalho dos funcionários.")
@SecurityRequirement(name = "bearerAuth")
public class ScheduleController {

        private final ScheduleService scheduleService;

        @Operation(summary = "Cria uma nova escala de trabalho", description = "Adiciona uma nova escala de trabalho ao sistema. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Escala de trabalho criada com sucesso", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class))),
                        @ApiResponse(responseCode = "400", description = "Requisição inválida", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da escala de trabalho para criação", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class), examples = @ExampleObject(value = "{\"employeeId\":\"UUID_DO_FUNCIONARIO\", \"date\":\"2024-07-01\", \"startTime\":\"08:00:00\", \"endTime\":\"17:00:00\", \"shift\":\"DAY\", \"notes\":\"Escala normal de segunda a sexta.\"}")))
        @PostMapping
        public ResponseEntity<Schedule> create(@RequestBody CreateScheduleDTO createScheduleDTO) {
                return ResponseEntity.ok(scheduleService.createFromDTO(createScheduleDTO));
        }

        @Operation(summary = "Atualiza uma escala de trabalho existente", description = "Atualiza as informações de uma escala de trabalho pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Escala de trabalho atualizada com sucesso", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class))),
                        @ApiResponse(responseCode = "400", description = "Requisição inválida", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "404", description = "Escala de trabalho não encontrada", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da escala de trabalho para atualização", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class), examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"startTime\":\"09:00:00\", \"endTime\":\"18:00:00\", \"notes\":\"Ajuste de horário.\"}")))
        @PutMapping("/{id}")
        public ResponseEntity<Schedule> update(@PathVariable UUID id, @RequestBody Schedule schedule) {
                return ResponseEntity.ok(scheduleService.update(id, schedule));
        }

        @Operation(summary = "Exclui uma escala de trabalho", description = "Exclui uma escala de trabalho pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "204", description = "Escala de trabalho excluída com sucesso"),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "404", description = "Escala de trabalho não encontrada", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @DeleteMapping("/{id}")
        public ResponseEntity<Void> delete(@PathVariable UUID id) {
                scheduleService.delete(id);
                return ResponseEntity.noContent().build();
        }

        @Operation(summary = "Busca uma escala de trabalho pelo ID", description = "Retorna as informações de uma escala de trabalho específica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria escala).")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Escala de trabalho encontrada", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "404", description = "Escala de trabalho não encontrada", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping("/{id}")
        public ResponseEntity<Schedule> findById(@PathVariable UUID id) {
                return ResponseEntity.ok(scheduleService.findById(id));
        }

        @Operation(summary = "Busca escalas de trabalho por ID de funcionário", description = "Retorna uma lista de escalas de trabalho associadas a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de escalas de trabalho do funcionário", content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Schedule.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping("/employee/{employeeId}")
        public ResponseEntity<List<Schedule>> findByEmployeeId(@PathVariable UUID employeeId) {
                return ResponseEntity.ok(scheduleService.findByEmployeeId(employeeId));
        }

        @Operation(summary = "Busca escalas de trabalho por data", description = "Retorna uma lista de escalas de trabalho para uma data específica. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de escalas de trabalho por data", content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Schedule.class))),
                        @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @Parameter(description = "Data da escala de trabalho (formato YYYY-MM-DD)", example = "2024-07-01", required = true)
        @GetMapping("/date")
        public ResponseEntity<List<Schedule>> findByDate(
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                return ResponseEntity.ok(scheduleService.findByDate(date));
        }

        @Operation(summary = "Retorna todas as escalas de trabalho", description = "Retorna uma lista de todas as escalas de trabalho cadastradas. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de todas as escalas de trabalho", content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Schedule.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping
        public ResponseEntity<List<Schedule>> findAll() {
                return ResponseEntity.ok(scheduleService.findAll());
        }
}