package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.z7design.fleet_manager.model.AdmissionRequest;
import com.z7design.fleet_manager.model.enums.AdmissionRequestType;
import com.z7design.fleet_manager.model.enums.AdmissionRequestStatus;
import com.z7design.fleet_manager.model.enums.AdmissionRequestPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdmissionRequestDTO {
    
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private UUID id;
    
    private String requestNumber;
    
    private AdmissionRequestType type;
    
    private String employeeName;
    
    private String employeeCpf;
    
    private String employeeRg;
    
    private String employeeEmail;
    
    private String employeePhone;
    
    private String position;
    
    private String department;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private UUID unitId;
    
    private String unitName;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    
    private String reason;
    
    private String justification;
    
    private AdmissionRequestStatus status;
    
    private AdmissionRequestPriority priority;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate requestDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate approvalDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate completionDate;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private UUID approvedById;
    
    private String approvedByName;
    
    private String approvalNotes;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private UUID rejectedById;
    
    private String rejectionReason;
    
    private String requesterName;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private UUID requesterId;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private UUID approverId;
    
    private String notes;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Campos calculados
    private Boolean urgent;
    private Boolean canBeApproved;
    private Boolean overdue;
    private Integer daysUntilRequired;
    private Integer totalDocuments;
    
    public static AdmissionRequestDTO fromEntity(AdmissionRequest entity) {
        if (entity == null) {
            return null;
        }
        
        AdmissionRequestDTO dto = AdmissionRequestDTO.builder()
            .id(entity.getId())
            .requestNumber(entity.getRequestNumber())
            .type(entity.getType())
            .employeeName(entity.getEmployeeName())
            .employeeCpf(entity.getEmployeeCpf())
            .employeeRg(entity.getEmployeeRg())
            .employeeEmail(entity.getEmployeeEmail())
            .employeePhone(entity.getEmployeePhone())
            .position(entity.getPosition())
            .department(entity.getDepartment())
            .unitId(entity.getUnit() != null ? entity.getUnit().getId() : null)
            .unitName(entity.getUnit() != null ? entity.getUnit().getName() : null)
            .startDate(entity.getStartDate())
            .endDate(entity.getEndDate())
            .reason(entity.getReason())
            .justification(entity.getJustification())
            .status(entity.getStatus())
            .priority(entity.getPriority())
            .requestDate(entity.getRequestDate())
            .approvalDate(entity.getApprovalDate())
            .completionDate(entity.getCompletionDate())
            .approvedById(entity.getApprovedBy() != null ? entity.getApprovedBy().getId() : null)
            .approvedByName(entity.getApprovedByName() != null ? entity.getApprovedByName() : 
                           (entity.getApprovedBy() != null ? entity.getApprovedBy().getName() : null))
            .approvalNotes(entity.getApprovalNotes())
            .rejectedById(entity.getRejectedBy() != null ? entity.getRejectedBy().getId() : null)
            .rejectionReason(entity.getRejectionReason())
            .requesterName(entity.getRequesterName())
            .requesterId(entity.getRequester() != null ? entity.getRequester().getId() : null)
            .approverId(entity.getApprover() != null ? entity.getApprover().getId() : null)
            .notes(entity.getNotes())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
        
        // Calcular campos derivados
        dto.setUrgent(entity.getPriority() == AdmissionRequestPriority.URGENT || 
                     entity.getPriority() == AdmissionRequestPriority.HIGH);
        dto.setCanBeApproved(entity.getStatus() == AdmissionRequestStatus.PENDING);
        dto.setOverdue(entity.getRequestDate() != null && 
                      entity.getRequestDate().isBefore(LocalDate.now()) && 
                      entity.getStatus() == AdmissionRequestStatus.PENDING);
        
        if (entity.getStartDate() != null && entity.getRequestDate() != null) {
            dto.setDaysUntilRequired((int) java.time.temporal.ChronoUnit.DAYS.between(
                entity.getRequestDate(), entity.getStartDate()));
        } else {
            dto.setDaysUntilRequired(0);
        }
        
        dto.setTotalDocuments(0); // TODO: Implementar contagem de documentos quando houver
        
        return dto;
    }
}









