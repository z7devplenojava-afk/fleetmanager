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

import com.z7design.fleet_manager.annotation.LogUserActivity;
import com.z7design.fleet_manager.model.FeriasColetivas;
import com.z7design.fleet_manager.service.FeriasColetivasService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

/**
 * Ferias Coletivas - CLT Art. 139/140 (RF-04 do PRD).
 * Processamento em massa do abatimento de saldo sera adicionado na Fase 2.
 */
@RestController
@RequestMapping("/api/ferias-coletivas")
@RequiredArgsConstructor
@Tag(name = "Ferias Coletivas",
     description = "Cadastro de ferias coletivas - CLT Art. 139 e 140.")
@SecurityRequirement(name = "bearerAuth")
public class FeriasColetivasController {

    private static final String ROLE_RH =
        "hasAnyAuthority('HR_APPROVE', 'HR_WRITE', 'HR_DELETE', 'SUPER_ADMIN', 'ADMIN', "
        + "'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'RECURSOS_HUMANOS', 'RH', 'DEPARTAMENTO_PESSOAL')";

    private final FeriasColetivasService feriasColetivasService;

    @Operation(summary = "Lista todas as ferias coletivas",
               description = "Ordenadas da mais recente para a mais antiga.")
    @GetMapping
    public ResponseEntity<List<FeriasColetivas>> findAll() {
        return ResponseEntity.ok(feriasColetivasService.findAll());
    }

    @Operation(summary = "Consulta por periodo",
               description = "Retorna as coletivas cujo inicio cai dentro do intervalo informado.")
    @GetMapping("/periodo")
    public ResponseEntity<List<FeriasColetivas>> findByPeriodo(
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return ResponseEntity.ok(feriasColetivasService.findByPeriodo(inicio, fim));
    }

    @Operation(summary = "Busca por ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Registro encontrado"),
        @ApiResponse(responseCode = "404", description = "Registro nao encontrado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<FeriasColetivas> findById(
            @Parameter(description = "ID das ferias coletivas") @PathVariable UUID id) {
        return ResponseEntity.ok(feriasColetivasService.findById(id));
    }

    @Operation(summary = "Cadastra ferias coletivas",
               description = "Exige titulo, datas e, quando nao abrange toda a empresa, "
                   + "ao menos um departamento.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Registro criado"),
        @ApiResponse(responseCode = "400", description = "Dados invalidos"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PostMapping
    @PreAuthorize(ROLE_RH)
    @LogUserActivity(action = "CREATE", details = "Cadastro de ferias coletivas")
    public ResponseEntity<FeriasColetivas> create(@RequestBody FeriasColetivas coletiva) {
        return ResponseEntity.ok(feriasColetivasService.create(coletiva));
    }

    @Operation(summary = "Atualiza ferias coletivas")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Registro atualizado"),
        @ApiResponse(responseCode = "404", description = "Registro nao encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PutMapping("/{id}")
    @PreAuthorize(ROLE_RH)
    @LogUserActivity(action = "UPDATE", details = "Atualizacao de ferias coletivas")
    public ResponseEntity<FeriasColetivas> update(
            @Parameter(description = "ID das ferias coletivas") @PathVariable UUID id,
            @RequestBody FeriasColetivas coletiva) {
        return ResponseEntity.ok(feriasColetivasService.update(id, coletiva));
    }

    @Operation(summary = "Processa a coletiva em massa (RF-04)",
               description = "Gera uma solicitacao de ferias aprovada para cada colaborador elegivel, "
                   + "abate o saldo do periodo aquisitivo vigente, aplica saldo proporcional de 2,5 dias "
                   + "por mes para menos de 12 meses de contrato (Art. 140) e marca o excedente como "
                   + "licenca remunerada. Idempotente: colaboradores ja processados sao pulados.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Resumo do processamento"),
        @ApiResponse(responseCode = "400", description = "Status atual impede o processamento"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Registro nao encontrado")
    })
    @PostMapping("/{id}/processar")
    @PreAuthorize(ROLE_RH)
    @LogUserActivity(action = "UPDATE", details = "Processamento de ferias coletivas")
    public ResponseEntity<FeriasColetivasService.ResultadoProcessamento> processar(
            @Parameter(description = "ID das ferias coletivas") @PathVariable UUID id) {
        return ResponseEntity.ok(feriasColetivasService.processar(id));
    }

    @Operation(summary = "Conclui a coletiva",
               description = "Marca a coletiva como Concluida apos o termino do gozo em massa.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Coletiva concluida"),
        @ApiResponse(responseCode = "400", description = "Coletiva ainda nao processada"),
        @ApiResponse(responseCode = "403", description = "Acesso negado"),
        @ApiResponse(responseCode = "404", description = "Registro nao encontrado")
    })
    @PostMapping("/{id}/concluir")
    @PreAuthorize(ROLE_RH)
    @LogUserActivity(action = "UPDATE", details = "Conclusao de ferias coletivas")
    public ResponseEntity<FeriasColetivas> concluir(
            @Parameter(description = "ID das ferias coletivas") @PathVariable UUID id) {
        return ResponseEntity.ok(feriasColetivasService.concluir(id));
    }

    @Operation(summary = "Cancela ferias coletivas",
               description = "Marca o registro como Cancelado, preservando o historico.")    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Registro cancelado"),
        @ApiResponse(responseCode = "404", description = "Registro nao encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @PostMapping("/{id}/cancelar")
    @PreAuthorize(ROLE_RH)
    @LogUserActivity(action = "UPDATE", details = "Cancelamento de ferias coletivas")
    public ResponseEntity<FeriasColetivas> cancel(
            @Parameter(description = "ID das ferias coletivas") @PathVariable UUID id) {
        feriasColetivasService.cancel(id);
        return ResponseEntity.ok(feriasColetivasService.findById(id));
    }

    @Operation(summary = "Exclui ferias coletivas")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Registro excluido"),
        @ApiResponse(responseCode = "404", description = "Registro nao encontrado"),
        @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize(ROLE_RH)
    @LogUserActivity(action = "DELETE", details = "Exclusao de ferias coletivas")
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID das ferias coletivas") @PathVariable UUID id) {
        feriasColetivasService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
