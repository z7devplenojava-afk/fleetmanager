package br.com.fleetmanager.controller;

import br.com.fleetmanager.model.KanbanStatus;
import br.com.fleetmanager.model.Opportunity;
import br.com.fleetmanager.repository.KanbanStatusRepository;
import br.com.fleetmanager.repository.OpportunityRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/dashboard")
public class CrmDashboardController {
    @Autowired
    private KanbanStatusRepository kanbanStatusRepository;
    @Autowired
    private OpportunityRepository opportunityRepository;

    @GetMapping("/kanban-summary")
    public Map<String, Object> getKanbanSummary() {
        List<KanbanStatus> statuses = kanbanStatusRepository.findAll();
        Map<String, Object> summary = new HashMap<>();
        for (KanbanStatus status : statuses) {
            long count = opportunityRepository.countByStatus(status);
            summary.put(status.getName(), count);
        }
        return summary;
    }

    @GetMapping("/metrics")
    public Map<String, Object> getCrmMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        List<Opportunity> all = opportunityRepository.findAll();
        // Total de oportunidades
        metrics.put("totalOpportunities", all.size());
        // Valor total
        double totalValue = all.stream().map(o -> o.getEstimatedValue() != null ? o.getEstimatedValue().doubleValue() : 0.0).mapToDouble(Double::doubleValue).sum();
        metrics.put("totalValue", totalValue);
        // Oportunidades criadas por mês (últimos 12 meses)
        Map<String, Long> monthlyCount = new HashMap<>();
        LocalDate now = LocalDate.now();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String label = month.getMonth().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR")) + "/" + month.getYear();
            long count = all.stream().filter(o -> {
                if (o.getCreatedAt() == null) return false;
                LocalDate created;
                Object createdAt = o.getCreatedAt();
                if (createdAt instanceof java.util.Date) {
                    created = ((java.util.Date) createdAt).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                } else if (createdAt instanceof java.time.LocalDateTime) {
                    created = ((java.time.LocalDateTime) createdAt).toLocalDate();
                } else {
                    return false;
                }
                return created.getMonthValue() == month.getMonthValue() && created.getYear() == month.getYear();
            }).count();
            monthlyCount.put(label, count);
        }
        metrics.put("monthlyCount", monthlyCount);
        // Evolução de status por mês (últimos 12 meses)
        Map<String, Map<String, Long>> statusHistory = new HashMap<>();
        List<KanbanStatus> statuses = kanbanStatusRepository.findAll();
        for (KanbanStatus status : statuses) {
            Map<String, Long> history = new HashMap<>();
            for (int i = 11; i >= 0; i--) {
                LocalDate month = now.minusMonths(i);
                String label = month.getMonth().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR")) + "/" + month.getYear();
                long count = all.stream().filter(o -> {
                    if (o.getCreatedAt() == null || o.getStatus() == null) return false;
                    LocalDate created;
                    Object createdAt = o.getCreatedAt();
                    if (createdAt instanceof java.util.Date) {
                        created = ((java.util.Date) createdAt).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                    } else if (createdAt instanceof java.time.LocalDateTime) {
                        created = ((java.time.LocalDateTime) createdAt).toLocalDate();
                    } else {
                        return false;
                    }
                    return created.getMonthValue() == month.getMonthValue() && created.getYear() == month.getYear() && o.getStatus().getId().equals(status.getId());
                }).count();
                history.put(label, count);
            }
            statusHistory.put(status.getName(), history);
        }
        metrics.put("statusHistory", statusHistory);
        return metrics;
    }
} 