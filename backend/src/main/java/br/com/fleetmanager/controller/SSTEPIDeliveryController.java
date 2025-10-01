package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.SSTEPIService;

import br.com.fleetmanager.model.EPIDelivery;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Controller para EPI Deliveries do módulo SST
 */
@RestController
@RequestMapping("/api/sst/epi-deliveries")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SST EPI Deliveries", description = "API para gerenciamento de entregas de EPIs do módulo SST")
public class SSTEPIDeliveryController {

    private final SSTEPIService epiService;

    @GetMapping
    @Operation(summary = "Listar todas as entregas de EPIs", description = "Retorna todas as entregas de EPIs")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<EPIDelivery>> getAllEPIDeliveries() {
        log.info("GET /api/sst/epi-deliveries - Buscando todas as entregas de EPIs");
        // TODO: Implementar método getAllEPIDeliveries no service
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar entrega de EPI por ID", description = "Retorna uma entrega específica pelo ID")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<EPIDelivery> getEPIDeliveryById(@PathVariable UUID id) {
        log.info("GET /api/sst/epi-deliveries/{} - Buscando entrega de EPI", id);
        // TODO: Implementar método getEPIDeliveryById no service
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @Operation(summary = "Criar nova entrega de EPI", description = "Cria uma nova entrega de EPI")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<EPIDelivery> createEPIDelivery(@RequestBody CreateEPIDeliveryRequest request) {
        log.info("POST /api/sst/epi-deliveries - Criando entrega de EPI para funcionário: {}", request.getEmployeeId());
        try {
            EPIDelivery delivery = epiService.deliverEPI(
                request.getEmployeeId(),
                request.getEpiId(),
                request.getQuantity(),
                request.getReason(),
                request.getDeliveredByUserId(),
                request.getNotes()
            );
            return ResponseEntity.ok(delivery);
        } catch (Exception e) {
            log.error("Erro ao criar entrega de EPI: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar entrega de EPI", description = "Atualiza uma entrega de EPI existente")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<EPIDelivery> updateEPIDelivery(@PathVariable UUID id, @RequestBody UpdateEPIDeliveryRequest request) {
        log.info("PUT /api/sst/epi-deliveries/{} - Atualizando entrega de EPI", id);
        // TODO: Implementar método updateEPIDelivery no service
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar entrega de EPI", description = "Deleta uma entrega de EPI")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteEPIDelivery(@PathVariable UUID id) {
        log.info("DELETE /api/sst/epi-deliveries/{} - Deletando entrega de EPI", id);
        // TODO: Implementar método deleteEPIDelivery no service
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Listar entregas por funcionário", description = "Retorna todas as entregas de um funcionário específico")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<EPIDelivery>> getEPIDeliveriesByEmployee(@PathVariable UUID employeeId) {
        log.info("GET /api/sst/epi-deliveries/employee/{} - Buscando entregas por funcionário", employeeId);
        try {
            List<EPIDelivery> deliveries = epiService.getDeliveriesByEmployee(employeeId);
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            log.error("Erro ao buscar entregas por funcionário: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/expiring/{days}")
    @Operation(summary = "Listar entregas expirando", description = "Retorna entregas que estão expirando nos próximos X dias")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<EPIDelivery>> getExpiringEPIDeliveries(@PathVariable int days) {
        log.info("GET /api/sst/epi-deliveries/expiring/{} - Buscando entregas expirando em {} dias", days, days);
        // TODO: Implementar método getExpiringEPIDeliveries no service
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{id}/confirm-receipt")
    @Operation(summary = "Confirmar recebimento", description = "Confirma o recebimento de uma entrega de EPI")
    @PreAuthorize("hasRole('RH') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> confirmEPIReceipt(@PathVariable UUID id, @RequestBody ConfirmReceiptRequest request) {
        log.info("POST /api/sst/epi-deliveries/{}/confirm-receipt - Confirmando recebimento", id);
        try {
            epiService.confirmEPIReceipt(id, request.getSignatureUrl());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erro ao confirmar recebimento: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    // DTOs para requests
    public static class CreateEPIDeliveryRequest {
        private UUID employeeId;
        private UUID epiId;
        private Integer quantity;
        private String reason;
        private UUID deliveredByUserId;
        private String notes;

        // Getters e Setters
        public UUID getEmployeeId() { return employeeId; }
        public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
        public UUID getEpiId() { return epiId; }
        public void setEpiId(UUID epiId) { this.epiId = epiId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public UUID getDeliveredByUserId() { return deliveredByUserId; }
        public void setDeliveredByUserId(UUID deliveredByUserId) { this.deliveredByUserId = deliveredByUserId; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class UpdateEPIDeliveryRequest {
        private Integer quantity;
        private String reason;
        private String notes;

        // Getters e Setters
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class ConfirmReceiptRequest {
        private String signatureUrl;

        // Getters e Setters
        public String getSignatureUrl() { return signatureUrl; }
        public void setSignatureUrl(String signatureUrl) { this.signatureUrl = signatureUrl; }
    }
}
