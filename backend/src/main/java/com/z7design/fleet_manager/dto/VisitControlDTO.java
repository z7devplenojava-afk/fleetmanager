package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.VisitControlStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitControlDTO {

    private UUID id;

    private String title; // TÃ­tulo da visita

    @NotBlank(message = "Local Ã© obrigatÃ³rio")
    private String location;

    @NotBlank(message = "ResponsÃ¡vel Ã© obrigatÃ³rio")
    private String assignedTo;

    private UUID supervisorId;

    private UUID workPostId;

    private UUID employeeId; // ID do funcionÃ¡rio identificado no local

    private String employeeCpf; // CPF informado manualmente (quando QR Code nÃ£o funciona)

    private String employeeRegistrationNumber; // MatrÃ­cula informada manualmente

    @NotNull(message = "Data da visita Ã© obrigatÃ³ria")
    private LocalDate visitDate;

    @NotNull(message = "HorÃ¡rio agendado Ã© obrigatÃ³rio")
    private LocalTime scheduledAt;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @NotNull(message = "Status Ã© obrigatÃ³rio")
    private VisitControlStatus status;

    private String observations;

    private String findings;

    private String reportUrl;

    private Boolean isSuccessful;

    private UUID createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Response fields
    private String supervisorName;
    private String workPostName;
    private String createdByName;
    private String employeeName; // Nome do funcionÃ¡rio identificado
}

















