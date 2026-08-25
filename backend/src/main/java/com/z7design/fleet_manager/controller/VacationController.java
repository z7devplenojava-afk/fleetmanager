package com.z7design.fleet_manager.controller;

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
import org.springframework.security.access.prepost.PreAuthorize;

import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.service.VacationService;
import com.z7design.fleet_manager.service.EmployeeService;
import com.z7design.fleet_manager.dto.ErrorResponse;
import com.z7design.fleet_manager.dto.VacationDTO;

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
@Tag(name = "FÃ©rias", description = "Endpoints para gestÃ£o de solicitaÃ§Ãµes de fÃ©rias de funcionÃ¡rios.")
@SecurityRequirement(name = "bearerAuth")
public class VacationController {
    
    private final VacationService vacationService;
    private final EmployeeService employeeService;
    
    @Operation(summary = "Cria uma nova solicitaÃ§Ã£o de fÃ©rias",
               description = "Adiciona uma nova solicitaÃ§Ã£o de fÃ©rias ao sistema. Requer o papel de ADMIN, GESTOR ou o prÃ³prio funcionÃ¡rio.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o de fÃ©rias criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitaÃ§Ã£o de fÃ©rias para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Vacation.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"startDate\":\"2024-08-01\", \"endDate\":\"2024-08-30\", \"status\":\"PENDING\"}")))
    @PostMapping
    public ResponseEntity<VacationDTO> create(@RequestBody VacationDTO vacationDTO) {
        // Buscar o funcionÃ¡rio pelo ID
        Employee employee = employeeService.findById(vacationDTO.getEmployeeId());
        Vacation vacation = vacationDTO.toEntity();
        vacation.setEmployee(employee);
        vacation = vacationService.create(vacation);
        return ResponseEntity.ok(VacationDTO.fromEntity(vacation));
    }
    
    @Operation(summary = "Atualiza uma solicitaÃ§Ã£o de fÃ©rias existente",
               description = "Atualiza as informaÃ§Ãµes de uma solicitaÃ§Ã£o de fÃ©rias pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o de fÃ©rias atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o de fÃ©rias nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da solicitaÃ§Ã£o de fÃ©rias para atualizaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Vacation.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"startDate\":\"2024-09-01\", \"endDate\":\"2024-09-20\"}")))
    @PutMapping("/{id}")
    public ResponseEntity<Vacation> update(@PathVariable("id") UUID id, @RequestBody Vacation vacation) {
        return ResponseEntity.ok(vacationService.update(id, vacation));
    }
    
    
    
    @Operation(summary = "Cancela uma solicitaÃ§Ã£o de fÃ©rias",
               description = "Altera o status de uma solicitaÃ§Ã£o de fÃ©rias para CANCELADA. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o de fÃ©rias cancelada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida ou transiÃ§Ã£o de status nÃ£o permitida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o de fÃ©rias nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Vacation> cancel(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(vacationService.cancel(id));
    }
    
    @Operation(summary = "Exclui uma solicitaÃ§Ã£o de fÃ©rias",
               description = "Exclui uma solicitaÃ§Ã£o de fÃ©rias pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "SolicitaÃ§Ã£o de fÃ©rias excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o de fÃ©rias nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        vacationService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca uma solicitaÃ§Ã£o de fÃ©rias pelo ID",
               description = "Retorna as informaÃ§Ãµes de uma solicitaÃ§Ã£o de fÃ©rias especÃ­fica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria solicitaÃ§Ã£o).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "SolicitaÃ§Ã£o de fÃ©rias encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Vacation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o de fÃ©rias nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<VacationDTO> findById(@PathVariable("id") UUID id) {
        Vacation vacation = vacationService.findById(id);
        return ResponseEntity.ok(VacationDTO.fromEntity(vacation));
    }
    
    @Operation(summary = "Busca solicitaÃ§Ãµes de fÃ©rias por ID de funcionÃ¡rio",
               description = "Retorna uma lista de solicitaÃ§Ãµes de fÃ©rias associadas a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes de fÃ©rias do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Vacation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<VacationDTO>> findByEmployeeId(@PathVariable("employeeId") UUID employeeId) {
        List<Vacation> vacations = vacationService.findByEmployeeId(employeeId);
        List<VacationDTO> vacationDTOs = vacations.stream()
            .map(VacationDTO::fromEntity)
            .toList();
        return ResponseEntity.ok(vacationDTOs);
    }
    
    @Operation(summary = "Busca solicitaÃ§Ãµes de fÃ©rias por ID de funcionÃ¡rio e status",
               description = "Retorna uma lista de solicitaÃ§Ãµes de fÃ©rias de um funcionÃ¡rio com um status especÃ­fico. Requer o papel de ADMIN, GESTOR ou SUPERVISOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes de fÃ©rias por funcionÃ¡rio e status",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "Status de fÃ©rias invÃ¡lido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Status da solicitaÃ§Ã£o de fÃ©rias (PENDING, APPROVED, REJECTED, CANCELLED)", required = true)
    @GetMapping("/employee/{employeeId}/status/{status}")
    public ResponseEntity<List<VacationDTO>> findByEmployeeIdAndStatus(
            @PathVariable("employeeId") UUID employeeId,
            @PathVariable("status") VacationStatus status) {
        List<Vacation> vacations = vacationService.findByEmployeeIdAndStatus(employeeId, status);
        List<VacationDTO> vacationDTOs = vacations.stream()
            .map(VacationDTO::fromEntity)
            .toList();
        return ResponseEntity.ok(vacationDTOs);
    }
    
    @Operation(summary = "Busca solicitaÃ§Ãµes de fÃ©rias por intervalo de datas de inÃ­cio",
               description = "Retorna uma lista de solicitaÃ§Ãµes de fÃ©rias cujo perÃ­odo de inÃ­cio cai dentro de um intervalo de datas especificado. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de solicitaÃ§Ãµes de fÃ©rias por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Vacation.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de inÃ­cio do perÃ­odo (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do perÃ­odo (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<VacationDTO>> findByStartDateBetween(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Vacation> vacations = vacationService.findByStartDateBetween(startDate, endDate);
        List<VacationDTO> vacationDTOs = vacations.stream()
            .map(VacationDTO::fromEntity)
            .toList();
        return ResponseEntity.ok(vacationDTOs);
    }
    
    @Operation(summary = "Retorna todas as solicitaÃ§Ãµes de fÃ©rias",
               description = "Retorna uma lista de todas as solicitaÃ§Ãµes de fÃ©rias cadastradas. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todas as solicitaÃ§Ãµes de fÃ©rias",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Vacation.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<VacationDTO>> findAll() {
        List<Vacation> vacations = vacationService.findAll();
        List<VacationDTO> vacationDTOs = vacations.stream()
            .map(VacationDTO::fromEntity)
            .toList();
        return ResponseEntity.ok(vacationDTOs);
    }

    @Operation(summary = "Aprova uma solicitaÃ§Ã£o de fÃ©rias",
               description = "Aprova uma solicitaÃ§Ã£o de fÃ©rias pendente. Apenas usuÃ¡rios com roles de RH podem aprovar.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "FÃ©rias aprovada com sucesso",
                     content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = VacationDTO.class))),
        @ApiResponse(responseCode = "403", description = "Acesso negado - permissÃµes insuficientes",
                     content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = ErrorResponse.class),
                                      examples = @ExampleObject(value = "{\"error\": \"Acesso negado\", \"message\": \"VocÃª nÃ£o tem permissÃ£o para aprovar fÃ©rias\"}"))),
        @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o de fÃ©rias nÃ£o encontrada",
                     content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "400", description = "SolicitaÃ§Ã£o jÃ¡ foi processada ou dados invÃ¡lidos",
                     content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('HR_APPROVE', 'HR_READ', 'HR_WRITE', 'HR_DELETE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'RECURSOS_HUMANOS', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<VacationDTO> approveVacation(
            @Parameter(description = "ID da solicitaÃ§Ã£o de fÃ©rias a ser aprovada") @PathVariable("id") UUID id,
            @RequestBody(required = false) ApprovalRequest request) {
        try {
            Vacation vacation = vacationService.approveVacation(id, request != null ? request.getObservacoes() : null);
            return ResponseEntity.ok(VacationDTO.fromEntity(vacation));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Rejeita uma solicitaÃ§Ã£o de fÃ©rias",
               description = "Rejeita uma solicitaÃ§Ã£o de fÃ©rias pendente. Apenas usuÃ¡rios com roles de RH podem rejeitar.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "FÃ©rias rejeitada com sucesso",
                     content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = VacationDTO.class))),
        @ApiResponse(responseCode = "403", description = "Acesso negado - permissÃµes insuficientes",
                     content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = ErrorResponse.class),
                                      examples = @ExampleObject(value = "{\"error\": \"Acesso negado\", \"message\": \"VocÃª nÃ£o tem permissÃ£o para rejeitar fÃ©rias\"}"))),
        @ApiResponse(responseCode = "404", description = "SolicitaÃ§Ã£o de fÃ©rias nÃ£o encontrada",
                     content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "400", description = "SolicitaÃ§Ã£o jÃ¡ foi processada ou dados invÃ¡lidos",
                     content = @Content(mediaType = "application/json",
                                      schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('HR_APPROVE', 'HR_READ', 'HR_WRITE', 'HR_DELETE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'RECURSOS_HUMANOS', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<VacationDTO> rejectVacation(
            @Parameter(description = "ID da solicitaÃ§Ã£o de fÃ©rias a ser rejeitada") @PathVariable("id") UUID id,
            @RequestBody(required = false) ApprovalRequest request) {
        try {
            String motivo = (request != null && request.getObservacoes() != null) ? request.getObservacoes() : "Motivo nÃ£o especificado";
            Vacation vacation = vacationService.rejectVacation(id, motivo);
            return ResponseEntity.ok(VacationDTO.fromEntity(vacation));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Classe interna para requests de aprovaÃ§Ã£o
    public static class ApprovalRequest {
        private String observacoes;

        public String getObservacoes() {
            return observacoes;
        }

        public void setObservacoes(String observacoes) {
            this.observacoes = observacoes;
        }
    }
} 
