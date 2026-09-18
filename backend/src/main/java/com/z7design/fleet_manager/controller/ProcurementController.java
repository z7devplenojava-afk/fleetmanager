package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.procurement.*;
import com.z7design.fleet_manager.model.ProcurementPurchaseOrder;
import com.z7design.fleet_manager.service.ProcurementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/procurement")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Compras e Almoxarifado", description = "Endpoints para 3 cotações inteligentes, Ordens de Compra (Financeiro) e Entrada de NF-e com SLA")
public class ProcurementController {

    private final ProcurementService procurementService;

    @GetMapping("/quotes/by-requisition/{requisitionId}")
    @Operation(summary = "Busca a comparação das 3 cotações de uma requisição")
    public ResponseEntity<ProcurementQuoteComparisonDTO> getQuotesByRequisition(@PathVariable UUID requisitionId) {
        return ResponseEntity.ok(procurementService.getComparisonByRequisitionId(requisitionId));
    }

    @PostMapping("/quotes/triple")
    @Operation(summary = "Salva as 3 cotações de fornecedores e executa avaliação inteligente (preço, prazos 30/60/90 dias, entrega)")
    public ResponseEntity<ProcurementQuoteComparisonDTO> saveTripleQuotes(@Valid @RequestBody SaveTripleQuotesRequestDTO dto) {
        return ResponseEntity.ok(procurementService.saveTripleQuotes(dto));
    }

    @PostMapping("/quotes/approve")
    @Operation(summary = "Aprova a cotação vencedora (Gestor de Manutenção) e gera a Ordem de Compra para o Financeiro")
    public ResponseEntity<ProcurementPurchaseOrderDTO> approveQuote(@Valid @RequestBody ApproveQuoteRequestDTO dto) {
        return ResponseEntity.ok(procurementService.approveQuoteAndCreatePO(dto));
    }

    @GetMapping("/purchase-orders")
    @Operation(summary = "Lista ordens de compra para o Financeiro/Almoxarifado")
    public ResponseEntity<List<ProcurementPurchaseOrderDTO>> listPurchaseOrders(
            @RequestParam(required = false) ProcurementPurchaseOrder.PurchaseOrderStatus status) {
        return ResponseEntity.ok(procurementService.listPurchaseOrders(status));
    }

    @PostMapping("/purchase-orders/financial-approval")
    @Operation(summary = "Aprovação financeira do pagamento da Ordem de Compra")
    public ResponseEntity<ProcurementPurchaseOrderDTO> processFinancialApproval(@Valid @RequestBody FinancialApprovalRequestDTO dto) {
        return ResponseEntity.ok(procurementService.processFinancialApproval(dto));
    }

    @PostMapping("/invoices/entry")
    @Operation(summary = "Lança Nota Fiscal de Entrada no Almoxarifado, atualiza estoque, calcula SLA (Lead Time) e libera peça para a OS")
    public ResponseEntity<StockInvoiceEntryDTO> registerInvoiceEntry(@Valid @RequestBody InvoiceEntryRequestDTO dto) {
        return ResponseEntity.ok(procurementService.registerInvoiceEntryAndReleaseStock(dto));
    }

    @GetMapping("/invoices/entries")
    @Operation(summary = "Lista notas fiscais de entrada lançadas no Almoxarifado")
    public ResponseEntity<List<StockInvoiceEntryDTO>> listInvoiceEntries() {
        return ResponseEntity.ok(procurementService.listInvoiceEntries());
    }
}
