package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.DdaInvoice;
import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.service.DdaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/dda")
@RequiredArgsConstructor
@Tag(name = "Motor DDA Bancário", description = "Busca automática de boletos CIP emitidos contra o CNPJ da empresa, conciliação e liquidação")
public class DdaController {

    private final DdaService ddaService;

    @GetMapping("/invoices")
    @Operation(summary = "Lista boletos DDA detectados para a empresa")
    public ResponseEntity<List<DdaInvoice>> getDdaInvoices() {
        return ResponseEntity.ok(ddaService.getDdaInvoicesForCompany());
    }

    @PostMapping("/sync")
    @Operation(summary = "Força a varredura e sincronização de boletos DDA junto à CIP / API bancária")
    public ResponseEntity<List<DdaInvoice>> syncDda() {
        return ResponseEntity.ok(ddaService.syncDdaForCurrentCompany());
    }

    @PostMapping("/{id}/link")
    @Operation(summary = "Vincula manualmente um boleto DDA a uma Conta a Pagar existente")
    public ResponseEntity<DdaInvoice> linkToInvoice(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> body) {
        UUID invoiceId = UUID.fromString(body.get("invoiceId"));
        return ResponseEntity.ok(ddaService.linkToInvoice(id, invoiceId));
    }

    @PostMapping("/{id}/import")
    @Operation(summary = "Importa um boleto DDA gerando uma nova Conta a Pagar (Invoice)")
    public ResponseEntity<Invoice> importDdaAsInvoice(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(ddaService.importDdaAsInvoice(id));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Dispara pagamento do boleto DDA via API bancária / PIX e baixa a conta")
    public ResponseEntity<DdaInvoice> payDdaInvoice(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String method = body != null ? body.get("paymentMethod") : "PIX";
        return ResponseEntity.ok(ddaService.payDdaInvoice(id, method));
    }
}
