package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.PurchaseRequestDTO;
import com.z7design.fleet_manager.service.PurchaseRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchase-requests")
@RequiredArgsConstructor
@Slf4j
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseRequestDTO>> getAllPurchaseRequests() {
        log.info("Buscando todas as requisiÃ§Ãµes de compra");
        List<PurchaseRequestDTO> requests = purchaseRequestService.getAllPurchaseRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<PurchaseRequestDTO> getPurchaseRequestById(@PathVariable("id") UUID id) {
        log.info("Buscando requisiÃ§Ã£o de compra com ID: {}", id);
        return purchaseRequestService.getPurchaseRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN', 'ROLE_COMPRAS')")
    public ResponseEntity<PurchaseRequestDTO> createPurchaseRequest(@RequestBody PurchaseRequestDTO requestDTO) {
        log.info("Criando nova requisiÃ§Ã£o de compra: {}", requestDTO.getTitle());
        PurchaseRequestDTO createdRequest = purchaseRequestService.createPurchaseRequest(requestDTO);
        return ResponseEntity.ok(createdRequest);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN', 'ROLE_COMPRAS')")
    public ResponseEntity<PurchaseRequestDTO> updatePurchaseRequest(@PathVariable("id") UUID id,
            @RequestBody PurchaseRequestDTO requestDTO) {
        log.info("Atualizando requisiÃ§Ã£o de compra com ID: {}", id);
        try {
            PurchaseRequestDTO updatedRequest = purchaseRequestService.updatePurchaseRequest(id, requestDTO);
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN')")
    public ResponseEntity<Void> deletePurchaseRequest(@PathVariable("id") UUID id) {
        log.info("Deletando requisiÃ§Ã£o de compra com ID: {}", id);
        purchaseRequestService.deletePurchaseRequest(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN', 'ROLE_FINANCEIRO')")
    public ResponseEntity<PurchaseRequestDTO> approveRequest(
            @PathVariable("id") UUID id,
            @RequestParam(value = "approverName") String approverName,
            @RequestParam(value = "approvalNotes", required = false) String approvalNotes) {
        log.info("Aprovando requisiÃ§Ã£o de compra com ID: {}", id);
        try {
            PurchaseRequestDTO approvedRequest = purchaseRequestService.approveRequest(id, approverName, approvalNotes);
            return ResponseEntity.ok(approvedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN', 'ROLE_FINANCEIRO')")
    public ResponseEntity<PurchaseRequestDTO> rejectRequest(
            @PathVariable("id") UUID id,
            @RequestParam(value = "rejectorName") String rejectorName,
            @RequestParam(value = "rejectionReason") String rejectionReason) {
        log.info("Rejeitando requisiÃ§Ã£o de compra com ID: {}", id);
        try {
            PurchaseRequestDTO rejectedRequest = purchaseRequestService.rejectRequest(id, rejectorName,
                    rejectionReason);
            return ResponseEntity.ok(rejectedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<PurchaseRequestDTO> completeRequest(@PathVariable("id") UUID id) {
        log.info("Completando requisiÃ§Ã£o de compra com ID: {}", id);
        try {
            PurchaseRequestDTO completedRequest = purchaseRequestService.completeRequest(id);
            return ResponseEntity.ok(completedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByStatus(@PathVariable("status") String status) {
        log.info("Buscando requisiÃ§Ãµes de compra com status: {}", status);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByStatus(status);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByPriority(@PathVariable("priority") String priority) {
        log.info("Buscando requisiÃ§Ãµes de compra com prioridade: {}", priority);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByPriority(priority);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/requester/{requesterId}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByRequester(@PathVariable("requesterId") UUID requesterId) {
        log.info("Buscando requisiÃ§Ãµes de compra do solicitante: {}", requesterId);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByRequester(requesterId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/approver/{approverId}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByApprover(@PathVariable("approverId") UUID approverId) {
        log.info("Buscando requisiÃ§Ãµes de compra do aprovador: {}", approverId);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByApprover(approverId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/unit/{unitId}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByUnit(@PathVariable("unitId") UUID unitId) {
        log.info("Buscando requisiÃ§Ãµes de compra da unidade: {}", unitId);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByUnit(unitId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<PurchaseRequestDTO>> getOverdueRequests() {
        log.info("Buscando requisiÃ§Ãµes de compra em atraso");
        List<PurchaseRequestDTO> requests = purchaseRequestService.getOverdueRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/urgent")
    public ResponseEntity<List<PurchaseRequestDTO>> getUrgentRequests() {
        log.info("Buscando requisiÃ§Ãµes de compra urgentes");
        List<PurchaseRequestDTO> requests = purchaseRequestService.getUrgentRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/pending-approval")
    public ResponseEntity<List<PurchaseRequestDTO>> getPendingApprovalRequests() {
        log.info("Buscando requisiÃ§Ãµes de compra pendentes de aprovaÃ§Ã£o");
        List<PurchaseRequestDTO> requests = purchaseRequestService.getPendingApprovalRequests();
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/search")
    public ResponseEntity<List<PurchaseRequestDTO>> searchRequests(@RequestParam(value = "searchTerm") String searchTerm) {
        log.info("Buscando requisiÃ§Ãµes de compra com termo: {}", searchTerm);
        List<PurchaseRequestDTO> requests = purchaseRequestService.searchRequests(searchTerm);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/stats/count/{status}")
    public ResponseEntity<Long> getRequestsCountByStatus(@PathVariable("status") String status) {
        log.info("Buscando contagem de requisiÃ§Ãµes com status: {}", status);
        long count = purchaseRequestService.getRequestsCountByStatus(status);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/urgent-count")
    public ResponseEntity<Long> getUrgentRequestsCount() {
        log.info("Buscando contagem de requisiÃ§Ãµes urgentes");
        long count = purchaseRequestService.getUrgentRequestsCount();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/overdue-count")
    public ResponseEntity<Long> getOverdueRequestsCount() {
        log.info("Buscando contagem de requisiÃ§Ãµes em atraso");
        long count = purchaseRequestService.getOverdueRequestsCount();
        return ResponseEntity.ok(count);
    }
}
