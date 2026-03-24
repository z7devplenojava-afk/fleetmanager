package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.VisitStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitDTO {
    
    private UUID id;
    private UUID supervisorId;
    private String supervisorName;
    private UUID workPostId;
    private String workPostName;
    private UUID clientId;
    private String clientName;
    private UUID unitId;
    private String unitName;
    private String unitAddress;
    private String unitAddressCity;
    private String unitAddressState;
    private Double unitLatitude;
    private Double unitLongitude;
    private UUID visitScheduleId;
    private LocalDate visitDate;
    private LocalTime visitTime;
    private String description;
    private String observations;
    private VisitStatus status;
    private List<UUID> presentEmployees;
    private List<String> presentEmployeeNames;
    private List<String> attachedFiles;
    private List<String> photos;
    
    // Campos de agendamento/roteiro
    private LocalTime arrivalTime;
    private LocalTime departureTime;
    private Boolean securityCheck;
    private Boolean equipmentCheck;
    private Boolean staffCheck;
    private Boolean procedureCheck;
    private Integer estimatedDurationMinutes;
    private Integer priorityLevel;
    private LocalTime preferredTimeStart;
    private LocalTime preferredTimeEnd;
    private Integer routeOrder;
    private Integer travelTimeToNextMinutes;
    private Double travelDistanceToNextKm;
    
    // GeolocalizaÃ§Ã£o
    private Double latitude;
    private Double longitude;
    private String locationAddress;
    
    // QR Code
    private String qrCodeScanned;
    private Boolean qrCodeVerified;
    
    // Cancelamento
    private String cancellationReason;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByName;
    private String updatedByName;
}
