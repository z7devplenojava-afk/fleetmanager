package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.RentalInvoiceDTO;
import com.z7design.fleet_manager.service.RentalInvoiceNfsePdfService;
import com.z7design.fleet_manager.service.RentalInvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/rental-invoices")
@RequiredArgsConstructor
@Tag(name = "Gestão de Locação", description = "Contratos de locação, veículos locados e faturas de locação")
public class RentalInvoiceController {

    private final RentalInvoiceService rentalInvoiceService;
    private final RentalInvoiceNfsePdfService rentalInvoiceNfsePdfService;

    @GetMapping
    @Operation(summary = "Listar faturas de locação")
    public ResponseEntity<List<RentalInvoiceDTO>> list(
            @RequestParam(value = "clientId", required = false) UUID clientId,
            @RequestParam(value = "contractId", required = false) UUID contractId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(rentalInvoiceService.list(clientId, contractId, status, search));
    }

    @GetMapping("/next-number")
    @Operation(summary = "Sugerir o próximo número de fatura de locação")
    public ResponseEntity<Map<String, String>> nextNumber() {
        return ResponseEntity.ok(Map.of("number", rentalInvoiceService.nextNumber()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar fatura de locação por ID")
    public ResponseEntity<RentalInvoiceDTO> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(rentalInvoiceService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Criar fatura de locação")
    public ResponseEntity<RentalInvoiceDTO> create(@RequestBody RentalInvoiceDTO dto) {
        log.info("POST /api/rental-invoices - Criando fatura de locação para o cliente {}", dto.getClientId());
        return ResponseEntity.ok(rentalInvoiceService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar fatura de locação")
    public ResponseEntity<RentalInvoiceDTO> update(@PathVariable("id") UUID id, @RequestBody RentalInvoiceDTO dto) {
        log.info("PUT /api/rental-invoices/{} - Atualizando fatura de locação", id);
        return ResponseEntity.ok(rentalInvoiceService.update(id, dto));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Alterar status da fatura de locação")
    public ResponseEntity<RentalInvoiceDTO> updateStatus(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(rentalInvoiceService.updateStatus(id, body.get("status")));
    }

    @GetMapping("/{id}/nfse")
    @Operation(summary = "Gerar/baixar a Nota Fiscal (NFS-e) da fatura de locação em PDF")
    public ResponseEntity<byte[]> nfse(@PathVariable("id") UUID id) {
        byte[] pdf = rentalInvoiceNfsePdfService.generate(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"nfse-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir fatura de locação")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        log.info("DELETE /api/rental-invoices/{} - Excluindo fatura de locação", id);
        rentalInvoiceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
