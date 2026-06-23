package com.z7design.fleet_manager.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.z7design.fleet_manager.model.SSTTraining;
import com.z7design.fleet_manager.model.TrainingParticipation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingDTO {
    private UUID id;
    private String title;
    private String description;
    private String category;
    private Integer durationHours;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate certificationDate;
    private LocalDate expirationDate;
    private String status;
    private String participationStatus;
    private Integer grade;
    private String instructor;
    private String location;
    private LocalDateTime createdAt;
    private Boolean isExpiringSoon;
    private Integer daysToExpiration;

    public static TrainingDTO fromParticipation(TrainingParticipation participation) {
        if (participation == null) return null;
        
        SSTTraining training = participation.getTraining();
        LocalDate today = LocalDate.now();
        Integer daysToExpiration = null;
        Boolean isExpiringSoon = false;
        
        LocalDate certDate = participation.getCompletionDate();
        LocalDate expDate = null;
        if (certDate != null && training.getValidityMonths() != null) {
            expDate = certDate.plusMonths(training.getValidityMonths());
            daysToExpiration = (int) java.time.temporal.ChronoUnit.DAYS.between(today, expDate);
            isExpiringSoon = daysToExpiration <= 30 && daysToExpiration >= 0;
        }
        
        return TrainingDTO.builder()
                .id(training.getId())
                .title(training.getName())
                .description(training.getDescription())
                .category(training.getTrainingType())
                .durationHours(training.getDurationHours())
                .startDate(participation.getParticipationDate())
                .endDate(participation.getCompletionDate())
                .certificationDate(certDate)
                .expirationDate(expDate)
                .status(training.getIsActive() ? "ATIVO" : "INATIVO")
                .participationStatus(participation.getStatus() != null ? participation.getStatus().name() : null)
                .grade(participation.getScore() != null ? participation.getScore().intValue() : null)
                .instructor(participation.getInstructorName())
                .location("Remoto / Presencial")
                .createdAt(training.getCreatedAt())
                .isExpiringSoon(isExpiringSoon)
                .daysToExpiration(daysToExpiration)
                .build();
    }
}
