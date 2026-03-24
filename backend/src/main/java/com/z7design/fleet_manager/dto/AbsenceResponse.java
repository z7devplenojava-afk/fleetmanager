package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Absence;
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
public class AbsenceResponse {
    private UUID id;
    private SimpleEmployee employee;
    private LocalDate absenceDate;
    private Absence.AbsenceType absenceType;
    private String reason;
    private Integer medicalCertificateDays;
    private String documentUrl;
    private Absence.AbsenceStatus status;
    private Boolean isJustified;
    private SimpleUser approvedBy;
    private LocalDateTime approvalDate;
    private SimpleEmployee coverageEmployee;
    private String coverageNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleEmployee {
        private UUID id;
        private String name;
        private String registrationNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleUser {
        private UUID id;
        private String name;
    }

    public static AbsenceResponse fromEntity(Absence absence) {
        if (absence == null) {
            return null;
        }
        
        try {
            // Acessar employee de forma segura
            SimpleEmployee employee = null;
            try {
                if (absence.getEmployee() != null) {
                    employee = SimpleEmployee.builder()
                            .id(absence.getEmployee().getId())
                            .name(absence.getEmployee().getName())
                            .registrationNumber(absence.getEmployee().getRegistrationNumber())
                            .build();
                }
            } catch (Exception e) {
                // Log warning mas continua
                System.err.println("âš ï¸ Erro ao acessar employee da falta " + absence.getId() + ": " + e.getMessage());
            }
            
            // Acessar approvedBy de forma segura
            SimpleUser approvedBy = null;
            try {
                if (absence.getApprovedBy() != null) {
                    approvedBy = SimpleUser.builder()
                            .id(absence.getApprovedBy().getId())
                            .name(absence.getApprovedBy().getName())
                            .build();
                }
            } catch (Exception e) {
                // Log warning mas continua
                System.err.println("âš ï¸ Erro ao acessar approvedBy da falta " + absence.getId() + ": " + e.getMessage());
            }
            
            // Acessar coverageEmployee de forma segura
            SimpleEmployee coverageEmployee = null;
            try {
                if (absence.getCoverageEmployee() != null) {
                    coverageEmployee = SimpleEmployee.builder()
                            .id(absence.getCoverageEmployee().getId())
                            .name(absence.getCoverageEmployee().getName())
                            .registrationNumber(absence.getCoverageEmployee().getRegistrationNumber())
                            .build();
                }
            } catch (Exception e) {
                // Log warning mas continua
                System.err.println("âš ï¸ Erro ao acessar coverageEmployee da falta " + absence.getId() + ": " + e.getMessage());
            }
            
            return AbsenceResponse.builder()
                    .id(absence.getId())
                    .employee(employee)
                    .absenceDate(absence.getAbsenceDate())
                    .absenceType(absence.getAbsenceType())
                    .reason(absence.getReason())
                    .medicalCertificateDays(absence.getMedicalCertificateDays())
                    .documentUrl(absence.getDocumentUrl())
                    .status(absence.getStatus())
                    .isJustified(absence.getIsJustified())
                    .approvedBy(approvedBy)
                    .approvalDate(absence.getApprovalDate())
                    .coverageEmployee(coverageEmployee)
                    .coverageNotes(absence.getCoverageNotes())
                    .createdAt(absence.getCreatedAt())
                    .updatedAt(absence.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            System.err.println("âŒ Erro ao converter Absence para AbsenceResponse - ID: " + absence.getId());
            e.printStackTrace();
            throw new RuntimeException("Erro ao converter Absence para AbsenceResponse: " + e.getMessage(), e);
        }
    }
}


























