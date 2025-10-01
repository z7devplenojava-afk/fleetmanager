package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders_of_service")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderOfService {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;
    
    private java.util.UUID employeeId;
    
    @Column(name = "employee_name", nullable = false)
    private String employeeName;
    
    @Column(name = "employee_cpf", nullable = false)
    private String employeeCpf;
    
    @Column(name = "role", nullable = false)
    private String role;
    
    @Column(name = "company", nullable = false)
    private String company;
    
    @Column(name = "client", nullable = false)
    private String client;
    
    @Column(name = "workplace", nullable = false)
    private String workplace;
    
    @Column(name = "salary", nullable = false, precision = 10, scale = 2)
    private BigDecimal salary;
    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "document_url")
    private String documentUrl;
    
    @Column(name = "signed", nullable = false)
    @Builder.Default
    private Boolean signed = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
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