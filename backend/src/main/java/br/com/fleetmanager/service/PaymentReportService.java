package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.AccountsReceivableReportDTO;
import br.com.fleetmanager.dto.ScheduledPaymentReportDTO;
import br.com.fleetmanager.model.AccountsReceivable;
import br.com.fleetmanager.model.ScheduledPayment;
import br.com.fleetmanager.model.enums.ReceivableStatus;
import br.com.fleetmanager.model.enums.ScheduledPaymentStatus;
import br.com.fleetmanager.repository.AccountsReceivableRepository;
import br.com.fleetmanager.repository.ScheduledPaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentReportService {
    
    private final AccountsReceivableRepository accountsReceivableRepository;
    private final ScheduledPaymentRepository scheduledPaymentRepository;
    private final JasperReportService jasperReportService;
    
    /**
     * Gerar relatório de contas a receber
     */
    public byte[] generateAccountsReceivableReportPDF(LocalDate startDate, 
                                                     LocalDate endDate, 
                                                     String clientFilter, 
                                                     String statusFilter,
                                                     String categoryFilter,
                                                     String paymentMethodFilter,
                                                     BigDecimal amountMin,
                                                     BigDecimal amountMax,
                                                     List<String> selectedIds) throws IOException {
        log.info("Gerando relatório PDF de contas a receber - Período: {} a {}, Cliente: {}, Status: {}, Categoria: {}, Método: {}, Valor: {} a {}, IDs: {}", 
                startDate, endDate, clientFilter, statusFilter, categoryFilter, paymentMethodFilter, amountMin, amountMax, selectedIds);
        
        try {
            // Buscar dados com filtros
            List<AccountsReceivable> accounts = getAccountsReceivableFiltered(
                    startDate, endDate, clientFilter, statusFilter, categoryFilter, 
                    paymentMethodFilter, amountMin, amountMax, selectedIds);
            
            // Converter para DTOs de relatório
            List<AccountsReceivableReportDTO> reportDTOs = accounts.stream()
                    .map(AccountsReceivableReportDTO::fromEntity)
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos: {} contas a receber", reportDTOs.size());
            
            // Gerar PDF usando JasperReports
            byte[] result = jasperReportService.generateAccountsReceivableReportPDF(
                    reportDTOs, startDate, endDate, clientFilter, statusFilter, 
                    categoryFilter, paymentMethodFilter, amountMin, amountMax);
            
            log.info("Relatório PDF de contas a receber gerado com sucesso. {} contas processadas, {} bytes gerados", 
                    accounts.size(), result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório PDF de contas a receber", e);
            throw new IOException("Erro ao gerar relatório de contas a receber: " + e.getMessage(), e);
        }
    }
    
    /**
     * Gerar relatório de pagamentos agendados
     */
    public byte[] generateScheduledPaymentReportPDF(LocalDate startDate, 
                                                   LocalDate endDate, 
                                                   String clientFilter, 
                                                   String statusFilter,
                                                   String paymentMethodFilter,
                                                   BigDecimal amountMin,
                                                   BigDecimal amountMax,
                                                   List<String> selectedIds) throws IOException {
        log.info("Gerando relatório PDF de pagamentos agendados - Período: {} a {}, Cliente: {}, Status: {}, Método: {}, Valor: {} a {}, IDs: {}", 
                startDate, endDate, clientFilter, statusFilter, paymentMethodFilter, amountMin, amountMax, selectedIds);
        
        try {
            // Buscar dados com filtros
            List<ScheduledPayment> payments = getScheduledPaymentsFiltered(
                    startDate, endDate, clientFilter, statusFilter, 
                    paymentMethodFilter, amountMin, amountMax, selectedIds);
            
            // Converter para DTOs de relatório
            List<ScheduledPaymentReportDTO> reportDTOs = payments.stream()
                    .map(ScheduledPaymentReportDTO::fromEntity)
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos: {} pagamentos agendados", reportDTOs.size());
            
            // Gerar PDF usando JasperReports
            byte[] result = jasperReportService.generateScheduledPaymentReportPDF(
                    reportDTOs, startDate, endDate, clientFilter, statusFilter, 
                    paymentMethodFilter, amountMin, amountMax);
            
            log.info("Relatório PDF de pagamentos agendados gerado com sucesso. {} pagamentos processados, {} bytes gerados", 
                    payments.size(), result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório PDF de pagamentos agendados", e);
            throw new IOException("Erro ao gerar relatório de pagamentos agendados: " + e.getMessage(), e);
        }
    }
    
    /**
     * Buscar contas a receber com filtros
     */
    private List<AccountsReceivable> getAccountsReceivableFiltered(LocalDate startDate, 
                                                                  LocalDate endDate, 
                                                                  String clientFilter, 
                                                                  String statusFilter,
                                                                  String categoryFilter,
                                                                  String paymentMethodFilter,
                                                                  BigDecimal amountMin,
                                                                  BigDecimal amountMax,
                                                                  List<String> selectedIds) {
        List<AccountsReceivable> accounts = accountsReceivableRepository.findAll();
        log.info("Encontradas {} contas a receber no banco de dados", accounts.size());
        
        // Aplicar filtros
        return accounts.stream()
                .filter(account -> startDate == null || !account.getIssueDate().isBefore(startDate))
                .filter(account -> endDate == null || !account.getIssueDate().isAfter(endDate))
                .filter(account -> clientFilter == null || clientFilter.isEmpty() || 
                        account.getClient().getName().toLowerCase().contains(clientFilter.toLowerCase()))
                .filter(account -> statusFilter == null || statusFilter.isEmpty() || statusFilter.equals("ALL") || 
                        account.getStatus().toString().equals(statusFilter))
                .filter(account -> categoryFilter == null || categoryFilter.isEmpty() || categoryFilter.equals("ALL") || 
                        account.getCategory().toString().equals(categoryFilter))
                .filter(account -> paymentMethodFilter == null || paymentMethodFilter.isEmpty() || paymentMethodFilter.equals("ALL") || 
                        account.getPaymentMethod().toString().equals(paymentMethodFilter))
                .filter(account -> amountMin == null || account.getAmount().compareTo(amountMin) >= 0)
                .filter(account -> amountMax == null || account.getAmount().compareTo(amountMax) <= 0)
                .filter(account -> selectedIds == null || selectedIds.isEmpty() || 
                        selectedIds.contains(account.getId().toString()))
                .collect(Collectors.toList());
    }
    
    /**
     * Buscar pagamentos agendados com filtros
     */
    private List<ScheduledPayment> getScheduledPaymentsFiltered(LocalDate startDate, 
                                                               LocalDate endDate, 
                                                               String clientFilter, 
                                                               String statusFilter,
                                                               String paymentMethodFilter,
                                                               BigDecimal amountMin,
                                                               BigDecimal amountMax,
                                                               List<String> selectedIds) {
        List<ScheduledPayment> payments = scheduledPaymentRepository.findAll();
        log.info("Encontrados {} pagamentos agendados no banco de dados", payments.size());
        
        // Aplicar filtros
        return payments.stream()
                .filter(payment -> startDate == null || !payment.getScheduledDate().isBefore(startDate))
                .filter(payment -> endDate == null || !payment.getScheduledDate().isAfter(endDate))
                .filter(payment -> clientFilter == null || clientFilter.isEmpty() || 
                        payment.getClient().getName().toLowerCase().contains(clientFilter.toLowerCase()))
                .filter(payment -> statusFilter == null || statusFilter.isEmpty() || statusFilter.equals("ALL") || 
                        payment.getStatus().toString().equals(statusFilter))
                .filter(payment -> paymentMethodFilter == null || paymentMethodFilter.isEmpty() || paymentMethodFilter.equals("ALL") || 
                        payment.getPaymentMethod().toString().equals(paymentMethodFilter))
                .filter(payment -> amountMin == null || payment.getAmount().compareTo(amountMin) >= 0)
                .filter(payment -> amountMax == null || payment.getAmount().compareTo(amountMax) <= 0)
                .filter(payment -> selectedIds == null || selectedIds.isEmpty() || 
                        selectedIds.contains(payment.getId().toString()))
                .collect(Collectors.toList());
    }
    
    /**
     * Excluir múltiplas contas a receber
     */
    @Transactional
    public void deleteMultipleAccountsReceivable(List<String> ids) {
        log.info("Excluindo {} contas a receber", ids.size());
        
        for (String id : ids) {
            try {
                accountsReceivableRepository.deleteById(java.util.UUID.fromString(id));
                log.info("Conta a receber excluída: {}", id);
            } catch (Exception e) {
                log.error("Erro ao excluir conta a receber {}: {}", id, e.getMessage());
            }
        }
        
        log.info("Exclusão múltipla de contas a receber concluída");
    }
    
    /**
     * Excluir múltiplos pagamentos agendados
     */
    @Transactional
    public void deleteMultipleScheduledPayments(List<String> ids) {
        log.info("Excluindo {} pagamentos agendados", ids.size());
        
        for (String id : ids) {
            try {
                scheduledPaymentRepository.deleteById(java.util.UUID.fromString(id));
                log.info("Pagamento agendado excluído: {}", id);
            } catch (Exception e) {
                log.error("Erro ao excluir pagamento agendado {}: {}", id, e.getMessage());
            }
        }
        
        log.info("Exclusão múltipla de pagamentos agendados concluída");
    }
}
