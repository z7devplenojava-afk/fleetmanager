package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommercialMetricsDTO {

    // Totais principais
    private long totalLeads;
    private long activeLeads;
    private long wonLeads;
    private long lostLeads;
    private long totalProposals;
    private long totalClients;

    // Indicadores Chave (KPIs)
    private double conversionRate; // % de conversão de leads para fechamento
    private BigDecimal totalPipelineValue; // Valor total em negociação
    private BigDecimal totalWonValue; // Faturamento total fechado
    private BigDecimal averageTicket; // Ticket médio
    private double averageClosingDays; // Tempo médio de fechamento em dias

    // Funil de Vendas por Etapa
    private List<FunnelStageDTO> salesFunnel;

    // Faturamento Mensal por Vendedor
    private List<SalespersonPerformanceDTO> performanceBySalesperson;

    // Distribuição de Prospecção por Canal/Origem
    private Map<String, Long> leadsBySource;

    // Histórico de Faturamento Mensal
    private Map<String, BigDecimal> monthlyRevenue;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FunnelStageDTO {
        private String stage;
        private String label;
        private long count;
        private BigDecimal value;
        private double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalespersonPerformanceDTO {
        private String salespersonName;
        private String email;
        private long wonDeals;
        private long totalDeals;
        private BigDecimal totalRevenue;
        private double conversionRate;
    }
}
