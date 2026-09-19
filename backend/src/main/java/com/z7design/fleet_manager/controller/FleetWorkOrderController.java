package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.dto.FleetWorkOrderHistoryDTO;
import com.z7design.fleet_manager.dto.PurchaseRequestDTO;
import com.z7design.fleet_manager.dto.VehicleMaintenanceRankingDTO;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.service.FleetWorkOrderPdfService;
import com.z7design.fleet_manager.service.FleetWorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/fleet-work-orders", "/api/v1/fleet-work-orders"})
@RequiredArgsConstructor
public class FleetWorkOrderController {

    private final FleetWorkOrderService service;
    private final FleetWorkOrderPdfService pdfService;
    private final AuthenticationService authenticationService;

    /** Lista todas as OSs (filtro opcional por garagem executora) */
    @GetMapping
    public ResponseEntity<List<FleetWorkOrderDTO>> getAll(
            @RequestParam(value = "garageId", required = false) UUID garageId) {
        return ResponseEntity.ok(service.getAllByGarage(garageId));
    }

    /** Busca uma OS pelo ID */
    @GetMapping("/{id}")
    public ResponseEntity<FleetWorkOrderDTO> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /** Lista os itens mestre de checklist ativo */
    @GetMapping("/checklist-items")
    public ResponseEntity<List<com.z7design.fleet_manager.dto.ChecklistItemDTO>> getChecklistMasterItems() {
        return ResponseEntity.ok(service.getChecklistMasterItems());
    }

    /** Lista os serviços cadastrados na oficina */
    @GetMapping("/services-catalog")
    public ResponseEntity<List<com.z7design.fleet_manager.dto.ServiceDTO>> getServicesCatalog() {
        return ResponseEntity.ok(service.getServicesCatalog());
    }

    /** Cadastra rapidamente um serviço na oficina com código sequencial automático */
    @PostMapping("/quick-service")
    public ResponseEntity<com.z7design.fleet_manager.dto.ServiceDTO> createQuickService(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.createQuickService(body));
    }

    /** Cria nova OS */
    @PostMapping
    public ResponseEntity<FleetWorkOrderDTO> create(@RequestBody FleetWorkOrderDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    /** Atualização completa de uma OS (todos os campos editáveis) */
    @PutMapping("/{id}")
    public ResponseEntity<FleetWorkOrderDTO> update(
            @PathVariable("id") UUID id,
            @RequestBody FleetWorkOrderDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    /** Atualiza somente o status (workflow) — PATCH */
    @PatchMapping("/{id}/status")
    public ResponseEntity<FleetWorkOrderDTO> updateStatus(
            @PathVariable("id") UUID id,
            @RequestParam(value = "status") FleetWorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    /** Compatibilidade — PUT para mudança de status */
    @PutMapping("/{id}/status")
    public ResponseEntity<FleetWorkOrderDTO> updateStatusPut(
            @PathVariable("id") UUID id,
            @RequestParam(value = "status") FleetWorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    /** Exclui uma OS (soft-delete — RN10: bloqueia se status = COMPLETED) */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") UUID id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Duplica uma OS gerando novo numero e status OPEN (PRD §25) */
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<?> duplicate(@PathVariable("id") UUID id) {
        try {
            return ResponseEntity.ok(service.duplicate(id));
        } catch (com.z7design.fleet_manager.exception.ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erro ao duplicar Ordem de Servico: " + e.getMessage()));
        }
    }

    /**
     * Gera uma solicitação de compra ao almoxarifado a partir das peças (PART)
     * da O.S. O almoxarifado então realiza as cotações no módulo de Compras.
     */
    @PostMapping("/{id}/request-purchase")
    public ResponseEntity<?> requestPurchase(@PathVariable("id") UUID id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User requester = authenticationService.getCurrentUser(authentication);
            PurchaseRequestDTO created = service.requestPurchase(id, requester);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (com.z7design.fleet_manager.exception.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(FleetWorkOrderController.class)
                    .error("Erro ao gerar solicitação de compra para O.S. {}", id, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erro ao gerar solicitação de compra."));
        }
    }

    /** Gera o PDF da OS para impressão / entrega ao mecânico */
    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> generatePdf(@PathVariable("id") UUID id) {
        try {
            byte[] pdfBytes = pdfService.generatePdf(id);
            String fileName = "ordem-servico-" + id + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(pdfBytes);
        } catch (com.z7design.fleet_manager.exception.ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(FleetWorkOrderController.class)
                    .error("Erro ao gerar PDF para Ordem de Serviço ID {}: ", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ── Histórico ────────────────────────────────────────────────────────────

    /** Retorna a timeline/histórico completo de uma OS */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<FleetWorkOrderHistoryDTO>> getHistory(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(service.getHistory(id));
    }

    /** Adiciona uma nota manual à timeline da OS */
    @PostMapping("/{id}/history/note")
    public ResponseEntity<FleetWorkOrderHistoryDTO> addNote(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> body) {
        String note        = body.getOrDefault("note", "");
        String performedBy = body.getOrDefault("performedBy", "Usuário");
        return ResponseEntity.ok(service.addNote(id, note, performedBy));
    }

    // ── Ranking ───────────────────────────────────────────────────────────────

    /** Ranking de veículos por quantidade de manutenções e custo acumulado */
    @GetMapping("/ranking/vehicles")
    public ResponseEntity<List<VehicleMaintenanceRankingDTO>> getVehicleRanking() {
        return ResponseEntity.ok(service.getVehicleRanking());
    }
}
