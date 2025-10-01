package br.com.fleetmanager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;

import br.com.fleetmanager.model.enums.LeaveStatus;
import br.com.fleetmanager.model.enums.LeaveType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "leaves")
public class Leave {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Employee is required")
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference
    private Employee employee;
    
    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @NotNull(message = "Leave type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveType type;
    
    @NotBlank(message = "Reason is required")
    @Size(min = 10, max = 500, message = "Reason must be between 10 and 500 characters")
    @Column(nullable = false)
    private String reason;
    
    @Size(max = 1000, message = "Justification cannot exceed 1000 characters")
    @Column
    private String justification;
    
    @NotBlank(message = "Document URL is required")
    @Column(name = "document_url")
    private String documentUrl;
    
    @NotNull(message = "Leave status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveStatus status;
    
    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;
    
    @Column(name = "approval_date")
    private LocalDateTime approvalDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
} 