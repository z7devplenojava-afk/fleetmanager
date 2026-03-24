package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonBackReference;

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
@Table(name = "epis")
public class EPI {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "employee_id")
    @JsonBackReference
    private Employee employee;
    
    @ManyToOne
    @JoinColumn(name = "position_id")
    private Position position;
    
    @NotBlank(message = "EPI name is required")
    @Size(min = 3, max = 100, message = "EPI name must be between 3 and 100 characters")
    @Column(nullable = false)
    private String name;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column
    private String description;
    
    @NotNull(message = "Issue date is required")
    @Column(name = "issue_date")
    private LocalDateTime issueDate;
    
    @Column(name = "expiration_date")
    private LocalDateTime expirationDate;
    
    @Column(name = "return_date")
    private LocalDateTime returnDate;
    
    @NotNull(message = "EPI status is required")
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EPIStatus status;
    
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
