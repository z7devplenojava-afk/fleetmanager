package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payrolls")
public class Payroll {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Employee is required")
    @ManyToOne
    @JoinColumn(name = "employee_id")
    @JsonBackReference("employee-payrolls")
    private Employee employee;
    
    @NotNull(message = "Unit is required")
    @ManyToOne
    @JoinColumn(name = "unit_id")
    @JsonIgnoreProperties({"employees", "payrolls"})
    private Unit unit;
    
    @NotBlank(message = "Reference month is required")
    @Pattern(regexp = "^(19|20)\\d{2}-(0[1-9]|1[0-2])$", message = "Reference month must be in YYYY-MM format")
    @Column(name = "reference_month")
    private String referenceMonth;
    
    @NotNull(message = "Base salary is required")
    @PositiveOrZero(message = "Base salary must be a positive value or zero")
    @Column(name = "base_salary")
    private Double baseSalary;
    
    @NotNull(message = "Gross salary is required")
    @PositiveOrZero(message = "Gross salary must be a positive value or zero")
    @Column(name = "gross_salary")
    private Double grossSalary;
    
    @NotNull(message = "Net salary is required")
    @PositiveOrZero(message = "Net salary must be a positive value or zero")
    @Column(name = "net_salary")
    private Double netSalary;
    
    @NotNull(message = "Overtime hours is required")
    @PositiveOrZero(message = "Overtime hours must be a positive value or zero")
    @Column(name = "overtime_hours")
    private Double overtimeHours;
    
    @NotNull(message = "Overtime value is required")
    @PositiveOrZero(message = "Overtime value must be a positive value or zero")
    @Column(name = "overtime_value")
    private Double overtimeValue;
    
    @NotNull(message = "Benefits value is required")
    @PositiveOrZero(message = "Benefits value must be a positive value or zero")
    @Column(name = "benefits_value")
    private Double benefitsValue;
    
    @NotNull(message = "Deductions value is required")
    @PositiveOrZero(message = "Deductions value must be a positive value or zero")
    @Column(name = "deductions_value")
    private Double deductionsValue;
    
    @NotBlank(message = "Document URL is required")
    @Column(name = "document_url")
    private String documentUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @lombok.Builder.Default
    private com.z7design.fleet_manager.model.enums.PayrollStatus status = com.z7design.fleet_manager.model.enums.PayrollStatus.PENDING;

    @Column(name = "payment_date")
    private java.time.LocalDate paymentDate;

    @Column(name = "notes")
    private String notes;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 
