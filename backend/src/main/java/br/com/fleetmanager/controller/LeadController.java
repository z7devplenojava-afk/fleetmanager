package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.LeadService;

import br.com.fleetmanager.dto.LeadDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Lead;
import br.com.fleetmanager.model.enums.LeadSource;
import br.com.fleetmanager.model.enums.LeadStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
@Tag(name = "Leads", description = "API para gestão de leads comerciais")
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
    @Operation(summary = "Listar todos os leads sem paginação", description = "Retorna uma lista completa de todos os leads")
    public ResponseEntity<List<Lead>> getAllLeadsList() {
        List<Lead> leads = leadService.findAll();
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar lead por ID", description = "Retorna um lead específico pelo ID")
    public ResponseEntity<Lead> getLeadById(@PathVariable String id) {
        Lead lead = leadService.findById(UUID.fromString(id));
        return ResponseEntity.ok(lead);
    }

    @PostMapping
    @Operation(summary = "Criar novo lead", description = "Cria um novo lead no sistema")
    public ResponseEntity<Lead> createLead(@RequestBody LeadDTO leadDTO) {
        // TODO: Obter ID do usuário logado do contexto de segurança
        UUID currentUserId = UUID.randomUUID(); // Temporário
        Lead createdLead = leadService.create(leadDTO, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdLead);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar lead", description = "Atualiza um lead existente")
    public ResponseEntity<Lead> updateLead(@PathVariable String id, @RequestBody LeadDTO leadDTO) {
        Lead updatedLead = leadService.update(UUID.fromString(id), leadDTO);
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
    @Operation(summary = "Buscar leads por responsável", description = "Retorna leads atribuídos a um usuário específico")
    public ResponseEntity<List<Lead>> getLeadsByAssignedTo(@PathVariable String userId) {
        List<Lead> leads = leadService.findByAssignedTo(UUID.fromString(userId));
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/created/{userId}")
    @Operation(summary = "Buscar leads por criador", description = "Retorna leads criados por um usuário específico")
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
    @Operation(summary = "Buscar leads recentes", description = "Retorna leads criados nos últimos X dias")
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
    @Operation(summary = "Estatísticas por status", description = "Retorna contagem de leads por status")
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
    @Operation(summary = "Estatísticas por fonte", description = "Retorna contagem de leads por fonte")
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