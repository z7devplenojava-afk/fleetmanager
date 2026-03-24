package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.VisitScheduleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitScheduleDTO {
    
    private UUID id;
    
    @NotNull(message = "Data da escala Ã© obrigatÃ³ria")
    private LocalDate scheduleDate;
    
    @NotNull(message = "Supervisor Ã© obrigatÃ³rio")
    private UUID supervisorId;
    
    @NotNull(message = "Cliente Ã© obrigatÃ³rio")
    private UUID clientId;
    
    @NotNull(message = "HorÃ¡rio de inÃ­cio Ã© obrigatÃ³rio")
    private LocalTime startTime;
    
    @NotNull(message = "HorÃ¡rio de fim Ã© obrigatÃ³rio")
    private LocalTime endTime;
    
    private VisitScheduleStatus status;
    
    private Integer totalEstimatedTimeMinutes;
    private Double totalTravelDistanceKm;
    private String observations;
    
    // OtimizaÃ§Ã£o de rota
    private String optimizedRoute; // JSON com a sequÃªncia otimizada
    private Double routeOptimizationScore;
    
    // Lista de visitas incluÃ­das nesta escala
    private List<VisitDTO> visits;
    
    // Dados para exibiÃ§Ã£o
    private String supervisorName;
    private String clientName;
    
    // Controle de execuÃ§Ã£o
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Lista de IDs das unidades (para criaÃ§Ã£o)
    private List<UUID> unitIds;
}

