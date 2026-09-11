package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.ProspectingLeadDTO;
import com.z7design.fleet_manager.model.ProspectingLead;
import com.z7design.fleet_manager.service.ProspectingAgentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/prospecting")
@Tag(name = "Prospecção", description = "Agent de Prospecção - busca, enriquecimento e qualificação de leads via Google Maps")
@Slf4j
public class ProspectingController {

    @Autowired
    private ProspectingAgentService prospectingAgentService;

    @PostMapping("/search")
    @Operation(summary = "Buscar empresas via Google Maps", description = "Busca empresas por atividade, CNAE, CNPJ, cidade ou descrição")
    public ResponseEntity<List<ProspectingLead>> search(@RequestBody ProspectingLeadDTO filters) {
        log.info("🔍 Requisição de prospecção recebida");
        List<ProspectingLead> results = prospectingAgentService.search(filters);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/search/cnpj")
    @Operation(summary = "Buscar por CNPJ", description = "Busca uma empresa específica pelo CNPJ")
    public ResponseEntity<List<ProspectingLead>> searchByCnpj(@RequestBody Map<String, String> body) {
        String cnpj = body.get("cnpj");
        String searchTerm = body.getOrDefault("searchTerm", "Busca por CNPJ");
        List<ProspectingLead> results = prospectingAgentService.searchByCnpj(cnpj, searchTerm);
        return ResponseEntity.ok(results);
    }

    @GetMapping
    @Operation(summary = "Listar todos os leads prospectados")
    public ResponseEntity<List<ProspectingLead>> findAll() {
        return ResponseEntity.ok(prospectingAgentService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar lead prospectado por ID")
    public ResponseEntity<ProspectingLead> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(prospectingAgentService.findById(id));
    }

    @GetMapping("/filters")
    @Operation(summary = "Buscar com filtros", description = "Busca leads prospectados por cidade, CNAE, atividade e status")
    public ResponseEntity<List<ProspectingLead>> findByFilters(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String cnae,
            @RequestParam(required = false) String activity,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(prospectingAgentService.findByFilters(city, cnae, activity, status));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar por texto", description = "Busca em todos os campos de leads prospectados")
    public ResponseEntity<List<ProspectingLead>> searchLeads(@RequestParam String term) {
        return ResponseEntity.ok(prospectingAgentService.searchLeads(term));
    }

    @GetMapping("/stats")
    @Operation(summary = "Estatísticas da prospecção")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(prospectingAgentService.getStats());
    }

    @PostMapping("/{id}/enrich")
    @Operation(summary = "Enriquecer lead", description = "Enriquece um lead prospectado com dados adicionais do Google Places")
    public ResponseEntity<ProspectingLead> enrich(@PathVariable UUID id) {
        log.info("🔄 Enriquecendo lead: {}", id);
        ProspectingLead enriched = prospectingAgentService.enrich(id);
        return ResponseEntity.ok(enriched);
    }

    @PostMapping("/{id}/qualify")
    @Operation(summary = "Qualificar lead", description = "Avalia e qualifica um lead prospectado com base nos dados disponíveis")
    public ResponseEntity<ProspectingLead> qualify(@PathVariable UUID id) {
        log.info("✅ Qualificando lead: {}", id);
        ProspectingLead qualified = prospectingAgentService.qualify(id);
        return ResponseEntity.ok(qualified);
    }

    @PostMapping("/{id}/send-to-kanban")
    @Operation(summary = "Enviar para Kanban", description = "Envia um lead qualificado para o Kanban CRM (cria Lead + Opportunity)")
    public ResponseEntity<ProspectingLead> sendToKanban(@PathVariable UUID id) {
        log.info("📤 Enviando lead para Kanban: {}", id);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUser = authentication != null ? authentication.getName() : "system";
        ProspectingLead sent = prospectingAgentService.sendToKanban(id, currentUser);
        return ResponseEntity.ok(sent);
    }

    @PostMapping("/send-selected-to-kanban")
    @Operation(summary = "Enviar selecionados para Kanban", description = "Envia múltiplos leads qualificados para o Kanban CRM")
    public ResponseEntity<List<ProspectingLead>> sendSelectedToKanban(@RequestBody Map<String, List<UUID>> body) {
        List<UUID> ids = body.get("ids");
        log.info("📤 Enviando {} leads para Kanban", ids.size());
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUser = authentication != null ? authentication.getName() : "system";
        List<ProspectingLead> results = prospectingAgentService.sendMultipleToKanban(ids, currentUser);
        return ResponseEntity.ok(results);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir lead prospectado")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        prospectingAgentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
