package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.VisitStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVisitDTO {
    
    @NotNull(message = "ID do supervisor Ã© obrigatÃ³rio")
    private UUID supervisorId;
    
    @NotNull(message = "ID do posto de trabalho Ã© obrigatÃ³rio")
    private UUID workPostId;
    
    @NotNull(message = "ID do cliente Ã© obrigatÃ³rio")
    private UUID clientId;
    
    @NotNull(message = "Data da visita Ã© obrigatÃ³ria")
    private LocalDate visitDate;
    
    @NotNull(message = "HorÃ¡rio da visita Ã© obrigatÃ³rio")
    private LocalTime visitTime;
    
    private String description;
    
    private String observations;
    
    @Builder.Default
    private VisitStatus status = VisitStatus.SCHEDULED;
    
    private List<UUID> presentEmployees;
    
    private List<String> attachedFiles;
    
    private List<String> photos;
    
    // GeolocalizaÃ§Ã£o
    private Double latitude;
    private Double longitude;
    private String locationAddress;
    
    // QR Code
    private String qrCodeScanned;
    private Boolean qrCodeVerified;
    
    // Cancelamento
    private String cancellationReason;
}

