package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Vacation;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.model.enums.VacationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer daysTaken;
    private Integer remainingDays;
    private VacationStatus status;
    private VacationType vacationType;
    private UUID approvedById;
    private String approvedByName;
    private LocalDate approvalDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VacationDTO fromEntity(Vacation vacation) {
        return VacationDTO.builder()
                .id(vacation.getId())
                .employeeId(vacation.getEmployee().getId())
                .employeeName(vacation.getEmployee().getName())
                .startDate(vacation.getStartDate())
                .endDate(vacation.getEndDate())
                .daysTaken(vacation.getDaysTaken())
                .remainingDays(vacation.getRemainingDays())
                .status(vacation.getStatus())
                .vacationType(vacation.getVacationType())
                .approvedById(vacation.getApprovedBy() != null ? vacation.getApprovedBy().getId() : null)
                .approvedByName(vacation.getApprovedBy() != null ? vacation.getApprovedBy().getName() : null)
                .approvalDate(vacation.getApprovalDate())
                .createdAt(vacation.getCreatedAt())
                .updatedAt(vacation.getUpdatedAt())
                .build();
    }

    public Vacation toEntity() {
        return Vacation.builder()
                .id(this.id)
                .startDate(this.startDate)
                .endDate(this.endDate)
                .daysTaken(this.daysTaken)
                .remainingDays(this.remainingDays)
                .status(this.status)
                .vacationType(this.vacationType != null ? this.vacationType : VacationType.NORMAL)
                .approvalDate(this.approvalDate)
                .build();
    }
}

