package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.PurchaseQuotationDTO;
import com.z7design.fleet_manager.model.enums.PurchaseQuotationStatus;
import com.z7design.fleet_manager.service.PurchaseQuotationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.z7design.fleet_manager.model.User;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchase-quotations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Purchase Quotations", description = "Endpoints para gerenciamento de CotaÃ§Ãµes de Compras")
public class PurchaseQuotationController {
    
    private final PurchaseQuotationService purchaseQuotationService;
    
    @GetMapping
    @Operation(summary = "Listar todas as cotaÃ§Ãµes", description = "Retorna uma lista de todas as cotaÃ§Ãµes de compras")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseQuotationDTO>> getAllQuotations() {
        log.info("Buscando todas as cotaÃ§Ãµes de compras");
        List<PurchaseQuotationDTO> quotations = purchaseQuotationService.getAllQuotations();
        return ResponseEntity.ok(quotations);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Buscar cotaÃ§Ã£o por ID", description = "Retorna uma cotaÃ§Ã£o especÃ­fica pelo ID")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<PurchaseQuotationDTO> getQuotationById(@PathVariable("id") UUID id) {
        log.info("Buscando cotaÃ§Ã£o com ID: {}", id);
        return purchaseQuotationService.getQuotationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @Operation(summary = "Criar nova cotaÃ§Ã£o", description = "Cria uma nova cotaÃ§Ã£o de compra no sistema")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS')")
    public ResponseEntity<PurchaseQuotationDTO> createQuotation(@RequestBody PurchaseQuotationDTO quotationDTO) {
        log.info("Criando nova cotaÃ§Ã£o: {}", quotationDTO.getTitle());
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                log.error("UsuÃ¡rio nÃ£o autenticado ao criar cotaÃ§Ã£o");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            User currentUser = (User) authentication.getPrincipal();
            UUID currentUserId = currentUser.getId();
            log.info("UsuÃ¡rio atual criando cotaÃ§Ã£o: {} (ID: {})", currentUser.getUsername(), currentUserId);
            
            PurchaseQuotationDTO createdQuotation = purchaseQuotationService.createQuotation(quotationDTO, currentUserId);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdQuotation);
        } catch (Exception e) {
            log.error("Erro ao criar cotaÃ§Ã£o: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cotaÃ§Ã£o", description = "Atualiza uma cotaÃ§Ã£o existente")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS')")
    public ResponseEntity<PurchaseQuotationDTO> updateQuotation(@PathVariable("id") UUID id, 
                                                                 @RequestBody PurchaseQuotationDTO quotationDTO) {
        log.info("Atualizando cotaÃ§Ã£o com ID: {}", id);
        try {
            PurchaseQuotationDTO updatedQuotation = purchaseQuotationService.updateQuotation(id, quotationDTO);
            return ResponseEntity.ok(updatedQuotation);
        } catch (RuntimeException e) {
            log.error("Erro ao atualizar cotaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir cotaÃ§Ã£o", description = "Exclui uma cotaÃ§Ã£o do sistema")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> deleteQuotation(@PathVariable("id") UUID id) {
        log.info("Deletando cotaÃ§Ã£o com ID: {}", id);
        try {
            purchaseQuotationService.deleteQuotation(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Erro ao deletar cotaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status da cotaÃ§Ã£o", description = "Atualiza apenas o status de uma cotaÃ§Ã£o")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<PurchaseQuotationDTO> updateQuotationStatus(@PathVariable("id") UUID id, 
                                                                       @RequestBody Map<String, String> statusUpdate) {
        log.info("Atualizando status da cotaÃ§Ã£o com ID: {}", id);
        String status = statusUpdate.get("status");
        try {
            PurchaseQuotationDTO updatedQuotation = purchaseQuotationService.updateStatus(id, status);
            return ResponseEntity.ok(updatedQuotation);
        } catch (RuntimeException e) {
            log.error("Erro ao atualizar status da cotaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar cotaÃ§Ãµes por status", description = "Retorna cotaÃ§Ãµes filtradas por status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseQuotationDTO>> getQuotationsByStatus(@PathVariable("status") String status) {
        log.info("Buscando cotaÃ§Ãµes com status: {}", status);
        try {
            List<PurchaseQuotationDTO> quotations = purchaseQuotationService.findByStatus(status);
            return ResponseEntity.ok(quotations);
        } catch (RuntimeException e) {
            log.error("Erro ao buscar cotaÃ§Ãµes por status: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/supplier/{supplierId}")
    @Operation(summary = "Buscar cotaÃ§Ãµes por fornecedor", description = "Retorna cotaÃ§Ãµes de um fornecedor especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseQuotationDTO>> getQuotationsBySupplier(@PathVariable("supplierId") UUID supplierId) {
        log.info("Buscando cotaÃ§Ãµes do fornecedor: {}", supplierId);
        List<PurchaseQuotationDTO> quotations = purchaseQuotationService.findBySupplier(supplierId);
        return ResponseEntity.ok(quotations);
    }
    
    @GetMapping("/unit/{unitId}")
    @Operation(summary = "Buscar cotaÃ§Ãµes por unidade", description = "Retorna cotaÃ§Ãµes de uma unidade especÃ­fica")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseQuotationDTO>> getQuotationsByUnit(@PathVariable("unitId") UUID unitId) {
        log.info("Buscando cotaÃ§Ãµes da unidade: {}", unitId);
        List<PurchaseQuotationDTO> quotations = purchaseQuotationService.findByUnit(unitId);
        return ResponseEntity.ok(quotations);
    }
    
    @GetMapping("/assigned/{userId}")
    @Operation(summary = "Buscar cotaÃ§Ãµes por responsÃ¡vel", description = "Retorna cotaÃ§Ãµes atribuÃ­das a um usuÃ¡rio especÃ­fico")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseQuotationDTO>> getQuotationsByAssignedTo(@PathVariable("userId") UUID userId) {
        log.info("Buscando cotaÃ§Ãµes atribuÃ­das ao usuÃ¡rio: {}", userId);
        List<PurchaseQuotationDTO> quotations = purchaseQuotationService.findByAssignedTo(userId);
        return ResponseEntity.ok(quotations);
    }
    
    @GetMapping("/expired")
    @Operation(summary = "Buscar cotaÃ§Ãµes expiradas", description = "Retorna cotaÃ§Ãµes que jÃ¡ expiraram")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseQuotationDTO>> getExpiredQuotations() {
        log.info("Buscando cotaÃ§Ãµes expiradas");
        List<PurchaseQuotationDTO> quotations = purchaseQuotationService.findExpiredQuotations();
        return ResponseEntity.ok(quotations);
    }
    
    @GetMapping("/expiring-soon/{days}")
    @Operation(summary = "Buscar cotaÃ§Ãµes expirando em breve", description = "Retorna cotaÃ§Ãµes que expiram nos prÃ³ximos X dias")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseQuotationDTO>> getQuotationsExpiringSoon(@PathVariable("days") int days) {
        log.info("Buscando cotaÃ§Ãµes expirando nos prÃ³ximos {} dias", days);
        List<PurchaseQuotationDTO> quotations = purchaseQuotationService.findQuotationsExpiringSoon(days);
        return ResponseEntity.ok(quotations);
    }
    
    @GetMapping("/search")
    @Operation(summary = "Buscar cotaÃ§Ãµes", description = "Busca cotaÃ§Ãµes por termo de pesquisa")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<List<PurchaseQuotationDTO>> searchQuotations(@RequestParam(value = "term") String term) {
        log.info("Buscando cotaÃ§Ãµes com termo: {}", term);
        List<PurchaseQuotationDTO> quotations = purchaseQuotationService.searchQuotations(term);
        return ResponseEntity.ok(quotations);
    }
    
    @GetMapping("/stats/count-by-status")
    @Operation(summary = "EstatÃ­sticas por status", description = "Retorna contagem de cotaÃ§Ãµes por status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_COMPRAS', 'ROLE_FINANCEIRO')")
    public ResponseEntity<Map<String, Long>> getCountByStatus() {
        log.info("Buscando estatÃ­sticas de cotaÃ§Ãµes por status");
        Map<String, Long> stats = Map.of(
            "DRAFT", purchaseQuotationService.countByStatus(PurchaseQuotationStatus.DRAFT),
            "SENT", purchaseQuotationService.countByStatus(PurchaseQuotationStatus.SENT),
            "APPROVED", purchaseQuotationService.countByStatus(PurchaseQuotationStatus.APPROVED),
            "REJECTED", purchaseQuotationService.countByStatus(PurchaseQuotationStatus.REJECTED),
            "EXPIRED", purchaseQuotationService.countByStatus(PurchaseQuotationStatus.EXPIRED)
        );
        return ResponseEntity.ok(stats);
    }
}


