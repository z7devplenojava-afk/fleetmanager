package com.z7design.fleet_manager.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.model.Payroll;
import com.z7design.fleet_manager.service.PayrollService;
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

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payrolls")
@RequiredArgsConstructor
@Tag(name = "Folhas de Pagamento", description = "Endpoints para gestÃ£o de folhas de pagamento.")
@SecurityRequirement(name = "bearerAuth")
public class PayrollController {
    
    private final PayrollService payrollService;
    private final com.z7design.fleet_manager.service.PayslipService payslipService;
    private final com.z7design.fleet_manager.service.EnvioService envioService;
    
    @Operation(summary = "Cria uma nova folha de pagamento",
               description = "Adiciona uma nova folha de pagamento ao sistema. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Folha de pagamento criada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da folha de pagamento para criaÃ§Ã£o",
            content = @Content(mediaType = "application/json",
                    schema = @Schema(implementation = Payroll.class),
                    examples = @ExampleObject(value = "{\"employee\":{\"id\":\"UUID_DO_FUNCIONARIO\"}, \"issueDate\":\"2024-06-30\", \"grossSalary\":5000.00, \"netSalary\":4500.00, \"totalBenefits\":200.00, \"totalDeductions\":300.00}")))
    @PostMapping
    public ResponseEntity<Payroll> create(@RequestBody Payroll payroll) {
        return ResponseEntity.ok(payrollService.create(payroll));
    }
    
    @Operation(summary = "Atualiza uma folha de pagamento existente",
               description = "Atualiza as informaÃ§Ãµes de uma folha de pagamento pelo seu ID. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Folha de pagamento atualizada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Folha de pagamento nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados da folha de pagamento para atualizaÃ§Ã£o",
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
            @ApiResponse(responseCode = "204", description = "Folha de pagamento excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Folha de pagamento nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        payrollService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @Operation(summary = "Busca uma folha de pagamento pelo ID",
               description = "Retorna as informaÃ§Ãµes de uma folha de pagamento especÃ­fica. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for sua prÃ³pria folha de pagamento).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Folha de pagamento encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Payroll.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Folha de pagamento nÃ£o encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<Payroll> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.findById(id));
    }
    
    @Operation(summary = "Busca folhas de pagamento por ID de funcionÃ¡rio",
               description = "Retorna uma lista de folhas de pagamento associadas a um funcionÃ¡rio especÃ­fico. Requer o papel de ADMIN, GESTOR, SUPERVISOR ou VIGILANTE (se for o prÃ³prio funcionÃ¡rio).")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento do funcionÃ¡rio",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Payroll>> findByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(payrollService.findByEmployeeId(employeeId));
    }
    
