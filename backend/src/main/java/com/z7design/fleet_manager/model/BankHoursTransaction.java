package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bank_hours_transaction")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankHoursTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_hours_id", nullable = false)
    private BankHours bankHours;

    @Column(name = "transaction_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @Column(name = "hours", nullable = false, precision = 10, scale = 2)
    private BigDecimal hours;

    @Column(name = "source_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private SourceType sourceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_payroll_closure_id")
    private PayrollClosure sourcePayrollClosure;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "metadata", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String metadata; // JSON string com metadados adicionais

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TransactionType {
        CREDIT, // AcrÃ©scimo (horas extras acumuladas)
        DEBIT   // Uso/desconto (horas compensadas ou pagas)
    }

    public enum SourceType {
        OVERTIME,      // Horas extras acumuladas
        COMPENSATION,  // CompensaÃ§Ã£o de horas
        ADJUSTMENT,    // Ajuste manual
        PAYMENT,       // Pagamento de horas
        EXPIRATION     // Vencimento de saldo
    }
}






