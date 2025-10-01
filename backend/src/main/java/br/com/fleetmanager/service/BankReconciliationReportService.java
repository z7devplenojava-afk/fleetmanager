package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.BankFileDTO;
import br.com.fleetmanager.dto.BankReconciliationReportDTO;
import br.com.fleetmanager.dto.BankTransactionDTO;
import br.com.fleetmanager.model.BankTransaction;
import br.com.fleetmanager.repository.BankFileRepository;
import br.com.fleetmanager.repository.BankTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BankReconciliationReportService {
    
    private final BankTransactionRepository bankTransactionRepository;
    private final BankFileRepository bankFileRepository;
    private final JasperReportService jasperReportService;
    
    public byte[] generateBankReconciliationReportPDF(UUID fileId, String statusFilter) throws IOException {
        log.info("Gerando relatório PDF de conciliação bancária - Arquivo: {}, Filtro: {}", fileId, statusFilter);
        
        try {
            // Buscar transações com filtro
            List<BankTransaction> transactions = getTransactionsFiltered(fileId, statusFilter);
            log.info("Dados obtidos: {} transações", transactions.size());
            
            // Buscar arquivo
            final BankFileDTO file = fileId != null ? 
                BankFileDTO.fromEntity(bankFileRepository.findById(fileId).orElse(null)) : null;
            
            // Converter para DTOs de relatório
            List<BankReconciliationReportDTO> reportDTOs = transactions.stream()
                    .map(t -> BankReconciliationReportDTO.fromBankTransaction(
                            BankTransactionDTO.fromEntity(t), file))
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos: {} transações", reportDTOs.size());
            
            // Gerar PDF usando JasperReports
            byte[] result = jasperReportService.generateBankReconciliationReportPDF(reportDTOs, file, statusFilter);
            
            log.info("Relatório PDF de conciliação bancária gerado com sucesso. {} transações processadas, {} bytes gerados", 
                    transactions.size(), result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório PDF de conciliação bancária", e);
            e.printStackTrace();
            throw new IOException("Erro ao gerar relatório PDF de conciliação bancária: " + e.getMessage(), e);
        }
    }
    
    public byte[] generateBankReconciliationSummaryReportPDF(LocalDate startDate, LocalDate endDate, String bankName) throws IOException {
        log.info("Gerando relatório PDF de resumo de conciliação bancária - Período: {} a {}, Banco: {}", 
                startDate, endDate, bankName);
        
        try {
            // Buscar dados para resumo
            List<BankTransaction> transactions = getTransactionsForSummary(startDate, endDate, bankName);
            log.info("Dados obtidos para resumo: {} transações", transactions.size());
            
            // Converter para DTOs de relatório
            List<BankReconciliationReportDTO> reportDTOs = transactions.stream()
                    .map(t -> {
                        BankFileDTO file = BankFileDTO.fromEntity(bankFileRepository.findById(t.getBankFile().getId()).orElse(null));
                        return BankReconciliationReportDTO.fromBankTransaction(
                                BankTransactionDTO.fromEntity(t), file);
                    })
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos para resumo: {} transações", reportDTOs.size());
            
            // Gerar PDF usando JasperReports
            byte[] result = jasperReportService.generateBankReconciliationSummaryReportPDF(reportDTOs, startDate, endDate, bankName);
            
            log.info("Relatório PDF de resumo de conciliação bancária gerado com sucesso. {} transações processadas, {} bytes gerados", 
                    transactions.size(), result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatório PDF de resumo de conciliação bancária", e);
            e.printStackTrace();
            throw new IOException("Erro ao gerar relatório PDF de resumo de conciliação bancária: " + e.getMessage(), e);
        }
    }
    
    private List<BankTransaction> getTransactionsFiltered(UUID fileId, String statusFilter) {
        if (fileId != null) {
            if (statusFilter != null && !statusFilter.isEmpty() && !statusFilter.equals("ALL")) {
                BankTransaction.ReconciliationStatus status = BankTransaction.ReconciliationStatus.valueOf(statusFilter);
                return bankTransactionRepository.findByBankFileIdAndStatus(fileId, status);
            } else {
                return bankTransactionRepository.findByBankFileId(fileId);
            }
        } else {
            if (statusFilter != null && !statusFilter.isEmpty() && !statusFilter.equals("ALL")) {
                BankTransaction.ReconciliationStatus status = BankTransaction.ReconciliationStatus.valueOf(statusFilter);
                return bankTransactionRepository.findByStatus(status);
            } else {
                return bankTransactionRepository.findAll();
            }
        }
    }
    
    private List<BankTransaction> getTransactionsForSummary(LocalDate startDate, LocalDate endDate, String bankName) {
        // Implementar lógica de busca por período e banco
        // Por enquanto, retornar todas as transações
        return bankTransactionRepository.findAll();
    }
}
