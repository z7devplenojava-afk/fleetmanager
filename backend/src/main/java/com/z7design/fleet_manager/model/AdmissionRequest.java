package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.AdmissionRequestType;
import com.z7design.fleet_manager.model.enums.AdmissionRequestStatus;
import com.z7design.fleet_manager.model.enums.AdmissionRequestPriority;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "admission_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "request_number", unique = true, nullable = false)
    private String requestNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private AdmissionRequestType type;
    
    @Column(name = "employee_name", nullable = false)
    private String employeeName;
    
    @Column(name = "employee_cpf")
    private String employeeCpf;
    
    @Column(name = "employee_rg")
    private String employeeRg;
    
    @Column(name = "employee_email")
    private String employeeEmail;
    
    @Column(name = "employee_phone")
    private String employeePhone;
    
    @Column(name = "position")
    private String position;
    
    @Column(name = "department")
    private String department;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
    
    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AdmissionRequestStatus status = AdmissionRequestStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    @Builder.Default
    private AdmissionRequestPriority priority = AdmissionRequestPriority.MEDIUM;
    
    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;
    
    @Column(name = "approval_date")
    private LocalDate approvalDate;
    
    @Column(name = "completion_date")
    private LocalDate completionDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;
    
    @Column(name = "approved_by_name")
    private String approvedByName;
    
    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    private User rejectedBy;
    
    @Column(name = "rejected_by_name")
    private String rejectedByName;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private User requester;
    
    @Column(name = "requester_name")
    private String requesterName;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (requestNumber == null || requestNumber.isEmpty()) {
            String prefix = type == AdmissionRequestType.ADMISSION ? "ADM" : "DEM";
            requestNumber = String.format("%s-%d-%04d", 
                prefix, 
                LocalDate.now().getYear(),
                (int)(Math.random() * 10000));
        }
        if (requestDate == null) {
            requestDate = LocalDate.now();
        }
    }
}









