package com.z7design.fleet_manager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkScheduleDTO {
    
    private UUID id;
    
    @NotNull(message = "ID do funcionÃ¡rio Ã© obrigatÃ³rio")
    private UUID employeeId;
    
    @NotNull(message = "ID do local de trabalho Ã© obrigatÃ³rio")
    private UUID locationId;
    
    @NotNull(message = "Data da escala Ã© obrigatÃ³ria")
    @FutureOrPresent(message = "Data da escala deve ser hoje ou no futuro")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate scheduleDate;
    
    @NotNull(message = "Turno Ã© obrigatÃ³rio")
    @Pattern(regexp = "^(DAY|NIGHT|MIXED)$", message = "Turno deve ser DAY, NIGHT ou MIXED")
    private String shift;
    
    @Pattern(regexp = "^(PENDING|CONFIRMED|CANCELLED|COMPLETED)$", message = "Status deve ser PENDING, CONFIRMED, CANCELLED ou COMPLETED")
    private String status;
    
    @Size(max = 1000, message = "ObservaÃ§Ãµes nÃ£o podem ter mais de 1000 caracteres")
    private String observations;
    
    // Campos de resposta (nÃ£o validados na entrada)
    private String employeeName;
    private String locationName;
    private String createdAt;
    private String updatedAt;
}

