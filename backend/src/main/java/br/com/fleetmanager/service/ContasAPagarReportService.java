package br.com.fleetmanager.service;

import br.com.fleetmanager.model.Invoice;
import br.com.fleetmanager.model.enums.ExpenseStatus;
import br.com.fleetmanager.model.enums.ExpenseType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContasAPagarReportService {
    
    private final InvoiceService invoiceService;
    private final ReportTemplateService reportTemplateService;
    
    /**
     * Gera relatório de contas a pagar por período
     */
    public String generateContasAPagarReport(LocalDate startDate, LocalDate endDate) {
        log.info("Gerando relatório de contas a pagar para período: {} a {}", startDate, endDate);
        
        try {
            // Buscar todas as contas no período
            List<Invoice> invoices = invoiceService.findByDueDateBetween(startDate, endDate);
            
            // Preparar dados para o template
            Map<String, Object> reportData = prepareReportData(invoices, startDate, endDate);
            
            // Gerar relatório completo
            String report = reportTemplateService.generateFullReport("contas-a-pagar", reportData);
            
            log.info("Relatório gerado com sucesso para {} contas", invoices.size());
            return report;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório de contas a pagar: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatório: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatório de contas a pagar por status
     */
    public String generateContasAPagarReportByStatus(ExpenseStatus status) {
        log.info("Gerando relatório de contas a pagar por status: {}", status);
        
        try {
            List<Invoice> invoices = invoiceService.findByStatus(status);
            
            Map<String, Object> reportData = prepareReportData(invoices, null, null);
            reportData.put("reportTitle", "Relatório de Contas " + getStatusDisplayName(status));
            
            String report = reportTemplateService.generateFullReport("contas-a-pagar", reportData);
            
            log.info("Relatório por status gerado com sucesso para {} contas", invoices.size());
            return report;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório por status: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatório: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatório de contas a pagar por tipo
     */
    public String generateContasAPagarReportByType(ExpenseType type) {
        log.info("Gerando relatório de contas a pagar por tipo: {}", type);
        
        try {
            List<Invoice> invoices = invoiceService.findByType(type);
            
            Map<String, Object> reportData = prepareReportData(invoices, null, null);
            reportData.put("reportTitle", "Relatório de " + getTypeDisplayName(type));
            
            String report = reportTemplateService.generateFullReport("contas-a-pagar", reportData);
            
            log.info("Relatório por tipo gerado com sucesso para {} contas", invoices.size());
            return report;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório por tipo: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatório: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gera relatório resumido de contas a pagar
     */
    public String generateContasAPagarSummaryReport() {
        log.info("Gerando relatório resumido de contas a pagar");
        
        try {
            List<Invoice> allInvoices = invoiceService.findAll();
            
            Map<String, Object> reportData = prepareSummaryData(allInvoices);
            
            String report = reportTemplateService.generateFullReport("contas-a-pagar", reportData);
            
            log.info("Relatório resumido gerado com sucesso");
            return report;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório resumido: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar relatório: " + e.getMessage(), e);
        }
    }
    
    /**
     * Prepara dados para o template de relatório
     */
    private Map<String, Object> prepareReportData(List<Invoice> invoices, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> data = new HashMap<>();
        
        // Dados básicos
        data.put("reportDate", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        data.put("currentDate", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        data.put("pageNumber", "1");
        
        if (startDate != null && endDate != null) {
            data.put("startDate", startDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            data.put("endDate", endDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }
        
        // Estatísticas
        int totalContas = invoices.size();
        BigDecimal valorTotal = invoices.stream()
                .map(Invoice::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long contasAbertas = invoices.stream()
                .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE)
                .count();
        
        long contasPagas = invoices.stream()
                .filter(i -> i.getStatus() == ExpenseStatus.PAGA)
                .count();
        
        long contasVencidas = invoices.stream()
                .filter(i -> i.getStatus() == ExpenseStatus.PENDENTE && 
                           i.getDueDate() != null && 
                           i.getDueDate().isBefore(LocalDate.now()))
                .count();
        
        data.put("totalContas", totalContas);
        data.put("valorTotal", formatCurrency(valorTotal));
        data.put("contasAbertas", contasAbertas);
        data.put("contasPagas", contasPagas);
        data.put("contasVencidas", contasVencidas);
        
        // Percentuais
        if (totalContas > 0) {
            data.put("percentualAbertas", String.format("%.1f", (contasAbertas * 100.0) / totalContas));
            data.put("percentualPagas", String.format("%.1f", (contasPagas * 100.0) / totalContas));
            data.put("percentualVencidas", String.format("%.1f", (contasVencidas * 100.0) / totalContas));
        } else {
            data.put("percentualAbertas", "0.0");
            data.put("percentualPagas", "0.0");
            data.put("percentualVencidas", "0.0");
        }
        
        // Dados das contas para a tabela
        List<Map<String, Object>> contasData = invoices.stream()
                .map(this::mapInvoiceToReportData)
                .collect(Collectors.toList());
        
        data.put("contas", contasData);
        
        return data;
    }
    
    /**
     * Prepara dados resumidos
     */
    private Map<String, Object> prepareSummaryData(List<Invoice> invoices) {
        Map<String, Object> data = prepareReportData(invoices, null, null);
        data.put("reportTitle", "Relatório Resumido de Contas a Pagar");
        
        // Análise por fornecedor
        Map<String, Long> contasPorFornecedor = invoices.stream()
                .filter(i -> i.getSupplier() != null)
                .collect(Collectors.groupingBy(
                        i -> i.getSupplier().getName(),
                        Collectors.counting()
                ));
        
        data.put("contasPorFornecedor", contasPorFornecedor);
        
        return data;
    }
    
    /**
     * Mapeia uma invoice para dados do relatório
     */
    private Map<String, Object> mapInvoiceToReportData(Invoice invoice) {
        Map<String, Object> invoiceData = new HashMap<>();
        
        invoiceData.put("vencimento", invoice.getDueDate() != null ? 
                invoice.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "-");
        invoiceData.put("fornecedor", invoice.getSupplier() != null ? 
                invoice.getSupplier().getName() : "Não informado");
        invoiceData.put("descricao", invoice.getDescription() != null ? 
                invoice.getDescription() : "-");
        invoiceData.put("tipo", getTypeDisplayName(invoice.getType()));
        invoiceData.put("valor", formatCurrency(invoice.getAmount()));
        invoiceData.put("status", getStatusDisplayName(invoice.getStatus()));
        
        return invoiceData;
    }
    
    /**
     * Formata valor monetário
     */
    private String formatCurrency(BigDecimal value) {
        if (value == null) return "R$ 0,00";
        return String.format("R$ %,.2f", value).replace(",", "X").replace(".", ",").replace("X", ".");
    }
    
    /**
     * Obtém nome de exibição do status
     */
    private String getStatusDisplayName(ExpenseStatus status) {
        if (status == null) return "Não definido";
        
        return switch (status) {
            case PENDENTE -> "Aberta";
            case PAGA -> "Paga";
            case CANCELADA -> "Cancelada";
            case ERRO -> "Erro";
            case SOLICITADA -> "Solicitada";
            case PAGA_ANTERIORMENTE -> "Paga Anteriormente";
            case PENDENTE_ERRO -> "Pendente/Erro";
        };
    }
    
    /**
     * Obtém nome de exibição do tipo
     */
    private String getTypeDisplayName(ExpenseType type) {
        if (type == null) return "Não definido";
        
        return switch (type) {
            case FIXA -> "Fixa";
            case VARIAVEL -> "Variável";
        };
    }
}
