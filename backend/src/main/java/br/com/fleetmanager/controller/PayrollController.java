package br.com.fleetmanager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.fleetmanager.service.PayrollService;

import br.com.fleetmanager.dto.ErrorResponse;
import br.com.fleetmanager.model.Payroll;
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
@RequestMapping("/api/payrolls")
@RequiredArgsConstructor
@Tag(name = "Folhas de Pagamento", description = "Endpoints para gestão de folhas de pagamento.")
@SecurityRequirement(name = "bearerAuth")
public class PayrollController {
    
    private final PayrollService payrollService;
    
    @Operation(summary = "Cria uma nova folha de pagamento",
               description = "Adiciona uma nova folha de pagamento ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Folha de pagamento criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da folha de pagamento para criação",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Payroll.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"issueDate\":\"2024-06-30\", \"grossSalary\":5000.00, \"netSalary\":4500.00, \"totalBenefits\":200.00, \"totalDeductions\":300.00}")))
    @PostMapping
    public ResponseEntity<Payroll> create(@RequestBody Payroll payroll) {
        return ResponseEntity.ok(payrollService.create(payroll));
    }
    
    @Operation(summary = "Atualiza uma folha de pagamento existente",
               description = "Atualiza as informações de uma folha de pagamento pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Folha de pagamento atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Folha de pagamento não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da folha de pagamento para atualização",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Payroll.class),
                    examples = @ExampleObject(value = "{\"id\":\"a1b2c3d4-e5f6-7890-1234-567890abcdef\", \"grossSalary\":5200.00, \"netSalary\":4600.00}")))
    @PutMapping("/{id}")
    public ResponseEntity<Payroll> update(@PathVariable UUID id, @RequestBody Payroll payroll) {
        return ResponseEntity.ok(payrollService.update(id, payroll));
    }
    
    @Operation(summary = "Exclui uma folha de pagamento",
               description = "Exclui uma folha de pagamento pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Folha de pagamento excluída com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Folha de pagamento não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        payrollService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca uma folha de pagamento pelo ID",
               description = "Retorna as informações de uma folha de pagamento específica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua própria folha de pagamento).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Folha de pagamento encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Payroll.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Folha de pagamento não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Payroll> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.findById(id));
    }
    
    @Operation(summary = "Busca folhas de pagamento por ID de funcionário",
               description = "Retorna uma lista de folhas de pagamento associadas a um funcionário específico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o próprio funcionário).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento do funcionário",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Payroll>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(payrollService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca folhas de pagamento por ID da unidade",
               description = "Retorna uma lista de folhas de pagamento associadas a uma unidade específica. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento da unidade",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/unit/{unitId}")
    public ResponseEntity<List<Payroll>> findByUnitId(@PathVariable UUID unitId) {
        return ResponseEntity.ok(payrollService.findByUnitId(unitId));
    }
    
    @Operation(summary = "Busca folhas de pagamento por intervalo de datas",
               description = "Retorna uma lista de folhas de pagamento emitidas dentro de um período específico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "Requisição inválida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de início do período (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do período (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<Payroll>> findByDateBetween(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(payrollService.findByDateBetween(startDate, endDate));
    }
    
    @Operation(summary = "Busca folhas de pagamento por mês",
               description = "Retorna uma lista de folhas de pagamento para um mês específico (ex: 01 para janeiro). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento por mês",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "Mês inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Mês (formato MM)", example = "06", required = true)
    @GetMapping("/month/{month}")
    public ResponseEntity<List<Payroll>> findByMonth(@PathVariable String month) {
        return ResponseEntity.ok(payrollService.findByMonth(month));
    }
    
    @Operation(summary = "Busca folhas de pagamento por ano",
               description = "Retorna uma lista de folhas de pagamento para um ano específico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento por ano",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "Ano inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Ano (formato YYYY)", example = "2024", required = true)
    @GetMapping("/year/{year}")
    public ResponseEntity<List<Payroll>> findByYear(@PathVariable Integer year) {
        return ResponseEntity.ok(payrollService.findByYear(year));
    }
    
    @Operation(summary = "Retorna todas as folhas de pagamento",
               description = "Retorna uma lista de todas as folhas de pagamento cadastradas. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todas as folhas de pagamento",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<Payroll>> findAll() {
        return ResponseEntity.ok(payrollService.findAll());
    }
} 