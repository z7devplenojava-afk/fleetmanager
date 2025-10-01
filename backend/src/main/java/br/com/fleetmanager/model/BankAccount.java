package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bank_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 100)
    private String bankName;
    
    @Column(nullable = false, length = 20)
    private String accountNumber;
    
    @Column(length = 50)
    private String accountType;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal balance;
    
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private BankAccountStatus status;
    
    @Column(length = 500)
    private String description;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum BankAccountStatus {
        ACTIVE, INACTIVE, BLOCKED
    }
}
