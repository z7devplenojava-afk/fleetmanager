package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.EPIDelivery;
import com.z7design.fleet_manager.service.SSTEPIService;
import com.fasterxml.jackson.annotation.JsonFormat;
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
 * Controller para EPI Deliveries do mÃ³dulo SST
 */
@RestController
@RequestMapping("/api/sst/epi-deliveries")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SST EPI Deliveries", description = "API para gerenciamento de entregas de EPIs do mÃ³dulo SST")
public class SSTEPIDeliveryController {

    private final SSTEPIService epiService;

    @GetMapping
    @Operation(summary = "Listar todas as entregas de EPIs", description = "Retorna todas as entregas de EPIs")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<EPIDelivery>> getAllEPIDeliveries() {
        log.info("GET /api/sst/epi-deliveries - Buscando todas as entregas de EPIs");
        // TODO: Implementar mÃ©todo getAllEPIDeliveries no service
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar entrega de EPI por ID", description = "Retorna uma entrega especÃ­fica pelo ID")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<EPIDelivery> getEPIDeliveryById(@PathVariable UUID id) {
        log.info("GET /api/sst/epi-deliveries/{} - Buscando entrega de EPI", id);
        // TODO: Implementar mÃ©todo getEPIDeliveryById no service
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @Operation(summary = "Criar nova entrega de EPI", description = "Cria uma nova entrega de EPI")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> createEPIDelivery(@RequestBody CreateEPIDeliveryRequest request) {
        log.info("POST /api/sst/epi-deliveries - Criando entrega de EPI para funcionÃ¡rio: {}", request.getEmployeeId());
        try {
            // Usar a data fornecida ou a data atual se nÃ£o fornecida
            LocalDate deliveryDate = request.getDeliveryDate() != null 
                ? request.getDeliveryDate() 
                : LocalDate.now();
            
            EPIDelivery delivery = epiService.deliverEPI(
                request.getEmployeeId(),
                request.getEpiId(),
                request.getQuantity(),
                request.getReason(),
                request.getDeliveredByUserId(),
                request.getNotes(),
                deliveryDate
            );
            return ResponseEntity.ok(delivery);
        } catch (IllegalArgumentException e) {
            log.error("Erro de validaÃ§Ã£o ao criar entrega de EPI: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Erro ao criar entrega de EPI: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(java.util.Map.of("error", "Erro interno ao criar entrega de EPI"));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar entrega de EPI", description = "Atualiza uma entrega de EPI existente")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<EPIDelivery> updateEPIDelivery(@PathVariable UUID id, @RequestBody UpdateEPIDeliveryRequest request) {
        log.info("PUT /api/sst/epi-deliveries/{} - Atualizando entrega de EPI", id);
        // TODO: Implementar mÃ©todo updateEPIDelivery no service
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deletar entrega de EPI", description = "Deleta uma entrega de EPI")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteEPIDelivery(@PathVariable UUID id) {
        log.info("DELETE /api/sst/epi-deliveries/{} - Deletando entrega de EPI", id);
        // TODO: Implementar mÃ©todo deleteEPIDelivery no service
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Listar entregas por funcionÃ¡rio", description = "Retorna todas as entregas de um funcionÃ¡rio especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<EPIDelivery>> getEPIDeliveriesByEmployee(@PathVariable UUID employeeId) {
        log.info("GET /api/sst/epi-deliveries/employee/{} - Buscando entregas por funcionÃ¡rio", employeeId);
        try {
            List<EPIDelivery> deliveries = epiService.getDeliveriesByEmployee(employeeId);
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            log.error("Erro ao buscar entregas por funcionÃ¡rio: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/epi/{epiId}")
    @Operation(summary = "Listar entregas por EPI", description = "Retorna todas as entregas de um EPI especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<EPIDelivery>> getEPIDeliveriesByEPI(@PathVariable UUID epiId) {
        log.info("GET /api/sst/epi-deliveries/epi/{} - Buscando entregas por EPI", epiId);
        try {
            List<EPIDelivery> deliveries = epiService.getDeliveriesByEPI(epiId);
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            log.error("Erro ao buscar entregas por EPI: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/expiring/{days}")
    @Operation(summary = "Listar entregas expirando", description = "Retorna entregas que estÃ£o expirando nos prÃ³ximos X dias")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<EPIDelivery>> getExpiringEPIDeliveries(@PathVariable int days) {
        log.info("GET /api/sst/epi-deliveries/expiring/{} - Buscando entregas expirando em {} dias", days, days);
        // TODO: Implementar mÃ©todo getExpiringEPIDeliveries no service
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{id}/confirm-receipt")
    @Operation(summary = "Confirmar recebimento", description = "Confirma o recebimento de uma entrega de EPI")
    @PreAuthorize("hasAnyAuthority('ROLE_RH', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
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
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate deliveryDate;

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
        public LocalDate getDeliveryDate() { return deliveryDate; }
        public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
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

