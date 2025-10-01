package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.enums.VisitStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitDTO {
    
    private UUID id;
    
    @NotNull(message = "Data da visita é obrigatória")
    private LocalDate visitDate;
    
    @NotNull(message = "Supervisor é obrigatório")
    private UUID supervisorId;
    
    @NotNull(message = "Setor é obrigatório")
    private UUID unitId;
    
    private VisitStatus status;
    private String observations;
    private LocalDateTime arrivalTime;
    private LocalDateTime departureTime;
    
    // Checklist
    private Boolean securityCheck;
    private Boolean equipmentCheck;
    private Boolean staffCheck;
    private Boolean procedureCheck;
    
    // Campos para otimização de rota
    private Integer estimatedDurationMinutes;
    private Integer priorityLevel;
    private LocalDateTime preferredTimeStart;
    private LocalDateTime preferredTimeEnd;
    private Integer routeOrder;
    private Integer travelTimeToNextMinutes;
    private Double travelDistanceToNextKm;
    
    // Dados para exibição
    private String supervisorName;
    private String unitName;
    private String unitAddress;
    private Double unitLatitude;
    private Double unitLongitude;
    private String unitAddressCity;
    private String unitAddressState;
    
    // Relacionamento com escala
    private UUID visitScheduleId;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
