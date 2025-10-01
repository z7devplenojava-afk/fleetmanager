package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.ScheduledPaymentService;

import br.com.fleetmanager.dto.ScheduledPaymentDTO;
import br.com.fleetmanager.model.enums.ScheduledPaymentStatus;

import br.com.fleetmanager.service.PaymentReportService;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/scheduled-payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Pagamentos Agendados", description = "Endpoints para gestão de pagamentos agendados")
public class ScheduledPaymentController {

    private final ScheduledPaymentService scheduledPaymentService;
    private final PaymentReportService paymentReportService;
    
    @GetMapping
    @Operation(summary = "Listar todos os pagamentos agendados", description = "Retorna uma lista paginada de todos os pagamentos agendados")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de pagamentos agendados retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Page<ScheduledPaymentDTO>> getAll(
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        log.info("GET /api/scheduled-payments - Buscando todos os pagamentos agendados");
        return ResponseEntity.ok(scheduledPaymentService.getAllScheduledPayments(pageable));
    }
    
    @GetMapping("/all")
    @Operation(summary = "Listar todos os pagamentos agendados (sem paginação)", description = "Retorna uma lista completa de todos os pagamentos agendados")
    public ResponseEntity<List<ScheduledPaymentDTO>> getAllWithoutPagination() {
        log.info("GET /api/scheduled-payments/all - Buscando todos os pagamentos agendados sem paginação");
        return ResponseEntity.ok(scheduledPaymentService.getAllScheduledPayments());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar pagamento agendado por ID", description = "Retorna um pagamento agendado específico pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pagamento agendado encontrado"),
            @ApiResponse(responseCode = "404", description = "Pagamento agendado não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ScheduledPaymentDTO> getById(@PathVariable UUID id) {
        log.info("GET /api/scheduled-payments/{} - Buscando pagamento agendado por ID", id);
        return ResponseEntity.ok(scheduledPaymentService.getScheduledPaymentById(id));
    }
    
    @PostMapping
    @Operation(summary = "Criar novo pagamento agendado", description = "Cria um novo pagamento agendado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Pagamento agendado criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ScheduledPaymentDTO> create(@Valid @RequestBody ScheduledPaymentDTO dto) {
        log.info("POST /api/scheduled-payments - Criando novo pagamento agendado");
        ScheduledPaymentDTO created = scheduledPaymentService.createScheduledPayment(dto);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar pagamento agendado", description = "Atualiza um pagamento agendado existente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pagamento agendado atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Pagamento agendado não encontrado"),
            @ApiResponse(responseCode = "400", description = "Dados inválidos"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ScheduledPaymentDTO> update(@PathVariable UUID id, @Valid @RequestBody ScheduledPaymentDTO dto) {
        log.info("PUT /api/scheduled-payments/{} - Atualizando pagamento agendado", id);
        ScheduledPaymentDTO updated = scheduledPaymentService.updateScheduledPayment(id, dto);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar pagamento agendado", description = "Deleta um pagamento agendado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Pagamento agendado deletado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Pagamento agendado não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        log.info("DELETE /api/scheduled-payments/{} - Deletando pagamento agendado", id);
        scheduledPaymentService.deleteScheduledPayment(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/client/{clientId}")
    @Operation(summary = "Buscar pagamentos agendados por cliente", description = "Retorna todos os pagamentos agendados de um cliente específico")
    public ResponseEntity<List<ScheduledPaymentDTO>> getByClient(@PathVariable UUID clientId) {
        log.info("GET /api/scheduled-payments/client/{} - Buscando pagamentos agendados por cliente", clientId);
        return ResponseEntity.ok(scheduledPaymentService.getScheduledPaymentsByClient(clientId));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar pagamentos agendados por status", description = "Retorna todos os pagamentos agendados com um status específico")
    public ResponseEntity<List<ScheduledPaymentDTO>> getByStatus(@PathVariable ScheduledPaymentStatus status) {
        log.info("GET /api/scheduled-payments/status/{} - Buscando pagamentos agendados por status", status);
        return ResponseEntity.ok(scheduledPaymentService.getScheduledPaymentsByStatus(status));
    }
    
    @GetMapping("/due-in-3-days")
    @Operation(summary = "Buscar pagamentos vencendo em 3 dias", description = "Retorna todos os pagamentos agendados que vencem em 3 dias")
    public ResponseEntity<List<ScheduledPaymentDTO>> getDueInThreeDays() {
        log.info("GET /api/scheduled-payments/due-in-3-days - Buscando pagamentos vencendo em 3 dias");
        return ResponseEntity.ok(scheduledPaymentService.getPaymentsDueInThreeDays());
    }
    
    @GetMapping("/overdue")
    @Operation(summary = "Buscar pagamentos vencidos", description = "Retorna todos os pagamentos agendados que estão vencidos")
    public ResponseEntity<List<ScheduledPaymentDTO>> getOverdue() {
        log.info("GET /api/scheduled-payments/overdue - Buscando pagamentos vencidos");
        return ResponseEntity.ok(scheduledPaymentService.getOverduePayments());
    }
    
    @PutMapping("/{id}/mark-executed")
    @Operation(summary = "Marcar pagamento como executado", description = "Marca um pagamento agendado como executado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pagamento agendado marcado como executado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Pagamento agendado não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ScheduledPaymentDTO> markAsExecuted(
            @PathVariable UUID id,
            @Parameter(description = "Data da execução") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate executionDate) {
        log.info("PUT /api/scheduled-payments/{}/mark-executed - Marcando pagamento como executado", id);
        ScheduledPaymentDTO updated = scheduledPaymentService.markAsExecuted(id, executionDate);
        return ResponseEntity.ok(updated);
    }
    
    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancelar pagamento agendado", description = "Cancela um pagamento agendado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pagamento agendado cancelado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Pagamento agendado não encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<ScheduledPaymentDTO> cancel(@PathVariable UUID id) {
        log.info("PUT /api/scheduled-payments/{}/cancel - Cancelando pagamento agendado", id);
        ScheduledPaymentDTO updated = scheduledPaymentService.cancelScheduledPayment(id);
        return ResponseEntity.ok(updated);
    }
    
    @PostMapping("/send-alerts")
    @Operation(summary = "Enviar alertas para pagamentos vencendo em 3 dias", description = "Envia alertas para todos os pagamentos que vencem em 3 dias")
    public ResponseEntity<Void> sendAlerts() {
        log.info("POST /api/scheduled-payments/send-alerts - Enviando alertas para pagamentos vencendo em 3 dias");
        scheduledPaymentService.sendAlertsForPaymentsDueInThreeDays();
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/reports/pdf")
    @Operation(summary = "Gerar relatório PDF de pagamentos agendados", description = "Gera relatório PDF com filtros dinâmicos")
    public ResponseEntity<byte[]> generateReportPDF(
            @RequestParam(value = "startDate", required = false) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) LocalDate endDate,
            @RequestParam(value = "clientFilter", required = false) String clientFilter,
            @RequestParam(value = "statusFilter", required = false) String statusFilter,
            @RequestParam(value = "paymentMethodFilter", required = false) String paymentMethodFilter,
            @RequestParam(value = "amountMin", required = false) BigDecimal amountMin,
            @RequestParam(value = "amountMax", required = false) BigDecimal amountMax,
            @RequestParam(value = "selectedIds", required = false) List<String> selectedIds) {
        log.info("GET /api/scheduled-payments/reports/pdf - Gerando relatório PDF com filtros");
        
        try {
            byte[] reportBytes = paymentReportService.generateScheduledPaymentReportPDF(
                    startDate, endDate, clientFilter, statusFilter, 
                    paymentMethodFilter, amountMin, amountMax, selectedIds);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-pagamentos-agendados.pdf");
            headers.setContentLength(reportBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(reportBytes);
                    
        } catch (IOException e) {
            log.error("Erro ao gerar relatório PDF de pagamentos agendados", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/bulk-delete")
    @Operation(summary = "Excluir múltiplos pagamentos agendados", description = "Exclui vários pagamentos agendados selecionados")
    public ResponseEntity<Void> bulkDelete(@RequestBody List<String> ids) {
        log.info("DELETE /api/scheduled-payments/bulk-delete - Excluindo {} pagamentos agendados", ids.size());
        paymentReportService.deleteMultipleScheduledPayments(ids);
        return ResponseEntity.noContent().build();
    }
}
