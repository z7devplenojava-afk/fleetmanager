package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO de criação/atualização de Exames Médicos / ASO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalExamRequestDTO {

    private UUID employeeId;

    private UUID examTypeId;

    /** Nome do tipo de exame (compatibilidade com o formulário livre do frontend). */
    private String examType;

    /** Categoria do exame (ADMISSIONAL, PERIODICO, ...). */
    private String examCategory;

    private LocalDate scheduledDate;

    private LocalDate examDate;

    private LocalDate nextExamDate;

    private String status;

    private String result;

    private String doctorName;

    private String doctorCrm;

    private String clinicName;

    private String restrictions;

    private String documentUrl;

    private String notes;
}
