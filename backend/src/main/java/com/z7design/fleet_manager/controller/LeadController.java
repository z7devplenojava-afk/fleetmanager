package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.LeadDTO;
import com.z7design.fleet_manager.model.Lead;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import com.z7design.fleet_manager.model.enums.LeadSource;
import com.z7design.fleet_manager.service.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
@Tag(name = "Leads", description = "API para gestÃ£o de leads comerciais")
@Slf4j
public class LeadController {

    @Autowired
    private LeadService leadService;

    @GetMapping
    @Operation(summary = "Listar todos os leads", description = "Retorna uma lista paginada de todos os leads")
    public ResponseEntity<Page<Lead>> getAllLeads(Pageable pageable) {
        Page<Lead> leads = leadService.findAll(pageable);
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/all")
    @Operation(summary = "Listar todos os leads sem paginaÃ§Ã£o", description = "Retorna uma lista completa de todos os leads")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Lead>> getAllLeadsList() {
        List<Lead> leads = leadService.findAll();
        // ForÃ§ar inicializaÃ§Ã£o completa do assignedTo antes da serializaÃ§Ã£o JSON
        // Isso garante que o Jackson possa serializar o relacionamento lazy
        for (Lead lead : leads) {
            if (lead.getAssignedTo() != null) {
                try {
                    // Acessar TODOS os campos do assignedTo para garantir inicializaÃ§Ã£o completa
                    // Isso forÃ§a o Hibernate a carregar o objeto completo antes da serializaÃ§Ã£o
                    var assignedTo = lead.getAssignedTo();
                    UUID id = assignedTo.getId();
                    String name = assignedTo.getName();
                    String username = assignedTo.getUsername();
                    // Acessar mais campos para garantir que o objeto estÃ¡ totalmente carregado
                    assignedTo.getEmail();
                    assignedTo.isEnabled();
                    assignedTo.isAccountNonExpired();
                    // Popular assignedToName para facilitar serializaÃ§Ã£o
                    lead.setAssignedToName(name != null ? name : username);
                    log.info("âœ… Lead {} - AssignedTo inicializado: ID={}, Name={}, Username={}, AssignedToName={}", 
                        lead.getId(), id, name, username, lead.getAssignedToName());
                } catch (Exception e) {
                    log.warn("âŒ Erro ao acessar assignedTo do lead {}: {}", lead.getId(), e.getMessage());
                }
            } else {
                log.debug("âš ï¸ Lead {} - AssignedTo Ã© null", lead.getId());
            }
        }
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar lead por ID", description = "Retorna um lead especÃ­fico pelo ID")
    @Transactional(readOnly = true)
    public ResponseEntity<Lead> getLeadById(@PathVariable String id) {
        Lead lead = leadService.findById(UUID.fromString(id));
        
        // ForÃ§ar inicializaÃ§Ã£o completa do assignedTo antes da serializaÃ§Ã£o JSON
        if (lead.getAssignedTo() != null) {
            try {
                // Acessar TODOS os campos do assignedTo para garantir inicializaÃ§Ã£o completa
                // Isso forÃ§a o Hibernate a carregar o objeto completo antes da serializaÃ§Ã£o
                var assignedTo = lead.getAssignedTo();
                UUID assignedToId = assignedTo.getId();
                String name = assignedTo.getName();
                String username = assignedTo.getUsername();
                // Acessar mais campos para garantir que o objeto estÃ¡ totalmente carregado
                assignedTo.getEmail();
                assignedTo.isEnabled();
                assignedTo.isAccountNonExpired();
                // Popular assignedToName para facilitar serializaÃ§Ã£o
                lead.setAssignedToName(name != null ? name : username);
                log.info("âœ… Lead {} - AssignedTo inicializado no getLeadById: ID={}, Name={}, Username={}, AssignedToName={}", 
                    lead.getId(), assignedToId, name, username, lead.getAssignedToName());
            } catch (Exception e) {
                log.warn("âŒ Erro ao acessar assignedTo do lead {} no getLeadById: {}", lead.getId(), e.getMessage());
            }
        } else {
            log.debug("âš ï¸ Lead {} - AssignedTo Ã© null no getLeadById", lead.getId());
        }
        
        return ResponseEntity.ok(lead);
    }

    @PostMapping
    @Operation(summary = "Criar novo lead", description = "Cria um novo lead no sistema")
    public ResponseEntity<Lead> createLead(@RequestBody LeadDTO leadDTO) {
        try {
            log.info("Criando novo lead: {}", leadDTO.getName());
            
            // Obter username do usuÃ¡rio atual do contexto de seguranÃ§a
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserIdentifier = authentication != null ? authentication.getName() : "system";
            
            log.info("UsuÃ¡rio atual: {}", currentUserIdentifier);
            
            Lead createdLead = leadService.create(leadDTO, currentUserIdentifier);
            log.info("âœ… Lead criado com sucesso: {}", createdLead.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdLead);
        } catch (Exception e) {
            log.error("âŒ Erro ao criar lead: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar lead", description = "Atualiza um lead existente")
    @Transactional
    public ResponseEntity<Lead> updateLead(@PathVariable String id, @RequestBody LeadDTO leadDTO) {
        log.info("ðŸ“¡ RECEBIDO UPDATE LEAD ID: {}", id);
        log.info("ðŸ“¦ Payload: {}", leadDTO);
        Lead updatedLead = leadService.update(UUID.fromString(id), leadDTO);
        
        // ForÃ§ar inicializaÃ§Ã£o completa do assignedTo antes da serializaÃ§Ã£o JSON
        if (updatedLead.getAssignedTo() != null) {
            try {
                // Acessar TODOS os campos do assignedTo para garantir inicializaÃ§Ã£o completa
                var assignedTo = updatedLead.getAssignedTo();
                UUID assignedToId = assignedTo.getId();
                String name = assignedTo.getName();
                String username = assignedTo.getUsername();
                // Acessar mais campos para garantir que o objeto estÃ¡ totalmente carregado
                assignedTo.getEmail();
                assignedTo.isEnabled();
                assignedTo.isAccountNonExpired();
                // Popular assignedToName para facilitar serializaÃ§Ã£o
                updatedLead.setAssignedToName(name != null ? name : username);
                log.info("âœ… Lead {} atualizado - AssignedTo inicializado: ID={}, Name={}, Username={}, AssignedToName={}", 
                    updatedLead.getId(), assignedToId, name, username, updatedLead.getAssignedToName());
            } catch (Exception e) {
                log.warn("âŒ Erro ao acessar assignedTo do lead {} apÃ³s atualizaÃ§Ã£o: {}", updatedLead.getId(), e.getMessage());
            }
        } else {
            log.debug("âš ï¸ Lead {} atualizado - AssignedTo Ã© null", updatedLead.getId());
        }
        
        return ResponseEntity.ok(updatedLead);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do lead", description = "Atualiza apenas o status de um lead")
    public ResponseEntity<Lead> updateLeadStatus(@PathVariable String id, @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate.get("status");
        Lead updatedLead = leadService.updateStatus(UUID.fromString(id), status);
        return ResponseEntity.ok(updatedLead);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir lead", description = "Exclui um lead do sistema")
    public ResponseEntity<Void> deleteLead(@PathVariable String id) {
        leadService.delete(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Buscar leads por status", description = "Retorna leads filtrados por status")
    public ResponseEntity<List<Lead>> getLeadsByStatus(@PathVariable String status) {
        LeadStatus leadStatus = LeadStatus.valueOf(status.toUpperCase());
        List<Lead> leads = leadService.findByStatus(leadStatus);
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/source/{source}")
    @Operation(summary = "Buscar leads por fonte", description = "Retorna leads filtrados por fonte")
    public ResponseEntity<List<Lead>> getLeadsBySource(@PathVariable String source) {
        LeadSource leadSource = LeadSource.valueOf(source.toUpperCase());
        List<Lead> leads = leadService.findBySource(leadSource);
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/assigned/{userId}")
    @Operation(summary = "Buscar leads por responsÃ¡vel", description = "Retorna leads atribuÃ­dos a um usuÃ¡rio especÃ­fico")
    public ResponseEntity<List<Lead>> getLeadsByAssignedTo(@PathVariable String userId) {
        List<Lead> leads = leadService.findByAssignedTo(UUID.fromString(userId));
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/created/{userId}")
    @Operation(summary = "Buscar leads por criador", description = "Retorna leads criados por um usuÃ¡rio especÃ­fico")
    public ResponseEntity<List<Lead>> getLeadsByCreatedBy(@PathVariable String userId) {
        List<Lead> leads = leadService.findByCreatedBy(UUID.fromString(userId));
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/company/{company}")
    @Operation(summary = "Buscar leads por empresa", description = "Retorna leads filtrados por empresa")
    public ResponseEntity<List<Lead>> getLeadsByCompany(@PathVariable String company) {
        List<Lead> leads = leadService.findByCompany(company);
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/recent/{days}")
    @Operation(summary = "Buscar leads recentes", description = "Retorna leads criados nos Ãºltimos X dias")
    public ResponseEntity<List<Lead>> getRecentLeads(@PathVariable int days) {
        List<Lead> leads = leadService.findRecentLeads(days);
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar leads", description = "Busca leads por termo de pesquisa")
    public ResponseEntity<List<Lead>> searchLeads(@RequestParam String term) {
        List<Lead> leads = leadService.searchLeads(term);
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/stats/count-by-status")
    @Operation(summary = "EstatÃ­sticas por status", description = "Retorna contagem de leads por status")
    public ResponseEntity<Map<String, Long>> getCountByStatus() {
        Map<String, Long> stats = Map.of(
            "NEW", leadService.countByStatus(LeadStatus.NEW),
            "CONTACTED", leadService.countByStatus(LeadStatus.CONTACTED),
            "QUALIFIED", leadService.countByStatus(LeadStatus.QUALIFIED),
            "PROPOSAL_SENT", leadService.countByStatus(LeadStatus.PROPOSAL_SENT),
            "NEGOTIATION", leadService.countByStatus(LeadStatus.NEGOTIATION),
            "WON", leadService.countByStatus(LeadStatus.WON),
            "LOST", leadService.countByStatus(LeadStatus.LOST)
        );
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/count-by-source")
    @Operation(summary = "EstatÃ­sticas por fonte", description = "Retorna contagem de leads por fonte")
    public ResponseEntity<Map<String, Long>> getCountBySource() {
        Map<String, Long> stats = Map.of(
            "WEBSITE", leadService.countBySource(LeadSource.WEBSITE),
            "REFERRAL", leadService.countBySource(LeadSource.REFERRAL),
            "SOCIAL_MEDIA", leadService.countBySource(LeadSource.SOCIAL_MEDIA),
            "COLD_CALL", leadService.countBySource(LeadSource.COLD_CALL),
            "EVENT", leadService.countBySource(LeadSource.EVENT),
            "OTHER", leadService.countBySource(LeadSource.OTHER)
        );
        return ResponseEntity.ok(stats);
    }
} 
