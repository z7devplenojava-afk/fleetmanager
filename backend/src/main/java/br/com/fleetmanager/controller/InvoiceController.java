package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.InvoiceService;

import br.com.fleetmanager.dto.ClientDTO;
import br.com.fleetmanager.dto.ClientSelectDTO;
import br.com.fleetmanager.dto.InvoiceDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Invoice;
import br.com.fleetmanager.model.enums.ClientStatus;
import br.com.fleetmanager.model.enums.ExpenseStatus;
import br.com.fleetmanager.model.enums.ExpenseType;

import br.com.fleetmanager.service.ClientService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Faturas/Despesas", description = "Endpoints para gestão de faturas e despesas")
public class InvoiceController {
    
    private final InvoiceService invoiceService;
    private final ClientService clientService;
    
    @GetMapping
    @Operation(summary = "Listar todas as faturas", description = "Retorna uma lista paginada de todas as faturas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de faturas retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<InvoiceDTO>> getAll(
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        Page<Invoice> invoices = invoiceService.findAll(pageable);
        Page<InvoiceDTO> dtos = invoices.map(InvoiceDTO::fromEntity);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todas as faturas (sem paginação)", description = "Retorna uma lista completa de todas as faturas")
    public ResponseEntity<List<InvoiceDTO>> getAllWithoutPagination() {
        List<Invoice> invoices = invoiceService.findAll();
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar fatura por ID", description = "Retorna uma fatura específica pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Fatura encontrada"),
            @ApiResponse(responseCode = "404", description = "Fatura não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<InvoiceDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(invoiceService.findById(UUID.fromString(id)).map(InvoiceDTO::fromEntity).orElseThrow(() -> new ResourceNotFoundException("Fatura não encontrada")));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar faturas por status", description = "Retorna faturas com um status específico")
    public ResponseEntity<List<InvoiceDTO>> getByStatus(@PathVariable ExpenseStatus status) {
        List<Invoice> invoices = invoiceService.findByStatus(status);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Buscar faturas por tipo", description = "Retorna faturas de um tipo específico (Fixa/Variável)")
    public ResponseEntity<List<InvoiceDTO>> getByType(@PathVariable ExpenseType type) {
        List<Invoice> invoices = invoiceService.findByType(type);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/supplier/{supplierId}")
    @Operation(summary = "Buscar faturas por fornecedor", description = "Retorna faturas de um fornecedor específico")
    public ResponseEntity<List<InvoiceDTO>> getBySupplier(@PathVariable String supplierId) {
        return ResponseEntity.ok(invoiceService.findBySupplier(UUID.fromString(supplierId)).stream().map(InvoiceDTO::fromEntity).toList());
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Buscar faturas por cliente", description = "Retorna faturas de um cliente específico")
    public ResponseEntity<List<InvoiceDTO>> getByClient(@PathVariable String clientId) {
        return ResponseEntity.ok(invoiceService.findByClient(UUID.fromString(clientId)).stream().map(InvoiceDTO::fromEntity).toList());
    }
    
    @GetMapping("/category/{category}")
    @Operation(summary = "Buscar faturas por categoria", description = "Retorna faturas de uma categoria específica")
    public ResponseEntity<List<InvoiceDTO>> getByCategory(@PathVariable String category) {
        List<Invoice> invoices = invoiceService.findByCategory(category);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/search/invoice-number")
    @Operation(summary = "Buscar números de fatura", description = "Retorna números de fatura que contenham o termo pesquisado")
    public ResponseEntity<List<String>> searchInvoiceNumbers(@RequestParam String term) {
        List<Invoice> invoices = invoiceService.findByInvoiceNumber(term);
        List<String> invoiceNumbers = invoices.stream()
            .map(Invoice::getInvoiceNumber)
            .distinct()
            .collect(Collectors.toList());
        return ResponseEntity.ok(invoiceNumbers);
    }
    
    @GetMapping("/overdue")
    @Operation(summary = "Buscar faturas vencidas", description = "Retorna faturas que estão vencidas")
    public ResponseEntity<List<InvoiceDTO>> getOverdueInvoices() {
        List<Invoice> invoices = invoiceService.findOverdueInvoices();
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/due-soon/{days}")
    @Operation(summary = "Buscar faturas vencendo em breve", description = "Retorna faturas que vencem nos próximos X dias")
    public ResponseEntity<List<InvoiceDTO>> getInvoicesDueSoon(@PathVariable int days) {
        List<Invoice> invoices = invoiceService.findInvoicesDueSoon(days);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/paid-in-period")
    @Operation(summary = "Buscar faturas pagas em período", description = "Retorna faturas pagas em um período específico")
    public ResponseEntity<List<InvoiceDTO>> getPaidInPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Invoice> invoices = invoiceService.findPaidInvoicesInPeriod(startDate, endDate);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/filters")
    @Operation(summary = "Buscar faturas com filtros avançados", description = "Busca faturas aplicando múltiplos filtros")
    public ResponseEntity<Page<InvoiceDTO>> getByAdvancedFilters(
            @RequestParam(required = false) ExpenseStatus status,
            @RequestParam(required = false) ExpenseType type,
            @RequestParam(required = false) java.util.UUID supplierId,
            @RequestParam(required = false) java.util.UUID clientId,
            @RequestParam(required = false) UUID unitId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Pageable pageable) {
        Page<Invoice> invoices = invoiceService.findByAdvancedFilters(status, type, supplierId, clientId, unitId, category, description, startDate, endDate, pageable);
        Page<InvoiceDTO> dtos = invoices.map(InvoiceDTO::fromEntity);
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping
    @Operation(summary = "Criar nova fatura", description = "Cria uma nova fatura no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Fatura criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<InvoiceDTO> create(@Valid @RequestBody InvoiceDTO invoiceDTO) {
        try {
            log.info("POST /api/invoices - Criando nova fatura");
            log.info("Dados recebidos: {}", invoiceDTO);
            
            // Criar nova fatura e mapear dados do DTO
            Invoice invoice = new Invoice();
            invoiceService.updateInvoiceFromDTO(invoice, invoiceDTO);
            
            // Salvar a fatura
            Invoice saved = invoiceService.save(invoice);
            
            log.info("✅ Fatura criada com sucesso - ID: {}", saved.getId());
            return ResponseEntity.ok(InvoiceDTO.fromEntity(saved));
            
        } catch (Exception e) {
            log.error("❌ Erro ao criar fatura: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar fatura", description = "Atualiza os dados de uma fatura existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Fatura atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "404", description = "Fatura não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<InvoiceDTO> update(@PathVariable String id, @Valid @RequestBody InvoiceDTO invoiceDTO) {
        try {
            log.info("PUT /api/invoices/{} - Atualizando fatura", id);
            log.info("Dados recebidos: {}", invoiceDTO);
            
            // Validações específicas
            if (invoiceDTO.getDescription() == null || invoiceDTO.getDescription().trim().isEmpty()) {
                log.error("Descrição é obrigatória");
                return ResponseEntity.badRequest().build();
            }
            
            if (invoiceDTO.getAmount() == null || invoiceDTO.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                log.error("Valor é obrigatório e deve ser maior que zero");
                return ResponseEntity.badRequest().build();
            }
            
            if (invoiceDTO.getStatus() == null) {
                log.error("Status é obrigatório");
                return ResponseEntity.badRequest().build();
            }
            
            if (invoiceDTO.getIssueDate() == null) {
                log.error("Data de emissão é obrigatória");
                return ResponseEntity.badRequest().build();
            }
            
            if (invoiceDTO.getDueDate() == null) {
                log.error("Data de vencimento é obrigatória");
                return ResponseEntity.badRequest().build();
            }
            
            Invoice updated = invoiceService.update(UUID.fromString(id), invoiceDTO);
            
            log.info("✅ Fatura atualizada com sucesso - ID: {}", updated.getId());
            return ResponseEntity.ok(InvoiceDTO.fromEntity(updated));
            
        } catch (Exception e) {
            log.error("❌ Erro ao atualizar fatura: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir fatura", description = "Exclui uma fatura do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Fatura excluída com sucesso"),
            @ApiResponse(responseCode = "404", description = "Fatura não encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        invoiceService.deleteById(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status da fatura", description = "Atualiza apenas o status de uma fatura")
    public ResponseEntity<InvoiceDTO> updateStatus(@PathVariable String id, @RequestParam ExpenseStatus status) {
        Invoice updated = invoiceService.updateStatus(UUID.fromString(id), status);
        return ResponseEntity.ok(InvoiceDTO.fromEntity(updated));
    }
    
    @PatchMapping("/{id}/mark-as-paid")
    @Operation(summary = "Marcar fatura como paga", description = "Marca uma fatura como paga")
    public ResponseEntity<InvoiceDTO> markAsPaid(@PathVariable String id, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate paymentDate) {
        Invoice updated = invoiceService.markAsPaid(UUID.fromString(id), paymentDate);
        return ResponseEntity.ok(InvoiceDTO.fromEntity(updated));
    }
    
    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancelar fatura", description = "Cancela uma fatura")
    public ResponseEntity<InvoiceDTO> cancel(@PathVariable String id) {
        Invoice updated = invoiceService.cancel(UUID.fromString(id));
        return ResponseEntity.ok(InvoiceDTO.fromEntity(updated));
    }
    
    // Endpoints de relatórios
    @GetMapping("/reports/amount-by-status")
    @Operation(summary = "Relatório de valores por status", description = "Retorna o valor total das faturas agrupado por status")
    public ResponseEntity<List<Object[]>> getAmountByStatus() {
        return ResponseEntity.ok(invoiceService.getAmountByStatus());
    }
    
    @GetMapping("/reports/amount-by-type")
    @Operation(summary = "Relatório de valores por tipo", description = "Retorna o valor total das faturas agrupado por tipo (Fixa/Variável)")
    public ResponseEntity<List<Object[]>> getAmountByType() {
        return ResponseEntity.ok(invoiceService.getAmountByType());
    }
    
    @GetMapping("/reports/amount-by-supplier")
    @Operation(summary = "Relatório de valores por fornecedor", description = "Retorna o valor total das faturas agrupado por fornecedor")
    public ResponseEntity<List<Object[]>> getAmountBySupplier() {
        return ResponseEntity.ok(invoiceService.getAmountBySupplier());
    }
    
    @GetMapping("/reports/amount-by-category")
    @Operation(summary = "Relatório de valores por categoria", description = "Retorna o valor total das faturas agrupado por categoria")
    public ResponseEntity<List<Object[]>> getAmountByCategory() {
        return ResponseEntity.ok(invoiceService.getAmountByCategory());
    }
    
    @GetMapping("/reports/count-by-status")
    @Operation(summary = "Relatório de contagem por status", description = "Retorna a quantidade de faturas agrupada por status")
    public ResponseEntity<List<Object[]>> getCountByStatus() {
        return ResponseEntity.ok(invoiceService.getCountByStatus());
    }
    
    @GetMapping("/reports/count-by-type")
    @Operation(summary = "Relatório de contagem por tipo", description = "Retorna a quantidade de faturas agrupada por tipo")
    public ResponseEntity<List<Object[]>> getCountByType() {
        return ResponseEntity.ok(invoiceService.getCountByType());
    }
    
    @GetMapping("/reports/total-paid-in-period")
    @Operation(summary = "Total pago em período", description = "Retorna o valor total pago em um período específico")
    public ResponseEntity<BigDecimal> getTotalPaidInPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(invoiceService.getTotalPaidInPeriod(startDate, endDate));
    }
    
    @GetMapping("/reports/total-pending")
    @Operation(summary = "Total pendente", description = "Retorna o valor total das faturas pendentes")
    public ResponseEntity<BigDecimal> getTotalPending() {
        return ResponseEntity.ok(invoiceService.getTotalPending());
    }
    
    @GetMapping("/reports/total-overdue")
    @Operation(summary = "Total vencido", description = "Retorna o valor total das faturas vencidas")
    public ResponseEntity<BigDecimal> getTotalOverdue() {
        return ResponseEntity.ok(invoiceService.getTotalOverdue());
    }
    
    @GetMapping("/reports/summary")
    @Operation(summary = "Resumo financeiro", description = "Retorna um resumo completo das faturas (pendentes, vencidas, pagas)")
    public ResponseEntity<Map<String, Object>> getFinancialSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPending", invoiceService.getTotalPending());
        summary.put("totalOverdue", invoiceService.getTotalOverdue());
        summary.put("totalPaid", invoiceService.getTotalPaidInPeriod(LocalDate.now().minusMonths(1), LocalDate.now()));
        summary.put("countPending", invoiceService.findByStatus(ExpenseStatus.PENDENTE).size());
        summary.put("countOverdue", invoiceService.findOverdueInvoices().size());
        return ResponseEntity.ok(summary);
    }
    
    // ---- Relatórios por Centro de Custo ----
    @GetMapping("/reports/by-cost-center")
    @Operation(summary = "Relatório por centro de custo", description = "Retorna total e lista de faturas por centro de custo e período")
    public ResponseEntity<CostCenterReport> reportByCostCenter(
            @RequestParam(required = false) String centro,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        CostCenterReport r = new CostCenterReport();
        r.total = invoiceService.getTotalByCostCenterAndPeriod(centro, startDate, endDate);
        r.items = invoiceService.getInvoicesByCostCenterAndPeriod(centro, startDate, endDate)
                .stream().map(InvoiceDTO::fromEntity).toList();
        return ResponseEntity.ok(r);
    }

    public static class CostCenterReport {
        public java.math.BigDecimal total;
        public java.util.List<InvoiceDTO> items;
    }
    
    // Novos endpoints para busca por unidade
    @GetMapping("/unit/{unitId}")
    @Operation(summary = "Buscar faturas por unidade", description = "Retorna faturas de uma unidade específica")
    public ResponseEntity<List<InvoiceDTO>> getByUnit(@PathVariable UUID unitId) {
        List<Invoice> invoices = invoiceService.findByUnit(unitId);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/status/{status}")
    @Operation(summary = "Buscar faturas por unidade e status", description = "Retorna faturas de uma unidade com status específico")
    public ResponseEntity<List<InvoiceDTO>> getByUnitAndStatus(@PathVariable UUID unitId, @PathVariable ExpenseStatus status) {
        List<Invoice> invoices = invoiceService.findByUnitAndStatus(unitId, status);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/type/{type}")
    @Operation(summary = "Buscar faturas por unidade e tipo", description = "Retorna faturas de uma unidade com tipo específico")
    public ResponseEntity<List<InvoiceDTO>> getByUnitAndType(@PathVariable UUID unitId, @PathVariable ExpenseType type) {
        List<Invoice> invoices = invoiceService.findByUnitAndType(unitId, type);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/category/{category}")
    @Operation(summary = "Buscar faturas por unidade e categoria", description = "Retorna faturas de uma unidade com categoria específica")
    public ResponseEntity<List<InvoiceDTO>> getByUnitAndCategory(@PathVariable UUID unitId, @PathVariable String category) {
        List<Invoice> invoices = invoiceService.findByUnitAndCategory(unitId, category);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/overdue")
    @Operation(summary = "Buscar faturas vencidas por unidade", description = "Retorna faturas vencidas de uma unidade específica")
    public ResponseEntity<List<InvoiceDTO>> getOverdueByUnit(@PathVariable UUID unitId) {
        List<Invoice> invoices = invoiceService.findOverdueInvoicesByUnit(unitId);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/due-soon/{days}")
    @Operation(summary = "Buscar faturas vencendo em breve por unidade", description = "Retorna faturas vencendo em breve de uma unidade específica")
    public ResponseEntity<List<InvoiceDTO>> getDueSoonByUnit(@PathVariable UUID unitId, @PathVariable int days) {
        List<Invoice> invoices = invoiceService.findInvoicesDueSoonByUnit(unitId, days);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/unit/{unitId}/paid-in-period")
    @Operation(summary = "Buscar faturas pagas em período por unidade", description = "Retorna faturas pagas em um período específico de uma unidade")
    public ResponseEntity<List<InvoiceDTO>> getPaidInPeriodByUnit(
            @PathVariable UUID unitId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Invoice> invoices = invoiceService.findPaidInvoicesInPeriodByUnit(unitId, startDate, endDate);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/units")
    @Operation(summary = "Buscar faturas por múltiplas unidades", description = "Retorna faturas de múltiplas unidades")
    public ResponseEntity<List<InvoiceDTO>> getByUnits(
            @RequestParam List<UUID> unitIds,
            @RequestParam(required = false) ExpenseStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (status != null) {
            List<Invoice> invoices = invoiceService.findByUnitsAndStatus(unitIds, status);
            List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }
        if (startDate != null && endDate != null) {
            List<Invoice> invoices = invoiceService.findByUnitsAndPeriod(unitIds, startDate, endDate);
            List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }
        List<Invoice> invoices = invoiceService.findByUnits(unitIds);
        List<InvoiceDTO> dtos = invoices.stream().map(InvoiceDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    // Relatórios por unidade
    @GetMapping("/unit/{unitId}/reports/amount-by-status")
    @Operation(summary = "Relatório de valores por status por unidade", description = "Retorna o valor total das faturas agrupado por status para uma unidade")
    public ResponseEntity<List<Object[]>> getAmountByStatusAndUnit(@PathVariable UUID unitId) {
        return ResponseEntity.ok(invoiceService.getAmountByStatusAndUnit(unitId));
    }
    
    @GetMapping("/unit/{unitId}/reports/amount-by-type")
    @Operation(summary = "Relatório de valores por tipo por unidade", description = "Retorna o valor total das faturas agrupado por tipo para uma unidade")
    public ResponseEntity<List<Object[]>> getAmountByTypeAndUnit(@PathVariable UUID unitId) {
        return ResponseEntity.ok(invoiceService.getAmountByTypeAndUnit(unitId));
    }
    
    @GetMapping("/unit/{unitId}/reports/amount-by-category")
    @Operation(summary = "Relatório de valores por categoria por unidade", description = "Retorna o valor total das faturas agrupado por categoria para uma unidade")
    public ResponseEntity<List<Object[]>> getAmountByCategoryAndUnit(@PathVariable UUID unitId) {
        return ResponseEntity.ok(invoiceService.getAmountByCategoryAndUnit(unitId));
    }
    
    @GetMapping("/unit/{unitId}/reports/total-pending")
    @Operation(summary = "Total pendente por unidade", description = "Retorna o valor total das faturas pendentes de uma unidade")
    public ResponseEntity<BigDecimal> getTotalPendingByUnit(@PathVariable UUID unitId) {
        return ResponseEntity.ok(invoiceService.getTotalPendingByUnit(unitId));
    }
    
    @GetMapping("/unit/{unitId}/reports/total-overdue")
    @Operation(summary = "Total vencido por unidade", description = "Retorna o valor total das faturas vencidas de uma unidade")
    public ResponseEntity<BigDecimal> getTotalOverdueByUnit(@PathVariable UUID unitId) {
        return ResponseEntity.ok(invoiceService.getTotalOverdueByUnit(unitId));
    }
    
    @GetMapping("/unit/{unitId}/reports/total-paid-in-period")
    @Operation(summary = "Total pago em período por unidade", description = "Retorna o valor total pago em um período específico de uma unidade")
    public ResponseEntity<BigDecimal> getTotalPaidInPeriodByUnit(
            @PathVariable UUID unitId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(invoiceService.getTotalPaidInPeriodByUnit(unitId, startDate, endDate));
    }
    
    @GetMapping("/clients")
    @Operation(summary = "Listar clientes ativos", description = "Retorna uma lista simplificada de clientes ativos para seleção em formulários de faturas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de clientes ativos retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<ClientSelectDTO>> getActiveClients() {
        List<ClientDTO> clients = clientService.getClientsByStatus(ClientStatus.ACTIVE);
        List<ClientSelectDTO> selectClients = clients.stream()
                .map(ClientSelectDTO::fromClientDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(selectClients);
    }
    
    @GetMapping("/categories")
    @Operation(summary = "Listar categorias únicas", description = "Retorna uma lista de todas as categorias únicas usadas nas faturas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de categorias retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<String>> getDistinctCategories() {
        List<String> categories = invoiceService.getDistinctCategories();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/cost-centers")
    @Operation(summary = "Listar centros de custo", description = "Retorna uma lista de todos os centros de custo ativos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de centros de custo retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<String>> getDistinctCostCenters() {
        List<String> costCenters = invoiceService.getDistinctCostCenters();
        return ResponseEntity.ok(costCenters);
    }
    
    @GetMapping("/test-cost-centers")
    @Operation(summary = "Teste - Listar centros de custo", description = "Endpoint de teste para verificar centros de custo")
    public ResponseEntity<List<String>> testCostCenters() {
        try {
            List<String> costCenters = invoiceService.getDistinctCostCenters();
            log.info("Centros de custo encontrados: {}", costCenters);
            return ResponseEntity.ok(costCenters);
        } catch (Exception e) {
            log.error("Erro ao buscar centros de custo", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/public/test-cost-centers")
    @Operation(summary = "Teste público - Listar centros de custo", description = "Endpoint público de teste para verificar centros de custo")
    public ResponseEntity<List<String>> testCostCentersPublic() {
        try {
            List<String> costCenters = invoiceService.getAllCostCenterNames();
            log.info("Centros de custo encontrados (público): {}", costCenters);
            return ResponseEntity.ok(costCenters);
        } catch (Exception e) {
            log.error("Erro ao buscar centros de custo (público)", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/public/debug-cost-centers")
    @Operation(summary = "Debug - Informações sobre centros de custo", description = "Endpoint público de debug para verificar dados de centros de custo")
    public ResponseEntity<Map<String, Object>> debugCostCenters() {
        try {
            Map<String, Object> debug = new HashMap<>();
            
            // Buscar centros de custo da tabela cost_centers (ativos)
            List<String> costCentersFromTable = invoiceService.getDistinctCostCenters();
            debug.put("costCentersFromTable", costCentersFromTable);
            debug.put("costCentersCount", costCentersFromTable.size());
            
            // Buscar todos os centros de custo da tabela cost_centers
            List<String> allCostCentersFromTable = invoiceService.getAllCostCenterNames();
            debug.put("allCostCentersFromTable", allCostCentersFromTable);
            debug.put("allCostCentersCount", allCostCentersFromTable.size());
            
            // Buscar centros de custo da tabela invoices
            List<String> costCentersFromInvoices = invoiceService.getDistinctCostCentersFromInvoices();
            debug.put("costCentersFromInvoices", costCentersFromInvoices);
            debug.put("costCentersFromInvoicesCount", costCentersFromInvoices.size());
            
            log.info("Debug centros de custo: {}", debug);
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            log.error("Erro ao fazer debug de centros de custo", e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 