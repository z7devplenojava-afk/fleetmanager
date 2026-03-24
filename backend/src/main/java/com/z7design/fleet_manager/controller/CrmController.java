package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.LeadService;
import com.z7design.fleet_manager.service.ProposalService;
import com.z7design.fleet_manager.service.QuoteService;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import com.z7design.fleet_manager.model.enums.ProposalStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/crm")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "CRM", description = "Endpoints para mÃ©tricas e dashboard do CRM Comercial")
public class CrmController {

    private final LeadService leadService;
    private final ProposalService proposalService;
    private final QuoteService quoteService;

    @GetMapping("/dashboard/metrics")
    @Operation(summary = "Obter mÃ©tricas do CRM", description = "Retorna mÃ©tricas agregadas para o dashboard do CRM")
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getCrmMetrics() {
        try {
            log.info("Buscando mÃ©tricas do CRM");
            
            // Total de leads (contar todos)
            long totalLeads = leadService.findAll().size();
            
            // Leads por status
            long qualifiedLeads = leadService.countByStatus(LeadStatus.QUALIFIED);
            long proposalSentLeads = leadService.countByStatus(LeadStatus.PROPOSAL_SENT);
            long negotiationLeads = leadService.countByStatus(LeadStatus.NEGOTIATION);
            long wonLeads = leadService.countByStatus(LeadStatus.WON);
            
            // Oportunidades ativas (leads qualificados + em negociaÃ§Ã£o)
            long activeOpportunities = qualifiedLeads + negotiationLeads + proposalSentLeads;
            
            // Total de propostas
            long totalProposals = proposalService.findAll().size();
            
            // Total de orÃ§amentos
            long totalQuotes = quoteService.findAll().size();
            
            // Calcular receita prevista (soma dos valores das propostas enviadas)
            BigDecimal estimatedRevenue = proposalService.getTotalValueByStatus(ProposalStatus.SENT)
                    .add(proposalService.getTotalValueByStatus(ProposalStatus.UNDER_REVIEW));
            
            // Taxa de conversÃ£o (leads ganhos / total de leads)
            double conversionRate = totalLeads > 0 ? (wonLeads * 100.0 / totalLeads) : 0.0;
            
            // Contagem por mÃªs (Ãºltimos 6 meses) - simplificado
            Map<String, Long> monthlyCount = new HashMap<>();
            for (int i = 5; i >= 0; i--) {
                LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                long count = leadService.findRecentLeads(30).stream()
                        .filter(lead -> lead.getCreatedAt() != null && 
                                lead.getCreatedAt().isAfter(monthStart) && 
                                lead.getCreatedAt().isBefore(monthStart.plusMonths(1)))
                        .count();
                String monthKey = monthStart.getMonth().name().substring(0, 3) + "/" + monthStart.getYear();
                monthlyCount.put(monthKey, count);
            }
            
            // HistÃ³rico de status (Ãºltimos 6 meses) - simplificado
            Map<String, Map<String, Long>> statusHistory = new HashMap<>();
            for (int i = 5; i >= 0; i--) {
                LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                String monthKey = monthStart.getMonth().name().substring(0, 3) + "/" + monthStart.getYear();
                
                Map<String, Long> statusCount = new HashMap<>();
                statusCount.put("NEW", leadService.findByStatus(LeadStatus.NEW).stream()
                        .filter(lead -> lead.getCreatedAt() != null && 
                                lead.getCreatedAt().isAfter(monthStart) && 
                                lead.getCreatedAt().isBefore(monthStart.plusMonths(1)))
                        .count());
                statusCount.put("CONTACTED", leadService.findByStatus(LeadStatus.CONTACTED).stream()
                        .filter(lead -> lead.getCreatedAt() != null && 
                                lead.getCreatedAt().isAfter(monthStart) && 
                                lead.getCreatedAt().isBefore(monthStart.plusMonths(1)))
                        .count());
                statusCount.put("QUALIFIED", leadService.findByStatus(LeadStatus.QUALIFIED).stream()
                        .filter(lead -> lead.getCreatedAt() != null && 
                                lead.getCreatedAt().isAfter(monthStart) && 
                                lead.getCreatedAt().isBefore(monthStart.plusMonths(1)))
                        .count());
                statusCount.put("NEGOTIATION", leadService.findByStatus(LeadStatus.NEGOTIATION).stream()
                        .filter(lead -> lead.getCreatedAt() != null && 
                                lead.getCreatedAt().isAfter(monthStart) && 
                                lead.getCreatedAt().isBefore(monthStart.plusMonths(1)))
                        .count());
                statusCount.put("WON", leadService.findByStatus(LeadStatus.WON).stream()
                        .filter(lead -> lead.getCreatedAt() != null && 
                                lead.getCreatedAt().isAfter(monthStart) && 
                                lead.getCreatedAt().isBefore(monthStart.plusMonths(1)))
                        .count());
                statusCount.put("LOST", leadService.findByStatus(LeadStatus.LOST).stream()
                        .filter(lead -> lead.getCreatedAt() != null && 
                                lead.getCreatedAt().isAfter(monthStart) && 
                                lead.getCreatedAt().isBefore(monthStart.plusMonths(1)))
                        .count());
                
                statusHistory.put(monthKey, statusCount);
            }
            
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalLeads", totalLeads);
            metrics.put("activeOpportunities", activeOpportunities);
            metrics.put("totalProposals", totalProposals);
            metrics.put("totalQuotes", totalQuotes);
            metrics.put("conversionRate", Math.round(conversionRate * 10.0) / 10.0);
            metrics.put("estimatedRevenue", estimatedRevenue != null ? estimatedRevenue : BigDecimal.ZERO);
            metrics.put("totalValue", estimatedRevenue != null ? estimatedRevenue : BigDecimal.ZERO);
            metrics.put("monthlyCount", monthlyCount);
            metrics.put("statusHistory", statusHistory);
            
            log.info("âœ… MÃ©tricas do CRM calculadas com sucesso");
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            log.error("âŒ Erro ao calcular mÃ©tricas do CRM", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/dashboard/kanban-summary")
    @Operation(summary = "Obter resumo do Kanban", description = "Retorna resumo de leads por status para o Kanban")
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getKanbanSummary() {
        try {
            log.info("Buscando resumo do Kanban");
            
            Map<String, Long> summary = new HashMap<>();
            summary.put("NEW", leadService.countByStatus(LeadStatus.NEW));
            summary.put("CONTACTED", leadService.countByStatus(LeadStatus.CONTACTED));
            summary.put("QUALIFIED", leadService.countByStatus(LeadStatus.QUALIFIED));
            summary.put("PROPOSAL_SENT", leadService.countByStatus(LeadStatus.PROPOSAL_SENT));
            summary.put("NEGOTIATION", leadService.countByStatus(LeadStatus.NEGOTIATION));
            summary.put("WON", leadService.countByStatus(LeadStatus.WON));
            summary.put("LOST", leadService.countByStatus(LeadStatus.LOST));
            
            log.info("âœ… Resumo do Kanban calculado com sucesso");
            return ResponseEntity.ok(Map.of("summary", summary));
        } catch (Exception e) {
            log.error("âŒ Erro ao calcular resumo do Kanban", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}


