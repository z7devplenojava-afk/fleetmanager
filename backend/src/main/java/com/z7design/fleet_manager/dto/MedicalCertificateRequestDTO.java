package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.MedicalCertificateStatus;
import com.z7design.fleet_manager.model.enums.MedicalCertificateType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalCertificateRequestDTO {

    @NotNull(message = "ID do funcionário é obrigatório")
    private UUID employeeId;

    private UUID companyId;

    @NotNull(message = "Tipo de atestado é obrigatório")
    private MedicalCertificateType type;

    @NotNull(message = "Data de início é obrigatória")
    private LocalDate startDate;

    @NotNull(message = "Data de término é obrigatória")
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
}
