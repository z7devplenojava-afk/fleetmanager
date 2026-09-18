package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.procurement.ConfirmDeliveryRequestDTO;
import com.z7design.fleet_manager.dto.procurement.CreateRequisitionRequestDTO;
import com.z7design.fleet_manager.dto.procurement.MaterialRequisitionDTO;
import com.z7design.fleet_manager.dto.procurement.StockItemAvailabilityDTO;
import com.z7design.fleet_manager.model.MaterialRequisition;
import com.z7design.fleet_manager.model.StockReservation;
import com.z7design.fleet_manager.service.MaterialRequisitionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/material-requisitions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Requisições de Almoxarifado / Compras", description = "Endpoints para requisição e reserva de peças para Ordens de Serviço")
public class MaterialRequisitionController {

    private final MaterialRequisitionService requisitionService;

    @GetMapping("/check-availability")
    @Operation(summary = "Verifica disponibilidade de item no estoque e conflitos de reserva por outros veículos")
    public ResponseEntity<StockItemAvailabilityDTO> checkAvailability(
            @RequestParam UUID stockItemId,
            @RequestParam(required = false) UUID excludeWorkOrderId) {
        return ResponseEntity.ok(requisitionService.checkStockItemAvailability(stockItemId, excludeWorkOrderId));
    }

    @PostMapping
    @Operation(summary = "Cria uma nova Requisição ao Almoxarifado / Solicitação de Compra com justificativa obrigatória")
    public ResponseEntity<MaterialRequisitionDTO> createRequisition(@Valid @RequestBody CreateRequisitionRequestDTO dto) {
        return ResponseEntity.ok(requisitionService.createRequisition(dto));
    }

    @GetMapping
    @Operation(summary = "Lista requisições com filtro opcional por status")
    public ResponseEntity<List<MaterialRequisitionDTO>> listRequisitions(
            @RequestParam(required = false) String status) {
        MaterialRequisition.RequisitionStatus statusEnum = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                statusEnum = MaterialRequisition.RequisitionStatus.valueOf(status.trim().toUpperCase());
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(requisitionService.listRequisitions(statusEnum));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca detalhes de uma requisição")
    public ResponseEntity<MaterialRequisitionDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(requisitionService.getRequisitionById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza uma requisição pendente")
    public ResponseEntity<MaterialRequisitionDTO> updateRequisition(
            @PathVariable UUID id,
            @Valid @RequestBody com.z7design.fleet_manager.dto.procurement.UpdateRequisitionRequestDTO dto) {
        return ResponseEntity.ok(requisitionService.updateRequisition(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui uma requisição pendente")
    public ResponseEntity<Void> deleteRequisition(@PathVariable UUID id) {
        requisitionService.deleteRequisition(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-delete")
    @Operation(summary = "Exclusão em massa de requisições pendentes")
    public ResponseEntity<Map<String, Object>> bulkDeleteRequisitions(@RequestBody Map<String, List<UUID>> body) {
        List<UUID> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lista de IDs não pode ser vazia"));
        }
        return ResponseEntity.ok(requisitionService.bulkDeleteRequisitions(ids));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Aprovação da requisição pelo Almoxarifado")
    public ResponseEntity<MaterialRequisitionDTO> approveRequisition(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(requisitionService.approveByAlmoxarifado(id, notes));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Rejeição da requisição pelo Almoxarifado")
    public ResponseEntity<MaterialRequisitionDTO> rejectRequisition(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Rejeitado pelo Almoxarifado";
        return ResponseEntity.ok(requisitionService.rejectByAlmoxarifado(id, reason));
    }

    @PostMapping("/reserve-stock")
    @Operation(summary = "Reserva item disponível em estoque diretamente para a OS")
    public ResponseEntity<StockReservation> reserveStock(@RequestBody Map<String, Object> body) {
        UUID workOrderId = UUID.fromString(body.get("workOrderId").toString());
        UUID stockItemId = UUID.fromString(body.get("stockItemId").toString());
        BigDecimal quantity = body.get("quantity") != null ? new BigDecimal(body.get("quantity").toString()) : BigDecimal.ONE;
        String notes = body.get("notes") != null ? body.get("notes").toString() : null;

        return ResponseEntity.ok(requisitionService.reserveStockForWorkOrder(workOrderId, stockItemId, quantity, notes));
    }

    @PostMapping("/{id}/deliver")
    @Operation(summary = "Confirma a entrega do item pelo almoxarifado e executa a baixa automática no estoque físico")
    public ResponseEntity<MaterialRequisitionDTO> confirmDelivery(
            @PathVariable UUID id,
            @RequestBody(required = false) ConfirmDeliveryRequestDTO dto) {
        return ResponseEntity.ok(requisitionService.confirmDeliveryAndDeductStock(id, dto));
    }
}
