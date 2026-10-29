package com.z7design.fleet_manager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.service.ScheduleService;
import com.z7design.fleet_manager.dto.ErrorResponse;
import com.z7design.fleet_manager.dto.CreateScheduleDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
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
@Tag(name = "Escalas de Trabalho", description = "Endpoints para gestão de escalas de trabalho dos funcionários.")
@SecurityRequirement(name = "bearerAuth")
public class ScheduleController {

        private final ScheduleService scheduleService;
        private final AuthenticationService authenticationService;

        @Operation(summary = "Cria uma nova escala de trabalho", description = "Adiciona uma nova escala de trabalho ao sistema.")
        @PostMapping
        public ResponseEntity<Schedule> create(@RequestBody @Valid CreateScheduleDTO createScheduleDTO) {
                try {
                        log.info("📋 Criando schedule - employeeId={}, locationId={}, workPostId={}, travelTripId={}, routeId={}, vehicleId={}, legs={}, shift={}, date={}",
                                        createScheduleDTO.getEmployeeId(),
                                        createScheduleDTO.getLocationId(),
                                        createScheduleDTO.getWorkPostId(),
                                        createScheduleDTO.getTravelTripId(),
                                        createScheduleDTO.getRouteId(),
                                        createScheduleDTO.getVehicleId(),
                                        createScheduleDTO.getLegs(),
                                        createScheduleDTO.getShift(),
                                        createScheduleDTO.getScheduleDate());
                        return ResponseEntity.ok(scheduleService.createFromDTO(createScheduleDTO));
                } catch (Exception e) {
                        log.error("Erro ao criar escala: {}", e.getMessage(), e);
                        throw e;
                }
        }

        @Operation(summary = "Atualiza uma escala de trabalho existente", description = "Atualiza as informações de uma escala de trabalho pelo seu ID.")
        @PutMapping("/{id}")
        public ResponseEntity<Schedule> update(@PathVariable("id") UUID id, @RequestBody CreateScheduleDTO dto) {
                return ResponseEntity.ok(scheduleService.updateFromDTO(id, dto));
        }

        @Operation(summary = "Registra o ponto e KM inicial do motorista na escala (tolerância de ±10 min)")
        @PostMapping("/{id}/register-point")
        public ResponseEntity<Schedule> registerPoint(
                        @PathVariable("id") UUID id,
                        @RequestBody Map<String, Object> body) {
                Double initialKm = body.get("initialKm") != null ? Double.valueOf(body.get("initialKm").toString()) : null;
                Boolean forgotPoint = body.get("forgotPoint") != null ? Boolean.valueOf(body.get("forgotPoint").toString()) : false;
                String justification = body.get("justification") != null ? body.get("justification").toString() : null;
                String photosJson = body.get("photosJson") != null ? body.get("photosJson").toString() : null;
                String startTime = body.get("startTime") != null ? body.get("startTime").toString() : null;
                String endTime = body.get("endTime") != null ? body.get("endTime").toString() : null;
                String clientName = body.get("clientName") != null ? body.get("clientName").toString() : null;
                String routeCode = body.get("routeCode") != null ? body.get("routeCode").toString() : null;
                Integer passengersCount = body.get("passengersCount") != null ? Integer.valueOf(body.get("passengersCount").toString()) : null;
                UUID vehicleId = null;
                if (body.get("vehicleId") != null && !body.get("vehicleId").toString().isBlank()) {
                        try {
                                vehicleId = UUID.fromString(body.get("vehicleId").toString());
                        } catch (Exception ignored) {
                        }
                }
                return ResponseEntity.ok(scheduleService.registerPoint(
                                id, initialKm, forgotPoint, justification, photosJson,
                                startTime, endTime, clientName, routeCode, passengersCount, vehicleId));
        }

        @Operation(summary = "Aprova ou rejeita o ponto fora do horário pelo Gestor / Encarregado de Tráfego")
        @PostMapping("/{id}/approve-point")
        public ResponseEntity<Schedule> approvePoint(
                        @PathVariable("id") UUID id,
                        Authentication authentication,
                        @RequestBody Map<String, Object> body) {
                boolean approved = body.get("approved") == null || Boolean.parseBoolean(body.get("approved").toString());
                String approvedBy = body.get("approvedBy") != null ? body.get("approvedBy").toString() : null;
                if (approvedBy == null || approvedBy.isBlank()) {
                        try {
                                User u = authenticationService.getCurrentUser(authentication);
                                if (u != null) approvedBy = u.getName();
                        } catch (Exception ignored) {
                        }
                }
                String managerNotes = body.get("managerNotes") != null ? body.get("managerNotes").toString() : null;
                return ResponseEntity.ok(scheduleService.approvePoint(id, approved, approvedBy, managerNotes));
        }

