package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContasAPagarCustomReportRequestDTO {
    // 1. Período & Vencimentos Próximos
    private String dateBase; // "VENCIMENTO", "EMISSAO", "PAGAMENTO"
    private LocalDate startDate;
    private LocalDate endDate;
    private String dueSoonRange; // "ALL", "7", "15", "30"

    // 2. Filtros Corporativos e Status
    private String companySigla; // ou "TODAS"
    private String operationalUnit; // ou "TODAS"
    private String workSector; // obra / setor
    private String status; // "TODOS", "PENDENTE", "PAGA", "VENCIDA", "CANCELADA"
    private String expenseType; // "TODOS", "FIXA", "VARIAVEL"
    private String supplierName; // ou "TODOS"

    // Agrupamento e Subtotais Automáticos
    // "NONE" (Listagem Simples), "UNIT_SECTOR", "SECTOR", "UNIT", "COMPANY", "MONTH_YEAR", "STATUS"
    private String groupBy;

    // 3. Colunas do Relatório Selecionadas
    private List<String> columns;

    // Formato de saída: "PDF" ou "EXCEL"
    private String format;
}
