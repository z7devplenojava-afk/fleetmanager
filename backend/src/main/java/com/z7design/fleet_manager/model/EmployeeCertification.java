package com.z7design.fleet_manager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.z7design.fleet_manager.model.enums.CertificationStatus;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "employee_certifications")
public class EmployeeCertification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "employee_id")
    @JsonBackReference
    private Employee employee;
    
    @NotNull(message = "Training is required")
    @ManyToOne
    @JoinColumn(name = "training_id")
    private Training training;
    
    @ManyToOne
    @JoinColumn(name = "work_post_id")
    private WorkPost workPost;
    
    @NotBlank(message = "Certification number is required")
    @Size(min = 1, max = 100, message = "Certification number must be between 1 and 100 characters")
    @Column(name = "certification_number")
    private String certificationNumber;
    
    @NotNull(message = "Issue date is required")
    @Column(name = "issue_date")
    private LocalDate issueDate;
    
    @Column(name = "expiration_date")
    private LocalDate expirationDate;
    
    @NotNull(message = "Certification status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CertificationStatus status;
    
    @NotBlank(message = "Document URL is required")
    @Column(name = "document_url")
    private String documentUrl;
    
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
