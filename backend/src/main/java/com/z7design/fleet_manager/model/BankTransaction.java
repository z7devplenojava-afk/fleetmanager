package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bank_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_file_id", nullable = false)
    private BankFile bankFile;
    
    @Column(nullable = false)
    private LocalDate transactionDate;
    
    @Column(nullable = false, length = 500)
    private String description;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal balance;
    
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private ReconciliationStatus status;
    
    @Column(length = 100)
    private String referenceNumber;
    
    @Column(length = 100)
    private String category;
    
    @Column(length = 500)
    private String notes;
    
    // Campos para conciliaÃ§Ã£o com sistema
    @Column(name = "system_transaction_id")
    private UUID systemTransactionId;
    
    @Column(name = "system_transaction_type", length = 50)
    private String systemTransactionType;
    
    @Column(name = "reconciliation_date")
    private LocalDate reconciliationDate;
    
    @Column(name = "reconciliation_user", length = 100)
    private String reconciliationUser;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum ReconciliationStatus {
        PENDING, MATCHED, UNMATCHED, MANUAL_REVIEW
    }
}

