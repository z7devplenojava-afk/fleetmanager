package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.MedicalCertificate;
import com.z7design.fleet_manager.model.enums.MedicalCertificateStatus;
import com.z7design.fleet_manager.model.enums.MedicalCertificateType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalCertificateResponseDTO {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeCpf;
    private String employeeRegistration;
    private String employeePosition;
    private String employeeWorkPost;
    private UUID companyId;
    private String companyName;

    private MedicalCertificateType type;
    private String typeDescription;

    private LocalDate startDate;
    private LocalDate endDate;
    private Integer daysCount;
    private BigDecimal absenceHours;
    private Boolean isPartialDay;

    private String cidCode;
    private String cidDescription;

    private String doctorName;
    private String doctorCrm;
    private String doctorSpecialty;

    private String documentUrl;
    private String documentName;
    private String documentType;

    private String notes;
    private MedicalCertificateStatus status;
    private String statusDescription;

    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MedicalCertificateResponseDTO fromEntity(MedicalCertificate cert) {
        if (cert == null) return null;

        String empName = null;
        String empCpf = null;
        String empReg = null;
        String empPos = null;
        String empWp = null;
        String compName = null;

        if (cert.getEmployee() != null) {
            empName = cert.getEmployee().getName();
            empCpf = cert.getEmployee().getDocument();
            empReg = cert.getEmployee().getRegistrationNumber();
            if (cert.getEmployee().getPosition() != null) {
                empPos = cert.getEmployee().getPosition().getName();
            }
            if (cert.getEmployee().getWorkPost() != null) {
                empWp = cert.getEmployee().getWorkPost().getName();
            }
            if (cert.getEmployee().getCompany() != null) {
                compName = cert.getEmployee().getCompany().getName();
            }
        }

        return MedicalCertificateResponseDTO.builder()
                .id(cert.getId())
                .employeeId(cert.getEmployee() != null ? cert.getEmployee().getId() : null)
                .employeeName(empName)
                .employeeCpf(empCpf)
                .employeeRegistration(empReg)
                .employeePosition(empPos)
                .employeeWorkPost(empWp)
                .companyId(cert.getCompanyId())
                .companyName(compName)
                .type(cert.getType())
                .typeDescription(cert.getType() != null ? cert.getType().getDescription() : null)
                .startDate(cert.getStartDate())
                .endDate(cert.getEndDate())
                .daysCount(cert.getDaysCount())
                .absenceHours(cert.getAbsenceHours())
                .isPartialDay(cert.getIsPartialDay())
                .cidCode(cert.getCidCode())
                .cidDescription(cert.getCidDescription())
                .doctorName(cert.getDoctorName())
                .doctorCrm(cert.getDoctorCrm())
                .doctorSpecialty(cert.getDoctorSpecialty())
                .documentUrl(cert.getDocumentUrl())
                .documentName(cert.getDocumentName())
                .documentType(cert.getDocumentType())
                .notes(cert.getNotes())
                .status(cert.getStatus())
                .statusDescription(cert.getStatus() != null ? cert.getStatus().getDescription() : null)
                .createdBy(cert.getCreatedBy())
                .createdAt(cert.getCreatedAt())
                .updatedAt(cert.getUpdatedAt())
                .build();
    }
}