        @Operation(summary = "Finaliza a viagem da escala informando KM final e fotos")
        @PostMapping("/{id}/finish-trip")
        public ResponseEntity<Schedule> finishTrip(
                        @PathVariable("id") UUID id,
                        @RequestBody Map<String, Object> body) {
                Double finalKm = body.get("finalKm") != null ? Double.valueOf(body.get("finalKm").toString()) : null;
                String photosJson = body.get("photosJson") != null ? body.get("photosJson").toString() : null;
                String observations = body.get("observations") != null ? body.get("observations").toString() : null;
                String endTime = body.get("endTime") != null ? body.get("endTime").toString() : null;
                Integer passengersCount = body.get("passengersCount") != null ? Integer.valueOf(body.get("passengersCount").toString()) : null;
                return ResponseEntity.ok(scheduleService.finishTrip(id, finalKm, photosJson, observations, endTime, passengersCount));
        }

        @Operation(summary = "Exclui uma escala de trabalho", description = "Exclui uma escala de trabalho pelo seu ID.")
        @DeleteMapping("/{id}")
        public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
                scheduleService.delete(id);
                return ResponseEntity.noContent().build();
        }

        @Operation(summary = "Minhas escalas", description = "Retorna as escalas do funcionário vinculado ao usuário autenticado (portal do motorista).")
        @GetMapping("/me")
        public ResponseEntity<List<Schedule>> findMySchedules(
                        Authentication authentication,
                        @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                try {
                        User user = authenticationService.getCurrentUser(authentication);
                        return ResponseEntity.ok(scheduleService.findMySchedules(user, startDate, endDate));
                } catch (com.z7design.fleet_manager.exception.ResourceNotFoundException e) {
                        log.debug("Usuário autenticado não possui vínculo com funcionário em /schedules/me: {}", e.getMessage());
                        return ResponseEntity.ok(java.util.Collections.emptyList());
                } catch (Exception e) {
                        log.warn("Erro ao buscar escalas do usuário autenticado: {}", e.getMessage());
                        return ResponseEntity.ok(java.util.Collections.emptyList());
                }
        }

        @Operation(summary = "PDF das minhas escalas", description = "Gera PDF das escalas do funcionário autenticado para visualização ou download.")
        @GetMapping(value = "/me/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> generateMyPDFReport(
                        Authentication authentication,
                        @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                        @RequestParam(name = "inline", required = false, defaultValue = "false") boolean inline) {
                try {
                        User user = authenticationService.getCurrentUser(authentication);
                        byte[] pdfBytes = scheduleService.generateMyPDFReport(user, startDate, endDate);
                        String fileName = "minha-escala-"
                                        + java.time.LocalDate.now().format(
                                                        java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                                        + ".pdf";
                        String disposition = inline ? "inline" : "attachment";
                        return ResponseEntity.ok()
                                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                                        disposition + "; filename=\"" + fileName + "\"")
                                        .contentType(MediaType.APPLICATION_PDF)
                                        .body(pdfBytes);
                } catch (IOException e) {
                        log.error("Erro ao gerar PDF das minhas escalas: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                }
        }

        @Operation(summary = "Busca uma escala de trabalho pelo ID")
        @GetMapping("/{id}")
        public ResponseEntity<Schedule> findById(@PathVariable("id") UUID id) {
                return ResponseEntity.ok(scheduleService.findById(id));
        }

        @Operation(summary = "Busca escalas de trabalho por ID de funcionário")
        @GetMapping("/employee/{employeeId}")
        public ResponseEntity<List<Schedule>> findByEmployeeId(@PathVariable("employeeId") UUID employeeId) {
                return ResponseEntity.ok(scheduleService.findByEmployeeId(employeeId));
        }

        @Operation(summary = "Busca escalas de trabalho por data")
        @Parameter(description = "Data da escala de trabalho (formato YYYY-MM-DD)", example = "2024-07-01", required = true)
        @GetMapping("/date")
        public ResponseEntity<List<Schedule>> findByDate(
                        @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
                return ResponseEntity.ok(scheduleService.findByDate(date));
        }

        @Operation(summary = "Retorna todas as escalas de trabalho")
        @GetMapping
        public ResponseEntity<List<Schedule>> findAll() {
                try {
                        List<Schedule> schedules = scheduleService.findAll();
                        log.info("📤 Retornando {} escalas para o frontend", schedules.size());
                        return ResponseEntity.ok(schedules);
                } catch (org.hibernate.LazyInitializationException e) {
                        log.error("❌ LazyInitializationException ao buscar escalas no controller: {}",
                                        e.getMessage());
                        return ResponseEntity.ok(new java.util.ArrayList<>());
                } catch (Exception e) {
                        log.error("❌ Erro ao buscar escalas no controller: {}", e.getMessage(), e);
                        return ResponseEntity.ok(new java.util.ArrayList<>());
                }
        }

        @Operation(summary = "Gerar relatório PDF de escalas", description = "Gera relatório PDF de escalas com filtros opcionais")
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
