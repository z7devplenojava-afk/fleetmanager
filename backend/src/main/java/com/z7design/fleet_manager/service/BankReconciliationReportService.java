package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.BankFileDTO;
import com.z7design.fleet_manager.dto.BankReconciliationReportDTO;
import com.z7design.fleet_manager.dto.BankTransactionDTO;
import com.z7design.fleet_manager.model.BankTransaction;
import com.z7design.fleet_manager.repository.BankFileRepository;
import com.z7design.fleet_manager.repository.BankTransactionRepository;
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
        log.info("Gerando relatÃ³rio PDF de conciliaÃ§Ã£o bancÃ¡ria - Arquivo: {}, Filtro: {}", fileId, statusFilter);
        
        try {
            // Buscar transaÃ§Ãµes com filtro
            List<BankTransaction> transactions = getTransactionsFiltered(fileId, statusFilter);
            log.info("Dados obtidos: {} transaÃ§Ãµes", transactions.size());
            
            // Buscar arquivo
            final BankFileDTO file = fileId != null ? 
                BankFileDTO.fromEntity(bankFileRepository.findById(fileId).orElse(null)) : null;
            
            // Converter para DTOs de relatÃ³rio
            List<BankReconciliationReportDTO> reportDTOs = transactions.stream()
                    .map(t -> BankReconciliationReportDTO.fromBankTransaction(
                            BankTransactionDTO.fromEntity(t), file))
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos: {} transaÃ§Ãµes", reportDTOs.size());
            
            // Gerar PDF usando JasperReports
            byte[] result = jasperReportService.generateBankReconciliationReportPDF(reportDTOs, file, statusFilter);
            
            log.info("RelatÃ³rio PDF de conciliaÃ§Ã£o bancÃ¡ria gerado com sucesso. {} transaÃ§Ãµes processadas, {} bytes gerados", 
                    transactions.size(), result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de conciliaÃ§Ã£o bancÃ¡ria", e);
            e.printStackTrace();
            throw new IOException("Erro ao gerar relatÃ³rio PDF de conciliaÃ§Ã£o bancÃ¡ria: " + e.getMessage(), e);
        }
    }
    
    public byte[] generateBankReconciliationSummaryReportPDF(LocalDate startDate, LocalDate endDate, String bankName) throws IOException {
        log.info("Gerando relatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria - PerÃ­odo: {} a {}, Banco: {}", 
                startDate, endDate, bankName);
        
        try {
            // Buscar dados para resumo
            List<BankTransaction> transactions = getTransactionsForSummary(startDate, endDate, bankName);
            log.info("Dados obtidos para resumo: {} transaÃ§Ãµes", transactions.size());
            
            // Converter para DTOs de relatÃ³rio
            List<BankReconciliationReportDTO> reportDTOs = transactions.stream()
                    .map(t -> {
                        BankFileDTO file = BankFileDTO.fromEntity(bankFileRepository.findById(t.getBankFile().getId()).orElse(null));
                        return BankReconciliationReportDTO.fromBankTransaction(
                                BankTransactionDTO.fromEntity(t), file);
                    })
                    .collect(Collectors.toList());
            
            log.info("DTOs convertidos para resumo: {} transaÃ§Ãµes", reportDTOs.size());
            
            // Gerar PDF usando JasperReports
            byte[] result = jasperReportService.generateBankReconciliationSummaryReportPDF(reportDTOs, startDate, endDate, bankName);
            
            log.info("RelatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria gerado com sucesso. {} transaÃ§Ãµes processadas, {} bytes gerados", 
                    transactions.size(), result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao gerar relatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria", e);
            e.printStackTrace();
            throw new IOException("Erro ao gerar relatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria: " + e.getMessage(), e);
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
        // Implementar lÃ³gica de busca por perÃ­odo e banco
        // Por enquanto, retornar todas as transaÃ§Ãµes
        return bankTransactionRepository.findAll();
    }
}

