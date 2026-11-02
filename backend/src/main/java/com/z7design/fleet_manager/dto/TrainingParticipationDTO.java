package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.TrainingParticipation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de leitura de ParticipaÃ§Ãµes em Treinamentos SST.
 * ExpÃµe os campos de forma plana (sem objetos aninhados) para facilitar o consumo pelo frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingParticipationDTO {

    private UUID id;

    // FuncionÃ¡rio
    private UUID employeeId;
    private String employeeName;

    // Treinamento
    private UUID trainingId;
    private String trainingName;

    // Datas
    private LocalDate scheduledDate;
    private LocalDate participationDate;
    private LocalDate completionDate;
    private LocalDate expirationDate;

    // SituaÃ§Ã£o
    private String status;
    private BigDecimal score;
    private String certificateNumber;
    private String certificateUrl;
    private String instructorName;
    private String notes;
    private Integer hours;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TrainingParticipationDTO fromEntity(TrainingParticipation participation) {
        if (participation == null) {
            return null;
        }

        TrainingParticipationDTOBuilder builder = TrainingParticipationDTO.builder()
                .id(participation.getId())
                .participationDate(participation.getParticipationDate())
                .scheduledDate(participation.getParticipationDate())
                .completionDate(participation.getCompletionDate())
                .status(participation.getStatus() != null ? participation.getStatus().name() : null)
                .score(participation.getScore())
                .certificateNumber(participation.getCertificateNumber())
                .certificateUrl(participation.getCertificateUrl())
                .instructorName(participation.getInstructorName())
                .notes(participation.getNotes())
                .createdAt(participation.getCreatedAt())
                .updatedAt(participation.getUpdatedAt());

        if (participation.getEmployee() != null) {
            builder.employeeId(participation.getEmployee().getId());
            builder.employeeName(participation.getEmployee().getName());
        }

        if (participation.getTraining() != null) {
            builder.trainingId(participation.getTraining().getId());
            builder.trainingName(participation.getTraining().getName());
            builder.hours(participation.getTraining().getDurationHours());

            Integer validityMonths = participation.getTraining().getValidityMonths();
            if (validityMonths != null && validityMonths > 0) {
                LocalDate baseDate = participation.getCompletionDate() != null
                        ? participation.getCompletionDate()
                        : participation.getParticipationDate();
                if (baseDate != null) {
                    builder.expirationDate(baseDate.plusMonths(validityMonths));
                }
            }
        }

        return builder.build();
    }
}
