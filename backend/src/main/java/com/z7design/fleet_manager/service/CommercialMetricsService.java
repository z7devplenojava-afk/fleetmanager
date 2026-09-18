package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CommercialMetricsDTO;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Lead;
import com.z7design.fleet_manager.model.Proposal;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import com.z7design.fleet_manager.model.enums.ProposalStatus;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.LeadRepository;
import com.z7design.fleet_manager.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CommercialMetricsService {

    private final LeadRepository leadRepository;
    private final ProposalRepository proposalRepository;
    private final ClientRepository clientRepository;
    private final UserCompanyResolver userCompanyResolver;

    public CommercialMetricsDTO getCommercialMetrics() {
        log.info("📊 Calculando métricas de desempenho comercial");

        UUID companyId = userCompanyResolver.resolveCurrentCompanyId();

        List<Lead> leads = leadRepository.findAll();
        List<Proposal> proposals = proposalRepository.findAll();
        List<Client> clients = companyId != null 
                ? clientRepository.findByCompanyId(companyId) 
                : clientRepository.findAll();

        long totalLeads = leads.size();
        long wonLeads = leads.stream().filter(l -> l.getStatus() == LeadStatus.WON || l.getStatus() == LeadStatus.QUALIFIED).count();
        long lostLeads = leads.stream().filter(l -> l.getStatus() == LeadStatus.LOST).count();
        long activeLeads = totalLeads - wonLeads - lostLeads;

        long totalProposals = proposals.size();
        long totalClients = clients.size();

        // Taxa de conversão: (Won / Total) * 100
        double conversionRate = totalLeads > 0 
                ? BigDecimal.valueOf((double) wonLeads / totalLeads * 100).setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        // Pipeline Value (Propostas em andamento / Rascunho / Enviadas / Em Revisão)
        BigDecimal totalPipelineValue = proposals.stream()
                .filter(p -> p.getStatus() == ProposalStatus.SENT || p.getStatus() == ProposalStatus.UNDER_REVIEW || p.getStatus() == ProposalStatus.DRAFT)
                .map(p -> p.getTotalValue() != null ? p.getTotalValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Valor Ganho / Fechado
        BigDecimal totalWonValue = proposals.stream()
                .filter(p -> p.getStatus() == ProposalStatus.APPROVED || p.getStatus() == ProposalStatus.CONVERTED)
                .map(p -> p.getTotalValue() != null ? p.getTotalValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Se totalWonValue for zero, tenta somar dos leads convertidos
        if (totalWonValue.compareTo(BigDecimal.ZERO) == 0) {
            totalWonValue = leads.stream()
                    .filter(l -> l.getStatus() == LeadStatus.WON)
                    .map(l -> l.getEstimatedValue() != null ? l.getEstimatedValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // Ticket Médio
        long wonCount = wonLeads > 0 ? wonLeads : 1;
        BigDecimal averageTicket = totalWonValue.divide(BigDecimal.valueOf(wonCount), 2, RoundingMode.HALF_UP);

        // Tempo médio de fechamento (dias)
        double averageClosingDays = 0.0;
        List<Long> closingDaysList = leads.stream()
                .filter(l -> l.getStatus() == LeadStatus.WON && l.getCreatedAt() != null && l.getUpdatedAt() != null)
                .map(l -> Duration.between(l.getCreatedAt(), l.getUpdatedAt()).toDays())
                .filter(days -> days >= 0)
                .collect(Collectors.toList());

        if (!closingDaysList.isEmpty()) {
            double avg = closingDaysList.stream().mapToLong(Long::longValue).average().orElse(0.0);
            averageClosingDays = BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP).doubleValue();
        } else {
            averageClosingDays = 12.5; // Média padrão estimada caso base inicial não tenha histórico
        }

        // 1. Funil de Vendas
        List<CommercialMetricsDTO.FunnelStageDTO> salesFunnel = buildSalesFunnel(leads, proposals);

        // 2. Performance por Vendedor
        List<CommercialMetricsDTO.SalespersonPerformanceDTO> performanceBySalesperson = buildSalespersonPerformance(leads, proposals);

        // 3. Leads por Origem / Canal de Prospecção
        Map<String, Long> leadsBySource = leads.stream()
                .collect(Collectors.groupingBy(
                        l -> l.getSource() != null ? l.getSource().name() : "OUTROS",
                        Collectors.counting()
                ));

        // 4. Histórico Mensal de Faturamento
        Map<String, BigDecimal> monthlyRevenue = buildMonthlyRevenue(proposals, leads);

        return CommercialMetricsDTO.builder()
                .totalLeads(totalLeads)
                .activeLeads(activeLeads)
                .wonLeads(wonLeads)
                .lostLeads(lostLeads)
                .totalProposals(totalProposals)
                .totalClients(totalClients)
                .conversionRate(conversionRate)
                .totalPipelineValue(totalPipelineValue)
                .totalWonValue(totalWonValue)
                .averageTicket(averageTicket)
                .averageClosingDays(averageClosingDays)
                .salesFunnel(salesFunnel)
                .performanceBySalesperson(performanceBySalesperson)
                .leadsBySource(leadsBySource)
                .monthlyRevenue(monthlyRevenue)
                .build();
    }

    private List<CommercialMetricsDTO.FunnelStageDTO> buildSalesFunnel(List<Lead> leads, List<Proposal> proposals) {
        long total = Math.max(leads.size(), 1);

        long prospeccao = leads.stream().filter(l -> l.getStatus() == LeadStatus.NEW || l.getStatus() == LeadStatus.CONTACTED).count();
        long qualificacao = leads.stream().filter(l -> l.getStatus() == LeadStatus.QUALIFIED).count();
        long proposta = proposals.stream().filter(p -> p.getStatus() == ProposalStatus.SENT || p.getStatus() == ProposalStatus.DRAFT).count();
        long negociacao = proposals.stream().filter(p -> p.getStatus() == ProposalStatus.UNDER_REVIEW).count();
        long fechados = proposals.stream().filter(p -> p.getStatus() == ProposalStatus.APPROVED || p.getStatus() == ProposalStatus.CONVERTED).count();

        // Se propostas estiverem vazias, usa status dos leads
        if (proposta == 0 && fechados == 0) {
            fechados = leads.stream().filter(l -> l.getStatus() == LeadStatus.WON).count();
        }

        BigDecimal valProspeccao = sumLeadValues(leads, LeadStatus.NEW, LeadStatus.CONTACTED);
        BigDecimal valQualificacao = sumLeadValues(leads, LeadStatus.QUALIFIED);
        BigDecimal valProposta = sumProposalValues(proposals, ProposalStatus.SENT, ProposalStatus.DRAFT);
        BigDecimal valNegociacao = sumProposalValues(proposals, ProposalStatus.UNDER_REVIEW);
        BigDecimal valFechados = sumProposalValues(proposals, ProposalStatus.APPROVED, ProposalStatus.CONVERTED);

        List<CommercialMetricsDTO.FunnelStageDTO> stages = new ArrayList<>();
        stages.add(CommercialMetricsDTO.FunnelStageDTO.builder().stage("PROSPECCAO").label("1. Prospecção").count(prospeccao).value(valProspeccao).percentage(calcPct(prospeccao, total)).build());
        stages.add(CommercialMetricsDTO.FunnelStageDTO.builder().stage("QUALIFICACAO").label("2. Qualificação").count(qualificacao).value(valQualificacao).percentage(calcPct(qualificacao, total)).build());
        stages.add(CommercialMetricsDTO.FunnelStageDTO.builder().stage("PROPOSTA").label("3. Proposta Enviada").count(proposta).value(valProposta).percentage(calcPct(proposta, total)).build());
        stages.add(CommercialMetricsDTO.FunnelStageDTO.builder().stage("NEGOCIACAO").label("4. Em Negociação").count(negociacao).value(valNegociacao).percentage(calcPct(negociacao, total)).build());
        stages.add(CommercialMetricsDTO.FunnelStageDTO.builder().stage("FECHAMENTO").label("5. Fechado / Ganho").count(fechados).value(valFechados).percentage(calcPct(fechados, total)).build());

        return stages;
    }

    private List<CommercialMetricsDTO.SalespersonPerformanceDTO> buildSalespersonPerformance(List<Lead> leads, List<Proposal> proposals) {
        Map<String, List<Lead>> leadsByAgent = leads.stream()
                .filter(l -> l.getAssignedTo() != null || l.getCreatedBy() != null)
                .collect(Collectors.groupingBy(l -> {
                    if (l.getAssignedTo() != null && l.getAssignedTo().getName() != null) return l.getAssignedTo().getName();
                    if (l.getCreatedBy() != null && l.getCreatedBy().getName() != null) return l.getCreatedBy().getName();
                    return "Equipe Comercial";
                }));

        List<CommercialMetricsDTO.SalespersonPerformanceDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<Lead>> entry : leadsByAgent.entrySet()) {
            String name = entry.getKey();
            List<Lead> agentLeads = entry.getValue();

            long total = agentLeads.size();
            long won = agentLeads.stream().filter(l -> l.getStatus() == LeadStatus.WON).count();
            BigDecimal revenue = agentLeads.stream()
                    .filter(l -> l.getStatus() == LeadStatus.WON)
                    .map(l -> l.getEstimatedValue() != null ? l.getEstimatedValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double rate = total > 0 ? BigDecimal.valueOf((double) won / total * 100).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0;

            String email = agentLeads.stream()
                    .filter(l -> l.getAssignedTo() != null && l.getAssignedTo().getEmail() != null)
                    .map(l -> l.getAssignedTo().getEmail())
                    .findFirst()
                    .orElse("");

            result.add(CommercialMetricsDTO.SalespersonPerformanceDTO.builder()
                    .salespersonName(name)
                    .email(email)
                    .totalDeals(total)
                    .wonDeals(won)
                    .totalRevenue(revenue)
                    .conversionRate(rate)
                    .build());
        }

        // Ordenar por faturamento decrescente
        result.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));
        return result;
    }

    private Map<String, BigDecimal> buildMonthlyRevenue(List<Proposal> proposals, List<Lead> leads) {
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM/yy", new Locale("pt", "BR"));
        LocalDateTime now = LocalDateTime.now();

        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthDate = now.minusMonths(i);
            String label = monthDate.format(dtf);
            map.put(label, BigDecimal.ZERO);
        }

        for (Proposal p : proposals) {
            if ((p.getStatus() == ProposalStatus.APPROVED || p.getStatus() == ProposalStatus.CONVERTED) && p.getCreatedAt() != null) {
                String label = p.getCreatedAt().format(dtf);
                if (map.containsKey(label)) {
                    BigDecimal current = map.get(label);
                    BigDecimal add = p.getTotalValue() != null ? p.getTotalValue() : BigDecimal.ZERO;
                    map.put(label, current.add(add));
                }
            }
        }

        return map;
    }

    private double calcPct(long part, long total) {
        if (total == 0) return 0.0;
        return BigDecimal.valueOf((double) part / total * 100).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private BigDecimal sumLeadValues(List<Lead> leads, LeadStatus... statuses) {
        Set<LeadStatus> set = Set.of(statuses);
        return leads.stream()
                .filter(l -> set.contains(l.getStatus()))
                .map(l -> l.getEstimatedValue() != null ? l.getEstimatedValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumProposalValues(List<Proposal> proposals, ProposalStatus... statuses) {
        Set<ProposalStatus> set = Set.of(statuses);
        return proposals.stream()
                .filter(p -> set.contains(p.getStatus()))
                .map(p -> p.getTotalValue() != null ? p.getTotalValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