    @Operation(summary = "Busca folhas de pagamento por ID da unidade",
               description = "Retorna uma lista de folhas de pagamento associadas a uma unidade especÃ­fica. Requer o papel de ADMIN ou GESTOR.")
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
               description = "Retorna uma lista de folhas de pagamento emitidas dentro de um perÃ­odo especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento por intervalo de datas",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida (formato de data)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "Data de inÃ­cio do perÃ­odo (formato YYYY-MM-DD)", example = "2023-01-01", required = true)
    @Parameter(description = "Data de fim do perÃ­odo (formato YYYY-MM-DD)", example = "2023-12-31", required = true)
    @GetMapping("/date-range")
    public ResponseEntity<List<Payroll>> findByDateBetween(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(payrollService.findByDateBetween(startDate, endDate));
    }
    
    @Operation(summary = "Busca folhas de pagamento por mÃªs",
               description = "Retorna uma lista de folhas de pagamento para um mÃªs especÃ­fico (ex: 01 para janeiro). Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento por mÃªs",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "MÃªs invÃ¡lido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Acesso negado (papel insuficiente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @Parameter(description = "MÃªs (formato MM)", example = "06", required = true)
    @GetMapping("/month/{month}")
    public ResponseEntity<List<Payroll>> findByMonth(@PathVariable String month) {
        return ResponseEntity.ok(payrollService.findByMonth(month));
    }
    
    @Operation(summary = "Busca folhas de pagamento por ano",
               description = "Retorna uma lista de folhas de pagamento para um ano especÃ­fico. Requer o papel de ADMIN ou GESTOR.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de folhas de pagamento por ano",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = Payroll.class))),
            @ApiResponse(responseCode = "400", description = "Ano invÃ¡lido",
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

    // ===== Endpoints adicionais =====
    @PutMapping("/{id}/approve")
    public ResponseEntity<Payroll> approve(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.approve(id));
    }

    @PutMapping("/{id}/paid")
    public ResponseEntity<Payroll> markAsPaid(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String dateStr = body != null ? body.get("paymentDate") : null;
        java.time.LocalDate paymentDate = null;
        if (dateStr != null && !dateStr.isBlank()) {
            paymentDate = java.time.LocalDate.parse(dateStr);
        }
        return ResponseEntity.ok(payrollService.markAsPaid(id, paymentDate));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Payroll> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.cancel(id));
    }

    @GetMapping("/total-salary/{referenceMonth}")
    public ResponseEntity<Double> getTotalSalaryByReferenceMonth(@PathVariable String referenceMonth) {
        return ResponseEntity.ok(payrollService.getTotalNetSalaryByReferenceMonth(referenceMonth));
    }

    @PutMapping("/{id}/reopen")
    public ResponseEntity<Payroll> reopen(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.reopen(id));
    }

    // ===== IntegraÃ§Ãµes com holerite: download e envio por email =====
    @GetMapping("/{employeeCpf}/{month}/{year}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadPayslipByCpfMonthYear(
            @PathVariable String employeeCpf,
            @PathVariable Integer month,
            @PathVariable Integer year) throws java.net.MalformedURLException {
        java.util.Optional<String> pathOpt = payslipService.resolvePayslipPathByCpfMonthYear(employeeCpf, month, year);
        if (pathOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        java.nio.file.Path filePath = java.nio.file.Paths.get(pathOpt.get());
        org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
            .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filePath.getFileName().toString() + "\"")
            .body(resource);
    }

    @PostMapping("/{employeeId}/{month}/{year}/send-email")
    public ResponseEntity<com.z7design.fleet_manager.dto.EnvioResponse> sendPayslipByEmail(
            @PathVariable UUID employeeId,
            @PathVariable Integer month,
            @PathVariable Integer year) {
        // Monta request para envio individual via email
        com.z7design.fleet_manager.dto.EnvioRequest request = new com.z7design.fleet_manager.dto.EnvioRequest();
        request.setTipo("email");
        request.setFuncionarioId(employeeId.toString());
        com.z7design.fleet_manager.dto.EnvioResponse response = envioService.enviarIndividual(request);
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/report.csv")
    public ResponseEntity<String> reportCsv(
            @RequestParam(required = false) String referenceMonth,
            @RequestParam(required = false) String unitId,
            @RequestParam(required = false) String employeeId) {
        // CSV simples: id,employee,cpf,unit,referenceMonth,gross,net,status
        StringBuilder sb = new StringBuilder();
        sb.append("id,employee,cpf,unit,referenceMonth,gross,net,status\n");
        java.util.List<Payroll> all = payrollService.findAll();
        for (Payroll p : all) {
            String empName = p.getEmployee() != null ? p.getEmployee().getName() : "";
            String cpf = p.getEmployee() != null ? p.getEmployee().getDocument() : "";
            String unit = p.getUnit() != null ? p.getUnit().getName() : "";
            sb.append(p.getId()).append(",")
              .append(empName).append(",")
              .append(cpf).append(",")
              .append(unit).append(",")
              .append(p.getReferenceMonth()).append(",")
              .append(p.getGrossSalary() != null ? p.getGrossSalary() : 0).append(",")
              .append(p.getNetSalary() != null ? p.getNetSalary() : 0).append(",")
              .append(p.getStatus() != null ? p.getStatus() : "").append("\n");
        }
        return ResponseEntity.ok()
            .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
            .body(sb.toString());
    }

    // Alias compatÃ­vel com frontend existente
    @GetMapping("/report")
    public ResponseEntity<String> report(
            @RequestParam(required = false) String referenceMonth,
            @RequestParam(required = false) String unitId,
            @RequestParam(required = false) String employeeId) {
        return reportCsv(referenceMonth, unitId, employeeId);
    }

    // CompatÃ­vel com payrollService.ts: sendPayrollByEmail(id, email)
    @PostMapping("/{id}/send-email")
    public ResponseEntity<com.z7design.fleet_manager.dto.EnvioResponse> sendPayrollByEmail(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        Payroll payroll = payrollService.findById(id);
        if (payroll.getEmployee() == null || payroll.getEmployee().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        com.z7design.fleet_manager.dto.EnvioRequest request = new com.z7design.fleet_manager.dto.EnvioRequest();
        request.setTipo("email");
        request.setFuncionarioId(payroll.getEmployee().getId().toString());
        // Campo email no body Ã© opcional e atualmente nÃ£o Ã© utilizado pelo serviÃ§o
        com.z7design.fleet_manager.dto.EnvioResponse response = envioService.enviarIndividual(request);
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadByPayrollId(@PathVariable UUID id) throws java.net.MalformedURLException {
        Payroll payroll = payrollService.findById(id);
        String cpf = payroll.getEmployee() != null ? payroll.getEmployee().getDocument() : null;
        if (cpf == null) {
            return ResponseEntity.notFound().build();
        }
        // referenceMonth formato YYYY-MM
        String[] parts = payroll.getReferenceMonth().split("-");
        if (parts.length != 2) {
            return ResponseEntity.notFound().build();
        }
        Integer year = Integer.parseInt(parts[0]);
        Integer month = Integer.parseInt(parts[1]);
        java.util.Optional<String> pathOpt = payslipService.resolvePayslipPathByCpfMonthYear(cpf, month, year);
        if (pathOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        java.nio.file.Path filePath = java.nio.file.Paths.get(pathOpt.get());
        org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
            .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filePath.getFileName().toString() + "\"")
            .body(resource);
    }
} 
