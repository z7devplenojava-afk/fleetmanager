package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.PurchaseRequestService;

import br.com.fleetmanager.dto.PurchaseRequestDTO;
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
    public ResponseEntity<List<PurchaseRequestDTO>> getAllPurchaseRequests() {
        log.info("Buscando todas as requisições de compra");
        List<PurchaseRequestDTO> requests = purchaseRequestService.getAllPurchaseRequests();
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseRequestDTO> getPurchaseRequestById(@PathVariable UUID id) {
        log.info("Buscando requisição de compra com ID: {}", id);
        return purchaseRequestService.getPurchaseRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<PurchaseRequestDTO> createPurchaseRequest(@RequestBody PurchaseRequestDTO requestDTO) {
        log.info("Criando nova requisição de compra: {}", requestDTO.getTitle());
        PurchaseRequestDTO createdRequest = purchaseRequestService.createPurchaseRequest(requestDTO);
        return ResponseEntity.ok(createdRequest);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseRequestDTO> updatePurchaseRequest(@PathVariable UUID id, @RequestBody PurchaseRequestDTO requestDTO) {
        log.info("Atualizando requisição de compra com ID: {}", id);
        try {
            PurchaseRequestDTO updatedRequest = purchaseRequestService.updatePurchaseRequest(id, requestDTO);
            return ResponseEntity.ok(updatedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseRequest(@PathVariable UUID id) {
        log.info("Deletando requisição de compra com ID: {}", id);
        purchaseRequestService.deletePurchaseRequest(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<PurchaseRequestDTO> approveRequest(
            @PathVariable UUID id,
            @RequestParam String approverName,
            @RequestParam(required = false) String approvalNotes) {
        log.info("Aprovando requisição de compra com ID: {}", id);
        try {
            PurchaseRequestDTO approvedRequest = purchaseRequestService.approveRequest(id, approverName, approvalNotes);
            return ResponseEntity.ok(approvedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/{id}/reject")
    public ResponseEntity<PurchaseRequestDTO> rejectRequest(
            @PathVariable UUID id,
            @RequestParam String rejectorName,
            @RequestParam String rejectionReason) {
        log.info("Rejeitando requisição de compra com ID: {}", id);
        try {
            PurchaseRequestDTO rejectedRequest = purchaseRequestService.rejectRequest(id, rejectorName, rejectionReason);
            return ResponseEntity.ok(rejectedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/{id}/complete")
    public ResponseEntity<PurchaseRequestDTO> completeRequest(@PathVariable UUID id) {
        log.info("Completando requisição de compra com ID: {}", id);
        try {
            PurchaseRequestDTO completedRequest = purchaseRequestService.completeRequest(id);
            return ResponseEntity.ok(completedRequest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByStatus(@PathVariable String status) {
        log.info("Buscando requisições de compra com status: {}", status);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByStatus(status);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByPriority(@PathVariable String priority) {
        log.info("Buscando requisições de compra com prioridade: {}", priority);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByPriority(priority);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/requester/{requesterId}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByRequester(@PathVariable UUID requesterId) {
        log.info("Buscando requisições de compra do solicitante: {}", requesterId);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByRequester(requesterId);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/approver/{approverId}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByApprover(@PathVariable UUID approverId) {
        log.info("Buscando requisições de compra do aprovador: {}", approverId);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByApprover(approverId);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/unit/{unitId}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByUnit(@PathVariable UUID unitId) {
        log.info("Buscando requisições de compra da unidade: {}", unitId);
        List<PurchaseRequestDTO> requests = purchaseRequestService.getRequestsByUnit(unitId);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/overdue")
    public ResponseEntity<List<PurchaseRequestDTO>> getOverdueRequests() {
        log.info("Buscando requisições de compra em atraso");
        List<PurchaseRequestDTO> requests = purchaseRequestService.getOverdueRequests();
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/urgent")
    public ResponseEntity<List<PurchaseRequestDTO>> getUrgentRequests() {
        log.info("Buscando requisições de compra urgentes");
        List<PurchaseRequestDTO> requests = purchaseRequestService.getUrgentRequests();
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/pending-approval")
    public ResponseEntity<List<PurchaseRequestDTO>> getPendingApprovalRequests() {
        log.info("Buscando requisições de compra pendentes de aprovação");
        List<PurchaseRequestDTO> requests = purchaseRequestService.getPendingApprovalRequests();
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<PurchaseRequestDTO>> searchRequests(@RequestParam String searchTerm) {
        log.info("Buscando requisições de compra com termo: {}", searchTerm);
        List<PurchaseRequestDTO> requests = purchaseRequestService.searchRequests(searchTerm);
        return ResponseEntity.ok(requests);
    }
    
    @GetMapping("/stats/count/{status}")
    public ResponseEntity<Long> getRequestsCountByStatus(@PathVariable String status) {
        log.info("Buscando contagem de requisições com status: {}", status);
        long count = purchaseRequestService.getRequestsCountByStatus(status);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/stats/urgent-count")
    public ResponseEntity<Long> getUrgentRequestsCount() {
        log.info("Buscando contagem de requisições urgentes");
        long count = purchaseRequestService.getUrgentRequestsCount();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/stats/overdue-count")
    public ResponseEntity<Long> getOverdueRequestsCount() {
        log.info("Buscando contagem de requisições em atraso");
        long count = purchaseRequestService.getOverdueRequestsCount();
        return ResponseEntity.ok(count);
    }
}