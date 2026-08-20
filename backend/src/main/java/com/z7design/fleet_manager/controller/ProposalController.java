package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ProposalDTO;
import com.z7design.fleet_manager.model.Proposal;
import com.z7design.fleet_manager.model.enums.ProposalStatus;
import com.z7design.fleet_manager.service.ProposalService;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.z7design.fleet_manager.model.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/proposals")
@Tag(name = "Propostas", description = "API para gestÃ£o de propostas comerciais")
public class ProposalController {

    @Autowired
    private ProposalService proposalService;

    @GetMapping
    @Operation(summary = "Listar todas as propostas", description = "Retorna uma lista paginada de todas as propostas")
    public ResponseEntity<Page<Proposal>> getAllProposals(Pageable pageable) {
        Page<Proposal> proposals = proposalService.findAll(pageable);
        return ResponseEntity.ok(proposals);
    }

    @GetMapping("/all")
    @Operation(summary = "Listar todas as propostas sem paginaÃ§Ã£o", description = "Retorna uma lista completa de todas as propostas")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<Proposal>> getAllProposalsList() {
        try {
            List<Proposal> proposals = proposalService.findAll();
            
            // Inicializar relacionamentos lazy antes da serializaÃ§Ã£o JSON
            for (Proposal proposal : proposals) {
                // Inicializar client
                if (proposal.getClient() != null) {
                    try {
                        proposal.getClient().getId();
                        proposal.getClient().getName();
                    } catch (Exception e) {
                        // Ignorar erros de lazy loading
                    }
                }
                
                // Inicializar createdBy
                if (proposal.getCreatedBy() != null) {
                    try {
                        proposal.getCreatedBy().getId();
                        proposal.getCreatedBy().getName();
                    } catch (Exception e) {
                        // Ignorar erros de lazy loading
                    }
                }
                
                // Inicializar assignedTo
                if (proposal.getAssignedTo() != null) {
                    try {
                        proposal.getAssignedTo().getId();
                        proposal.getAssignedTo().getName();
                    } catch (Exception e) {
                        // Ignorar erros de lazy loading
                    }
                }
                
                // Inicializar items
                if (proposal.getItems() != null) {
                    try {
                        proposal.getItems().size();
                        for (var item : proposal.getItems()) {
                            item.getId();
                        }
                    } catch (Exception e) {
                        // Ignorar erros de lazy loading
                    }
                }
            }
            
            return ResponseEntity.ok(proposals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar proposta por ID", description = "Retorna uma proposta especÃ­fica pelo ID")
    public ResponseEntity<Proposal> getProposalById(@PathVariable("id") String id) {
        Proposal proposal = proposalService.findById(UUID.fromString(id));
        return ResponseEntity.ok(proposal);
    }

    @PostMapping
    @Operation(summary = "Criar nova proposta", description = "Cria uma nova proposta no sistema")
    public ResponseEntity<Proposal> createProposal(@RequestBody ProposalDTO proposalDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        User currentUser = (User) authentication.getPrincipal();
        UUID currentUserId = currentUser.getId();
        
        Proposal createdProposal = proposalService.create(proposalDTO, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProposal);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar proposta", description = "Atualiza uma proposta existente")
    public ResponseEntity<Proposal> updateProposal(@PathVariable("id") String id, @RequestBody ProposalDTO proposalDTO) {
        Proposal updated = proposalService.update(UUID.fromString(id), proposalDTO);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status da proposta", description = "Atualiza apenas o status de uma proposta")
    public ResponseEntity<Proposal> updateProposalStatus(@PathVariable("id") String id, @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate.get("status");
        Proposal updated = proposalService.updateStatus(UUID.fromString(id), status);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir proposta", description = "Exclui uma proposta do sistema")
    public ResponseEntity<Void> deleteProposal(@PathVariable("id") String id) {
        proposalService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar propostas por status", description = "Retorna propostas filtradas por status")
    public ResponseEntity<List<Proposal>> getProposalsByStatus(@PathVariable("status") String status) {
        ProposalStatus proposalStatus = ProposalStatus.valueOf(status.toUpperCase());
        List<Proposal> proposals = proposalService.findByStatus(proposalStatus);
        return ResponseEntity.ok(proposals);
    }

    @GetMapping("/client/{clientId}")
    @Operation(summary = "Buscar propostas por cliente", description = "Retorna propostas de um cliente especÃ­fico")
    public ResponseEntity<List<Proposal>> getProposalsByClient(@PathVariable("clientId") String clientId) {
        return ResponseEntity.ok(proposalService.findByClient(UUID.fromString(clientId)));
    }

    @GetMapping("/lead/{leadId}")
    @Operation(summary = "Buscar propostas por lead", description = "Retorna propostas de um lead especÃ­fico")
    public ResponseEntity<List<Proposal>> getProposalsByLead(@PathVariable("leadId") String leadId) {
        return ResponseEntity.ok(proposalService.findByLead(UUID.fromString(leadId)));
    }

    @GetMapping("/assigned/{userId}")
    @Operation(summary = "Buscar propostas por responsÃ¡vel", description = "Retorna propostas atribuÃ­das a um usuÃ¡rio especÃ­fico")
    public ResponseEntity<List<Proposal>> getProposalsByAssignedTo(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(proposalService.findByAssignedTo(UUID.fromString(userId)));
    }

    @GetMapping("/created/{userId}")
    @Operation(summary = "Buscar propostas por criador", description = "Retorna propostas criadas por um usuÃ¡rio especÃ­fico")
    public ResponseEntity<List<Proposal>> getProposalsByCreatedBy(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(proposalService.findByCreatedBy(UUID.fromString(userId)));
    }

    @GetMapping("/expired")
    @Operation(summary = "Buscar propostas expiradas", description = "Retorna propostas que jÃ¡ expiraram")
    public ResponseEntity<List<Proposal>> getExpiredProposals() {
        List<Proposal> proposals = proposalService.findExpiredProposals();
        return ResponseEntity.ok(proposals);
    }

    @GetMapping("/expiring-soon/{days}")
    @Operation(summary = "Buscar propostas expirando em breve", description = "Retorna propostas que expiram nos prÃ³ximos X dias")
    public ResponseEntity<List<Proposal>> getProposalsExpiringSoon(@PathVariable("days") int days) {
        List<Proposal> proposals = proposalService.findProposalsExpiringSoon(days);
        return ResponseEntity.ok(proposals);
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar propostas", description = "Busca propostas por termo de pesquisa")
    public ResponseEntity<List<Proposal>> searchProposals(@RequestParam(value = "term") String term) {
        List<Proposal> proposals = proposalService.searchProposals(term);
        return ResponseEntity.ok(proposals);
    }

    @GetMapping("/stats/count-by-status")
    @Operation(summary = "EstatÃ­sticas por status", description = "Retorna contagem de propostas por status")
    public ResponseEntity<Map<String, Long>> getCountByStatus() {
        Map<String, Long> stats = Map.of(
            "DRAFT", proposalService.countByStatus(ProposalStatus.DRAFT),
            "SENT", proposalService.countByStatus(ProposalStatus.SENT),
            "UNDER_REVIEW", proposalService.countByStatus(ProposalStatus.UNDER_REVIEW),
            "APPROVED", proposalService.countByStatus(ProposalStatus.APPROVED),
            "REJECTED", proposalService.countByStatus(ProposalStatus.REJECTED),
            "EXPIRED", proposalService.countByStatus(ProposalStatus.EXPIRED),
            "CONVERTED", proposalService.countByStatus(ProposalStatus.CONVERTED)
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/total-value-by-status")
    @Operation(summary = "Valor total por status", description = "Retorna valor total das propostas por status")
    public ResponseEntity<Map<String, BigDecimal>> getTotalValueByStatus() {
        Map<String, BigDecimal> stats = Map.of(
            "DRAFT", proposalService.getTotalValueByStatus(ProposalStatus.DRAFT),
            "SENT", proposalService.getTotalValueByStatus(ProposalStatus.SENT),
            "UNDER_REVIEW", proposalService.getTotalValueByStatus(ProposalStatus.UNDER_REVIEW),
            "APPROVED", proposalService.getTotalValueByStatus(ProposalStatus.APPROVED),
            "REJECTED", proposalService.getTotalValueByStatus(ProposalStatus.REJECTED),
            "EXPIRED", proposalService.getTotalValueByStatus(ProposalStatus.EXPIRED),
            "CONVERTED", proposalService.getTotalValueByStatus(ProposalStatus.CONVERTED)
        );
        return ResponseEntity.ok(stats);
    }
} 
