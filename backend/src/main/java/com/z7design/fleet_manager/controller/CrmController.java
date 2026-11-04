package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.model.Lead;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import com.z7design.fleet_manager.model.enums.ProposalStatus;
import com.z7design.fleet_manager.repository.LeadRepository;
import com.z7design.fleet_manager.repository.ProposalRepository;
import com.z7design.fleet_manager.repository.QuoteRepository;
import com.z7design.fleet_manager.service.LeadService;
import com.z7design.fleet_manager.service.ProposalService;
import com.z7design.fleet_manager.service.QuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/crm")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "CRM", description = "Endpoints para métricas e dashboard do CRM Comercial")
public class CrmController {

    private final LeadService leadService;
    private final ProposalService proposalService;
    private final QuoteService quoteService;
    private final LeadRepository leadRepository;
    private final ProposalRepository proposalRepository;
    private final QuoteRepository quoteRepository;

    @GetMapping("/dashboard/metrics")
    @Operation(summary = "Obter métricas do CRM", description = "Retorna métricas agregadas para o dashboard do CRM")
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getCrmMetrics() {
        try {
            log.info("Buscando métricas do CRM");

            long totalLeads = 0L;
            try {
                totalLeads = leadRepository.count();
            } catch (Exception e) {
                log.warn("Erro ao contar total de leads: {}", e.getMessage());
            }

            long qualifiedLeads = 0L;
            long proposalSentLeads = 0L;
            long negotiationLeads = 0L;
            long wonLeads = 0L;
            try {
                qualifiedLeads = leadRepository.countByStatus(LeadStatus.QUALIFIED);
                proposalSentLeads = leadRepository.countByStatus(LeadStatus.PROPOSAL_SENT);
                negotiationLeads = leadRepository.countByStatus(LeadStatus.NEGOTIATION);
                wonLeads = leadRepository.countByStatus(LeadStatus.WON);
            } catch (Exception e) {
                log.warn("Erro ao contar leads por status: {}", e.getMessage());
            }

            long activeOpportunities = qualifiedLeads + negotiationLeads + proposalSentLeads;

            long totalProposals = 0L;
            try {
                totalProposals = proposalRepository.count();
            } catch (Exception e) {
                log.warn("Erro ao contar propostas: {}", e.getMessage());
            }

            long totalQuotes = 0L;
            try {
                totalQuotes = quoteRepository.count();
            } catch (Exception e) {
                log.warn("Erro ao contar orçamentos: {}", e.getMessage());
            }

            BigDecimal estimatedRevenue = BigDecimal.ZERO;
            try {
                BigDecimal sentValue = proposalService.getTotalValueByStatus(ProposalStatus.SENT);
                BigDecimal reviewValue = proposalService.getTotalValueByStatus(ProposalStatus.UNDER_REVIEW);
                estimatedRevenue = (sentValue != null ? sentValue : BigDecimal.ZERO)
                        .add(reviewValue != null ? reviewValue : BigDecimal.ZERO);
            } catch (Exception e) {
                log.warn("Erro ao calcular receita prevista de propostas: {}", e.getMessage());
            }

            double conversionRate = totalLeads > 0 ? (wonLeads * 100.0 / totalLeads) : 0.0;

            // Histórico e contagens dos últimos 6 meses (otimizado via 1 única consulta em memória)
            Map<String, Long> monthlyCount = new LinkedHashMap<>();
            Map<String, Map<String, Long>> statusHistory = new LinkedHashMap<>();

            LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            List<Lead> recentLeads = Collections.emptyList();
            try {
                recentLeads = leadRepository.findByCreatedAtAfter(sixMonthsAgo);
            } catch (Exception e) {
                log.warn("Erro ao buscar leads recentes dos últimos 6 meses: {}", e.getMessage());
            }

            for (int i = 5; i >= 0; i--) {
                LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                LocalDateTime monthEnd = monthStart.plusMonths(1);
                String monthKey = monthStart.getMonth().name().substring(0, 3) + "/" + monthStart.getYear();

                List<Lead> monthLeads = recentLeads.stream()
                        .filter(lead -> lead.getCreatedAt() != null &&
                                !lead.getCreatedAt().isBefore(monthStart) &&
                                lead.getCreatedAt().isBefore(monthEnd))
                        .toList();

                monthlyCount.put(monthKey, (long) monthLeads.size());

                Map<String, Long> statusCount = new HashMap<>();
                for (LeadStatus st : LeadStatus.values()) {
                    long count = monthLeads.stream()
                            .filter(l -> l.getStatus() == st)
                            .count();
                    statusCount.put(st.name(), count);
                }
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

            log.info("✅ Métricas do CRM calculadas com sucesso");
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            log.error("❌ Erro ao calcular métricas do CRM", e);
            // Fallback seguro com métricas zeradas para NUNCA retornar 500 para a tela do CRM
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("totalLeads", 0L);
            fallback.put("activeOpportunities", 0L);
            fallback.put("totalProposals", 0L);
            fallback.put("totalQuotes", 0L);
            fallback.put("conversionRate", 0.0);
            fallback.put("estimatedRevenue", BigDecimal.ZERO);
            fallback.put("totalValue", BigDecimal.ZERO);
            fallback.put("monthlyCount", Collections.emptyMap());
            fallback.put("statusHistory", Collections.emptyMap());
            return ResponseEntity.ok(fallback);
        }
    }

    @GetMapping("/dashboard/kanban-summary")
    @Operation(summary = "Obter resumo do Kanban", description = "Retorna resumo de leads por status para o Kanban")
    @PreAuthorize("hasAnyAuthority('CRM_READ', 'LEADS_READ') or hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getKanbanSummary() {
        try {
            log.info("Buscando resumo do Kanban");

            Map<String, Long> summary = new HashMap<>();
            for (LeadStatus st : LeadStatus.values()) {
                try {
                    summary.put(st.name(), leadRepository.countByStatus(st));
                } catch (Exception e) {
                    summary.put(st.name(), 0L);
                }
            }

            log.info("✅ Resumo do Kanban calculado com sucesso");
            return ResponseEntity.ok(Map.of("summary", summary));
        } catch (Exception e) {
            log.error("❌ Erro ao calcular resumo do Kanban", e);
            Map<String, Long> emptySummary = new HashMap<>();
            for (LeadStatus st : LeadStatus.values()) {
                emptySummary.put(st.name(), 0L);
            }
            return ResponseEntity.ok(Map.of("summary", emptySummary));
        }
    }
}
