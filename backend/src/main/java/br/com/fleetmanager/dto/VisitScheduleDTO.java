package br.com.fleetmanager.dto;

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

import br.com.fleetmanager.model.enums.VisitScheduleStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitScheduleDTO {
    
    private UUID id;
    
    @NotNull(message = "Data da escala é obrigatória")
    private LocalDate scheduleDate;
    
    @NotNull(message = "Supervisor é obrigatório")
    private UUID supervisorId;
    
    @NotNull(message = "Cliente é obrigatório")
    private UUID clientId;
    
    @NotNull(message = "Horário de início é obrigatório")
    private LocalTime startTime;
    
    @NotNull(message = "Horário de fim é obrigatório")
    private LocalTime endTime;
    
    private VisitScheduleStatus status;
    
    private Integer totalEstimatedTimeMinutes;
    private Double totalTravelDistanceKm;
    private String observations;
    
    // Otimização de rota
    private String optimizedRoute; // JSON com a sequência otimizada
    private Double routeOptimizationScore;
    
    // Lista de visitas incluídas nesta escala
    private List<VisitDTO> visits;
    
    // Dados para exibição
    private String supervisorName;
    private String clientName;
    
    // Controle de execução
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Lista de IDs das unidades (para criação)
    private List<UUID> unitIds;
}
