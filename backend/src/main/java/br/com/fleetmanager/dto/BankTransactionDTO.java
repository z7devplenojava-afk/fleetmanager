package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.BankTransaction;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransactionDTO {
    
    private UUID id;
    private UUID bankFileId;
    private LocalDate transactionDate;
    private String description;
    private BigDecimal amount;
    private BigDecimal balance;
    private BankTransaction.ReconciliationStatus status;
    private String referenceNumber;
    private String category;
    private String notes;
    private UUID systemTransactionId;
    private String systemTransactionType;
    private LocalDate reconciliationDate;
    private String reconciliationUser;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static BankTransactionDTO fromEntity(BankTransaction entity) {
        if (entity == null) return null;
        
        return BankTransactionDTO.builder()
                .id(entity.getId())
                .bankFileId(entity.getBankFile() != null ? entity.getBankFile().getId() : null)
                .transactionDate(entity.getTransactionDate())
                .description(entity.getDescription())
                .amount(entity.getAmount())
                .balance(entity.getBalance())
                .status(entity.getStatus())
                .referenceNumber(entity.getReferenceNumber())
                .category(entity.getCategory())
                .notes(entity.getNotes())
                .systemTransactionId(entity.getSystemTransactionId())
                .systemTransactionType(entity.getSystemTransactionType())
                .reconciliationDate(entity.getReconciliationDate())
                .reconciliationUser(entity.getReconciliationUser())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
