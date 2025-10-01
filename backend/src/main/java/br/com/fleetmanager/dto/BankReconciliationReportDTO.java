package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankReconciliationReportDTO {
    
    private UUID id;
    private String fileName;
    private String bankName;
    private String accountNumber;
    private String period;
    private LocalDate transactionDate;
    private String description;
    private BigDecimal amount;
    private BigDecimal balance;
    private String status;
    private String referenceNumber;
    private String category;
    private String notes;
    private String systemTransactionType;
    private LocalDate reconciliationDate;
    private String reconciliationUser;
    
    public static BankReconciliationReportDTO fromBankTransaction(BankTransactionDTO transaction, BankFileDTO file) {
        if (transaction == null) return null;
        
        return BankReconciliationReportDTO.builder()
                .id(transaction.getId())
                .fileName(file != null ? file.getFileName() : "")
                .bankName(file != null ? file.getBankName() : "")
                .accountNumber(file != null ? file.getAccountNumber() : "")
                .period(file != null ? file.getPeriod() : "")
                .transactionDate(transaction.getTransactionDate())
                .description(transaction.getDescription())
                .amount(transaction.getAmount())
                .balance(transaction.getBalance())
                .status(transaction.getStatus() != null ? transaction.getStatus().name() : "")
                .referenceNumber(transaction.getReferenceNumber())
                .category(transaction.getCategory())
                .notes(transaction.getNotes())
                .systemTransactionType(transaction.getSystemTransactionType())
                .reconciliationDate(transaction.getReconciliationDate())
                .reconciliationUser(transaction.getReconciliationUser())
                .build();
    }
}
