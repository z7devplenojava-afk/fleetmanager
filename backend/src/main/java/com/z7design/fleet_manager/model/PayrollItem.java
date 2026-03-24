package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payroll_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false) // NOT NULL conforme schema original
    private Payroll payroll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_closure_id")
    private PayrollClosure payrollClosure;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ItemType type;

    @Column(name = "hours", precision = 10, scale = 2)
    private BigDecimal hours;

    @Column(name = "unit_value", precision = 10, scale = 2)
    private BigDecimal unitValue;

    @Column(name = "category", length = 50)
    @Enumerated(EnumType.STRING)
    private ItemCategory category;

    @Column(name = "reissued_by_id")
    private UUID reissuedById;

    @Column(name = "reissued_at")
    private LocalDateTime reissuedAt;

    @Column(name = "reference_data", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String referenceData; // JSON string com metadados

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ItemType {
        REGULAR_HOURS,        // Horas normais
        OVERTIME_50,          // Horas extras 50%
        OVERTIME_100,         // Horas extras 100%
        NIGHT_SHIFT,          // Adicional noturno
        SUNDAY_WORK,          // Trabalho em domingo
        HOLIDAY_WORK,         // Trabalho em feriado
        BANK_HOURS_CREDIT,    // CrÃ©dito de banco de horas
        BANK_HOURS_DEBIT,     // DÃ©bito de banco de horas
        ABSENCE,              // Falta
        DELAY,                // Atraso
        BENEFIT,              // BenefÃ­cio
        DEDUCTION,            // Desconto
        OTHER                 // Outros
    }

    public enum ItemCategory {
        EARNINGS,    // Proventos
        DEDUCTIONS,  // Descontos
        BENEFITS     // BenefÃ­cios
    }
}






