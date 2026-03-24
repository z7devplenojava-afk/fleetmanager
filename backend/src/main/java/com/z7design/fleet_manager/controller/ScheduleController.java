package com.z7design.fleet_manager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import java.io.IOException;

import com.z7design.fleet_manager.model.Schedule;
import com.z7design.fleet_manager.service.ScheduleService;
import com.z7design.fleet_manager.dto.ErrorResponse;
import com.z7design.fleet_manager.dto.CreateScheduleDTO;

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
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Escalas de Trabalho", description = "Endpoints para gestÃ£o de escalas de trabalho dos funcionÃ¡rios.")
@SecurityRequirement(name = "bearerAuth")
public class ScheduleController {

        private final ScheduleService scheduleService;

        @Operation(summary = "Cria uma nova escala de trabalho", description = "Adiciona uma nova escala de trabalho ao sistema. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Escala de trabalho criada com sucesso", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class))),
                        @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da escala de trabalho para criaÃ§Ã£o", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class), examples = @ExampleObject(value = "{\"employeeId\":\"UUID_DO_FUNCIONARIO\", \"date\":\"2024-07-01\", \"startTime\":\"08:00:00\", \"endTime\":\"17:00:00\", \"shift\":\"DAY\", \"notes\":\"Escala normal de segunda a sexta.\"}")))
        @PostMapping
        public ResponseEntity<Schedule> create(@RequestBody @Valid CreateScheduleDTO createScheduleDTO) {
                try {
                        log.info("📋 Criando schedule - employeeId={}, locationId={}, workPostId={}, travelTripId={}, legs={}, shift={}, date={}",
                                        createScheduleDTO.getEmployeeId(),
                                        createScheduleDTO.getLocationId(),
                                        createScheduleDTO.getWorkPostId(),
                                        createScheduleDTO.getTravelTripId(),
                                        createScheduleDTO.getLegs(),
                                        createScheduleDTO.getShift(),
                                        createScheduleDTO.getScheduleDate());
                        return ResponseEntity.ok(scheduleService.createFromDTO(createScheduleDTO));
                } catch (Exception e) {
                        e.printStackTrace();
                        throw e;
                }
        }

        @Operation(summary = "Atualiza uma escala de trabalho existente", description = "Atualiza as informaÃ§Ãµes de uma escala de trabalho pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Escala de trabalho atualizada com sucesso", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class))),
                        @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "404", description = "Escala de trabalho nÃ£o encontrada", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da escala de trabalho para atualizaÃ§Ã£o", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class), examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"startTime\":\"09:00:00\", \"endTime\":\"18:00:00\", \"notes\":\"Ajuste de horÃ¡rio.\"}")))
        @PutMapping("/{id}")
        public ResponseEntity<Schedule> update(@PathVariable UUID id, @RequestBody Schedule schedule) {
                return ResponseEntity.ok(scheduleService.update(id, schedule));
        }

        @Operation(summary = "Exclui uma escala de trabalho", description = "Exclui uma escala de trabalho pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "204", description = "Escala de trabalho excluÃ­da com sucesso"),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "404", description = "Escala de trabalho nÃ£o encontrada", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @DeleteMapping("/{id}")
        public ResponseEntity<Void> delete(@PathVariable UUID id) {
                scheduleService.delete(id);
                return ResponseEntity.noContent().build();
        }

        @Operation(summary = "Busca uma escala de trabalho pelo ID", description = "Retorna as informaÃ§Ãµes de uma escala de trabalho especÃ­fica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria escala).")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Escala de trabalho encontrada", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Schedule.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "404", description = "Escala de trabalho nÃ£o encontrada", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping("/{id}")
        public ResponseEntity<Schedule> findById(@PathVariable UUID id) {
                return ResponseEntity.ok(scheduleService.findById(id));
        }

        @Operation(summary = "Busca escalas de trabalho por ID de funcionÃ¡rio", description = "Retorna uma lista de escalas de trabalho associadas a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de escalas de trabalho do funcionÃ¡rio", content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Schedule.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping("/employee/{employeeId}")
        public ResponseEntity<List<Schedule>> findByEmployeeId(@PathVariable UUID employeeId) {
                return ResponseEntity.ok(scheduleService.findByEmployeeId(employeeId));
        }

        @Operation(summary = "Busca escalas de trabalho por data", description = "Retorna uma lista de escalas de trabalho para uma data especÃ­fica. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de escalas de trabalho por data", content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Schedule.class))),
                        @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @Parameter(description = "Data da escala de trabalho (formato YYYY-MM-DD)", example = "2024-07-01", required = true)
        @GetMapping("/date")
        public ResponseEntity<List<Schedule>> findByDate(
                        @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                return ResponseEntity.ok(scheduleService.findByDate(date));
        }

        @Operation(summary = "Retorna todas as escalas de trabalho", description = "Retorna uma lista de todas as escalas de trabalho cadastradas. Requer o papel de ADMIN ou GESTOR.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lista de todas as escalas de trabalho", content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Schedule.class))),
                        @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping
        public ResponseEntity<List<Schedule>> findAll() {
                try {
                        List<Schedule> schedules = scheduleService.findAll();
                        log.info("ðŸ“¤ Retornando {} escalas para o frontend", schedules.size());
                        return ResponseEntity.ok(schedules);
                } catch (org.hibernate.LazyInitializationException e) {
                        log.error("âŒ LazyInitializationException ao buscar escalas no controller: {}",
                                        e.getMessage());
                        // Retornar lista vazia ao invÃ©s de erro 500 para nÃ£o quebrar o frontend
                        log.warn("âš ï¸ Retornando lista vazia devido a LazyInitializationException");
                        return ResponseEntity.ok(new java.util.ArrayList<>());
                } catch (Exception e) {
                        log.error("âŒ Erro ao buscar escalas no controller: {}", e.getMessage(), e);
                        log.error("âŒ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
                        // Retornar lista vazia ao invÃ©s de erro 500 para nÃ£o quebrar o frontend
                        log.warn("âš ï¸ Retornando lista vazia devido a erro inesperado");
                        return ResponseEntity.ok(new java.util.ArrayList<>());
                }
        }

        @Operation(summary = "Gerar relatÃ³rio PDF de escalas", description = "Gera relatÃ³rio PDF de escalas com filtros opcionais")
        @GetMapping(value = "/report/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> generatePDFReport(
                        @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                        @RequestParam(name = "employeeId", required = false) UUID employeeId,
                        @RequestParam(name = "workPostId", required = false) UUID workPostId,
                        @RequestParam(name = "status", required = false) String status) {
                try {
                        byte[] pdfBytes = scheduleService.generatePDFReport(startDate, endDate, employeeId, workPostId,
                                        status);
                        String fileName = "relatorio-escalas-"
                                        + java.time.LocalDate.now().format(
                                                        java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                                        + ".pdf";

                        return ResponseEntity.ok()
                                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                                        "attachment; filename=\"" + fileName + "\"")
                                        .body(pdfBytes);
                } catch (IOException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                }
        }
}
