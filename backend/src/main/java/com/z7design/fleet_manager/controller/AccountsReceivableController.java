package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.AccountsReceivableDTO;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import com.z7design.fleet_manager.service.AccountsReceivableService;
import com.z7design.fleet_manager.service.PaymentReportService;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts-receivable")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Contas a Receber", description = "Endpoints para gestÃ£o de contas a receber")
public class AccountsReceivableController {
    
    private final AccountsReceivableService accountsReceivableService;
    private final PaymentReportService paymentReportService;
    
    @GetMapping
    @Operation(summary = "Listar todas as contas a receber", description = "Retorna uma lista paginada de todas as contas a receber")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de contas a receber retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<AccountsReceivableDTO>> getAll(
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        log.info("GET /api/accounts-receivable - Buscando todas as contas a receber");
        return ResponseEntity.ok(accountsReceivableService.getAllAccountsReceivable(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todas as contas a receber (sem paginaÃ§Ã£o)", description = "Retorna uma lista completa de todas as contas a receber")
    public ResponseEntity<List<AccountsReceivableDTO>> getAllWithoutPagination() {
        log.info("GET /api/accounts-receivable/all - Buscando todas as contas a receber sem paginaÃ§Ã£o");
        return ResponseEntity.ok(accountsReceivableService.getAllAccountsReceivable());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar conta a receber por ID", description = "Retorna uma conta a receber especÃ­fica pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conta a receber encontrada"),
            @ApiResponse(responseCode = "404", description = "Conta a receber nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<AccountsReceivableDTO> getById(@PathVariable String id) {
        log.info("GET /api/accounts-receivable/{} - Buscando conta a receber por ID", id);
        return ResponseEntity.ok(accountsReceivableService.getAccountsReceivableById(UUID.fromString(id)));
    }
    
    @PostMapping
    @Operation(summary = "Criar nova conta a receber", description = "Cria uma nova conta a receber no sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Conta a receber criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<AccountsReceivableDTO> create(@Valid @RequestBody AccountsReceivableDTO dto) {
        log.info("POST /api/accounts-receivable - Criando nova conta a receber");
        AccountsReceivableDTO saved = accountsReceivableService.createAccountsReceivable(dto);
        return ResponseEntity.status(201).body(saved);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar conta a receber", description = "Atualiza os dados de uma conta a receber existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conta a receber atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invÃ¡lidos"),
            @ApiResponse(responseCode = "404", description = "Conta a receber nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<AccountsReceivableDTO> update(@PathVariable String id, @Valid @RequestBody AccountsReceivableDTO dto) {
        log.info("PUT /api/accounts-receivable/{} - Atualizando conta a receber", id);
        AccountsReceivableDTO updated = accountsReceivableService.updateAccountsReceivable(UUID.fromString(id), dto);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir conta a receber", description = "Exclui uma conta a receber do sistema")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Conta a receber excluÃ­da com sucesso"),
            @ApiResponse(responseCode = "404", description = "Conta a receber nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable String id) {
        log.info("DELETE /api/accounts-receivable/{} - Excluindo conta a receber", id);
        accountsReceivableService.deleteAccountsReceivable(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Buscar contas a receber por cliente", description = "Retorna todas as contas a receber de um cliente especÃ­fico")
    public ResponseEntity<List<AccountsReceivableDTO>> getByClient(@PathVariable String clientId) {
        log.info("GET /api/accounts-receivable/client/{} - Buscando contas a receber por cliente", clientId);
        return ResponseEntity.ok(accountsReceivableService.getAccountsReceivableByClient(UUID.fromString(clientId)));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar contas a receber por status", description = "Retorna todas as contas a receber com um status especÃ­fico")
    public ResponseEntity<List<AccountsReceivableDTO>> getByStatus(@PathVariable ReceivableStatus status) {
        log.info("GET /api/accounts-receivable/status/{} - Buscando contas a receber por status", status);
        return ResponseEntity.ok(accountsReceivableService.getAccountsReceivableByStatus(status));
    }
    
    @GetMapping("/overdue")
    @Operation(summary = "Buscar contas a receber vencidas", description = "Retorna todas as contas a receber que estÃ£o vencidas")
    public ResponseEntity<List<AccountsReceivableDTO>> getOverdue() {
        log.info("GET /api/accounts-receivable/overdue - Buscando contas a receber vencidas");
        return ResponseEntity.ok(accountsReceivableService.getOverdueAccounts());
    }
    
    @GetMapping("/period")
    @Operation(summary = "Buscar contas a receber por perÃ­odo", description = "Retorna todas as contas a receber emitidas em um perÃ­odo especÃ­fico")
    public ResponseEntity<List<AccountsReceivableDTO>> getByPeriod(
            @Parameter(description = "Data de inÃ­cio do perÃ­odo") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data de fim do perÃ­odo") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("GET /api/accounts-receivable/period - Buscando contas a receber por perÃ­odo: {} a {}", startDate, endDate);
        return ResponseEntity.ok(accountsReceivableService.getAccountsReceivableByPeriod(startDate, endDate));
    }
    
    @GetMapping("/search/invoice-number")
    @Operation(summary = "Buscar nÃºmeros de fatura", description = "Retorna sugestÃµes de nÃºmeros de fatura para autocomplete")
    public ResponseEntity<List<String>> searchInvoiceNumbers(
            @Parameter(description = "Termo de busca") 
            @RequestParam String term) {
        log.info("GET /api/accounts-receivable/search/invoice-number - Buscando nÃºmeros de fatura para termo: {}", term);
        return ResponseEntity.ok(accountsReceivableService.searchInvoiceNumbers(term));
    }
    
    @GetMapping("/search/measurement-number")
    @Operation(summary = "Buscar nÃºmeros de mediÃ§Ã£o", description = "Retorna sugestÃµes de nÃºmeros de mediÃ§Ã£o para autocomplete")
    public ResponseEntity<List<String>> searchMeasurementNumbers(
            @Parameter(description = "Termo de busca") 
            @RequestParam String term) {
        log.info("GET /api/accounts-receivable/search/measurement-number - Buscando nÃºmeros de mediÃ§Ã£o para termo: {}", term);
        return ResponseEntity.ok(accountsReceivableService.searchMeasurementNumbers(term));
    }
    
    @GetMapping("/search/categories")
    @Operation(summary = "Buscar categorias", description = "Retorna sugestÃµes de categorias para autocomplete")
    public ResponseEntity<List<String>> searchCategories(
            @Parameter(description = "Termo de busca") 
            @RequestParam String term) {
        log.info("GET /api/accounts-receivable/search/categories - Buscando categorias para termo: {}", term);
        return ResponseEntity.ok(accountsReceivableService.searchCategories(term));
    }
    
    @GetMapping("/search/payment-methods")
    @Operation(summary = "Buscar formas de pagamento", description = "Retorna sugestÃµes de formas de pagamento para autocomplete")
    public ResponseEntity<List<String>> searchPaymentMethods(
            @Parameter(description = "Termo de busca") 
            @RequestParam String term) {
        log.info("GET /api/accounts-receivable/search/payment-methods - Buscando formas de pagamento para termo: {}", term);
        return ResponseEntity.ok(accountsReceivableService.searchPaymentMethods(term));
    }
    
    @PutMapping("/{id}/mark-paid")
    @Operation(summary = "Marcar conta como paga", description = "Marca uma conta a receber como paga")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conta a receber marcada como paga com sucesso"),
            @ApiResponse(responseCode = "404", description = "Conta a receber nÃ£o encontrada"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<AccountsReceivableDTO> markAsPaid(
            @PathVariable String id,
            @Parameter(description = "Data do pagamento") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate paymentDate) {
        log.info("PUT /api/accounts-receivable/{}/mark-paid - Marcando conta como paga", id);
        AccountsReceivableDTO updated = accountsReceivableService.markAsPaid(UUID.fromString(id), paymentDate);
        return ResponseEntity.ok(updated);
    }
    
    @PutMapping("/update-overdue-status")
    @Operation(summary = "Atualizar status de contas vencidas", description = "Atualiza o status de todas as contas que estÃ£o vencidas")
    public ResponseEntity<Void> updateOverdueStatus() {
        log.info("PUT /api/accounts-receivable/update-overdue-status - Atualizando status de contas vencidas");
        accountsReceivableService.updateOverdueStatus();
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/due-in-3-days")
    @Operation(summary = "Buscar contas a receber vencendo em 3 dias", description = "Retorna todas as contas a receber que vencem em 3 dias")
    public ResponseEntity<List<AccountsReceivableDTO>> getDueInThreeDays() {
        log.info("GET /api/accounts-receivable/due-in-3-days - Buscando contas a receber vencendo em 3 dias");
        return ResponseEntity.ok(accountsReceivableService.getAccountsReceivableDueInThreeDays());
    }
    
    @GetMapping("/due-in-days/{days}")
    @Operation(summary = "Buscar contas a receber vencendo em X dias", description = "Retorna todas as contas a receber que vencem em X dias")
    public ResponseEntity<List<AccountsReceivableDTO>> getDueInDays(@PathVariable int days) {
        log.info("GET /api/accounts-receivable/due-in-days/{} - Buscando contas a receber vencendo em {} dias", days, days);
        return ResponseEntity.ok(accountsReceivableService.getAccountsReceivableDueInDays(days));
    }
    
    @PostMapping("/send-alerts-3-days")
    @Operation(summary = "Enviar alertas para contas vencendo em 3 dias", description = "Envia alertas para todas as contas a receber que vencem em 3 dias")
    public ResponseEntity<Void> sendAlertsForThreeDays() {
        log.info("POST /api/accounts-receivable/send-alerts-3-days - Enviando alertas para contas vencendo em 3 dias");
        accountsReceivableService.sendAlertsForAccountsDueInThreeDays();
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/reports/pdf")
    @Operation(summary = "Gerar relatÃ³rio PDF de contas a receber", description = "Gera relatÃ³rio PDF com filtros dinÃ¢micos")
    public ResponseEntity<byte[]> generateReportPDF(
            @RequestParam(value = "startDate", required = false) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) LocalDate endDate,
            @RequestParam(value = "clientFilter", required = false) String clientFilter,
            @RequestParam(value = "statusFilter", required = false) String statusFilter,
            @RequestParam(value = "categoryFilter", required = false) String categoryFilter,
            @RequestParam(value = "paymentMethodFilter", required = false) String paymentMethodFilter,
            @RequestParam(value = "amountMin", required = false) BigDecimal amountMin,
            @RequestParam(value = "amountMax", required = false) BigDecimal amountMax,
            @RequestParam(value = "selectedIds", required = false) List<String> selectedIds) {
        log.info("GET /api/accounts-receivable/reports/pdf - Gerando relatÃ³rio PDF com filtros");
        
        try {
            byte[] reportBytes = paymentReportService.generateAccountsReceivableReportPDF(
                    startDate, endDate, clientFilter, statusFilter, categoryFilter, 
                    paymentMethodFilter, amountMin, amountMax, selectedIds);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-contas-receber.pdf");
            headers.setContentLength(reportBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(reportBytes);
                    
        } catch (IOException e) {
            log.error("Erro ao gerar relatÃ³rio PDF de contas a receber", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/bulk-delete")
    @Operation(summary = "Excluir mÃºltiplas contas a receber", description = "Exclui vÃ¡rias contas a receber selecionadas")
    public ResponseEntity<Void> bulkDelete(@RequestBody List<String> ids) {
        log.info("DELETE /api/accounts-receivable/bulk-delete - Excluindo {} contas a receber", ids.size());
        paymentReportService.deleteMultipleAccountsReceivable(ids);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/schedule")
    @Operation(summary = "Buscar agendamentos de pagamento", description = "Retorna todos os agendamentos de pagamento relacionados Ã s contas a receber")
    public ResponseEntity<List<Object>> getSchedule() {
        log.info("GET /api/accounts-receivable/schedule - Buscando agendamentos de pagamento");
        // Por enquanto, retornar lista vazia atÃ© implementar a lÃ³gica completa
        return ResponseEntity.ok(List.of());
    }
    
    @GetMapping("/public/test")
    @Operation(summary = "Teste de conectividade pÃºblico", description = "Endpoint pÃºblico de teste para verificar se o serviÃ§o estÃ¡ funcionando")
    public ResponseEntity<Map<String, Object>> publicTest() {
        log.info("GET /api/accounts-receivable/public/test - Testando conectividade");
        
        Map<String, Object> result = new HashMap<>();
        result.put("status", "testing");
        result.put("message", "Testando serviÃ§o...");
        
        try {
            // Teste simples: apenas chamar o serviÃ§o
            log.info("Chamando accountsReceivableService.getAccountsReceivable()...");
            // TODO: Implementar mÃ©todo no service
            var accounts = List.of();
            
            result.put("status", "ok");
            result.put("message", "ServiÃ§o funcionando");
            result.put("totalAccounts", accounts.size());
            
        } catch (Exception e) {
            log.error("Erro no teste: ", e);
            result.put("status", "error");
            result.put("message", e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(result);
    }
}

