package com.z7design.fleet_manager.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.z7design.fleet_manager.dto.ErrorResponse;
import com.z7design.fleet_manager.model.PeriodoAquisitivo;
import com.z7design.fleet_manager.service.PeriodoAquisitivoService;
import com.z7design.fleet_manager.service.PeriodoAquisitivoService.SaldoSimulado;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

/**
 * Periodo Aquisitivo de ferias - CLT Art. 129 a 137 (RF-01 e RF-07 do PRD).
 */
@RestController
@RequestMapping("/api/periodo-aquisitivo")
@RequiredArgsConstructor
@Tag(name = "Periodo Aquisitivo de Ferias",
     description = "Controle de periodos aquisitivos, saldo e periodo concessivo (CLT Art. 129-137).")
@SecurityRequirement(name = "bearerAuth")
public class PeriodoAquisitivoController {

    private final PeriodoAquisitivoService periodoAquisitivoService;

    @Operation(summary = "Lista os periodos aquisitivos de um colaborador",
               description = "Retorna todos os PAs do colaborador, do mais recente para o mais antigo.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de periodos aquisitivos"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Colaborador nao encontrado")
    })
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('HR_APPROVE', 'HR_READ', 'HR_WRITE', 'HR_DELETE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'RECURSOS_HUMANOS', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<PeriodoAquisitivo>> findByEmployee(
            @Parameter(description = "ID do colaborador") @PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(periodoAquisitivoService.findByEmployeeId(employeeId));
    }

    @Operation(summary = "Retorna (e se necessario cria) o PA vigente do colaborador",
               description = "Gera automaticamente o PA corrente pelo aniversario de admissao.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PA vigente"),
        @ApiResponse(responseCode = "400", description = "Colaborador sem data de admissao")
    })
    @GetMapping("/ativo/{employeeId}")
    public ResponseEntity<PeriodoAquisitivo> getAtivo(
            @Parameter(description = "ID do colaborador") @PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(periodoAquisitivoService.getOrCreateVigente(employeeId));
    }

    @Operation(summary = "Simula o saldo consolidado do colaborador",
               description = "Retorna saldo, limite concessivo, dias ate o limite e maximo de abono pecuniario.")
    @GetMapping("/saldo/{employeeId}")
    public ResponseEntity<SaldoSimulado> simularSaldo(
            @Parameter(description = "ID do colaborador") @PathVariable("employeeId") UUID employeeId) {
        return ResponseEntity.ok(periodoAquisitivoService.simularSaldo(employeeId));
    }

    @Operation(summary = "Alertas de periodo concessivo",
               description = "PAs que vencem ate a data informada (base dos alertas 90/60/30 - RF-07).")
    @GetMapping("/alertas")
    @PreAuthorize("hasAnyAuthority('HR_APPROVE', 'HR_READ', 'HR_WRITE', 'HR_DELETE', 'SUPER_ADMIN', 'ADMIN', 'GESTOR', 'SUPERVISOR', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_GESTOR', 'ROLE_SUPERVISOR', 'RECURSOS_HUMANOS', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<List<PeriodoAquisitivoService.AlertaConcessivo>> alertas(
            @RequestParam(value = "ate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        LocalDate limite = ate != null ? ate : LocalDate.now().plusDays(90);
        return ResponseEntity.ok(periodoAquisitivoService.buscarAlertasConcessivo(limite));
    }

    @Operation(summary = "Reprocessa os status de todos os PAs",
               description = "Aplica as transicoes EM_ANDAMENTO -> CONCESSIVO -> EXPIRADO/QUITADO.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status atualizados"),
        @ApiResponse(responseCode = "403", description = "Acesso negado - requer papel de RH")
    })
    @PostMapping("/reprocessar-status")
    @PreAuthorize("hasAnyAuthority('HR_APPROVE', 'HR_WRITE', 'HR_DELETE', 'SUPER_ADMIN', 'ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'RECURSOS_HUMANOS', 'RH', 'DEPARTAMENTO_PESSOAL')")
    public ResponseEntity<ReprocessarResponse> reprocessar() {
        int alterados = periodoAquisitivoService.atualizarStatusesGeral();
        return ResponseEntity.ok(new ReprocessarResponse(alterados, LocalDate.now()));
    }

    public record ReprocessarResponse(int atualizados, LocalDate processadoEm) {}
}
