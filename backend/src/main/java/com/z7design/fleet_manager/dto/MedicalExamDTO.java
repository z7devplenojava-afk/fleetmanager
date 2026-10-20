package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.MedicalExam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de leitura de Exames Médicos / ASO.
 * Expõe os campos de forma plana (sem objetos aninhados) para facilitar o consumo pelo frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalExamDTO {

    private UUID id;

    // Funcionário
    private UUID employeeId;
    private String employeeName;
    private String employeeRegistrationNumber;

    // Tipo de exame
    private UUID examTypeId;
    private String examType;
    private String examCategory;
    private Integer validityMonths;

    // Datas
    private LocalDate scheduledDate;
    private LocalDate examDate;
    private LocalDate performedDate;   // alias de examDate
    private LocalDate nextExamDate;
    private LocalDate expirationDate;  // alias de nextExamDate

    // Situação
    private String status;
    private String result;

    // Profissional / clínica
    private String doctorName;
    private String doctorCrm;
    private String clinicName;

    // Conteúdo do ASO
    private String restrictions;
    private String documentUrl;
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MedicalExamDTO fromEntity(MedicalExam exam) {
        if (exam == null) {
            return null;
        }
        MedicalExamDTOBuilder builder = MedicalExamDTO.builder()
                .id(exam.getId())
                .scheduledDate(exam.getScheduledDate())
                .examDate(exam.getExamDate())
                .performedDate(exam.getExamDate())
                .nextExamDate(exam.getNextExamDate())
                .expirationDate(exam.getNextExamDate())
                .status(exam.getStatus() != null ? exam.getStatus().name() : null)
                .result(exam.getResult() != null ? exam.getResult().name() : null)
                .doctorName(exam.getDoctorName())
                .doctorCrm(exam.getDoctorCrm())
                .clinicName(exam.getClinicName())
                .restrictions(exam.getRestrictions())
                .documentUrl(exam.getDocumentUrl())
                .notes(exam.getNotes())
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt());

        if (exam.getEmployee() != null) {
            builder.employeeId(exam.getEmployee().getId());
            builder.employeeName(exam.getEmployee().getName());
            builder.employeeRegistrationNumber(exam.getEmployee().getRegistrationNumber());
        }

        if (exam.getExamType() != null) {
            builder.examTypeId(exam.getExamType().getId());
            builder.examType(exam.getExamType().getName());
            builder.examCategory(exam.getExamType().getExamCategory() != null
                    ? exam.getExamType().getExamCategory().name()
                    : null);
            builder.validityMonths(exam.getExamType().getValidityMonths());
        }

        return builder.build();
    }
}
