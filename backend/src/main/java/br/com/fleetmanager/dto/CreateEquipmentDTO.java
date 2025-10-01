package br.com.fleetmanager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

import br.com.fleetmanager.model.enums.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEquipmentDTO {
    
    @NotNull(message = "Status é obrigatório")
    private EquipmentStatus status;
    
    @Size(max = 100, message = "Placa balística deve ter no máximo 100 caracteres")
    private String ballisticPlate;
    
    @NotNull(message = "Data de fabricação é obrigatória")
    private LocalDate manufacturingDate;
    
    private LocalDate weaponRegistrationValidity;
    
    private EquipmentUsage usageType;
    
    @NotBlank(message = "Número de série é obrigatório")
    @Size(max = 100, message = "Número de série deve ter no máximo 100 caracteres")
    private String serialNumber;
    
    @Size(max = 50, message = "Número do CA deve ter no máximo 50 caracteres")
    private String caNumber;
    
    private ProtectionLevel protectionLevel;
    
    @Size(max = 100, message = "Lote deve ter no máximo 100 caracteres")
    private String batch;
    
    @Size(max = 100, message = "Modelo deve ter no máximo 100 caracteres")
    private String model;
    
    private EquipmentSize size;
    
    private LocalDate validityDate;
    
    @Builder.Default
    private Boolean isDangerous = false;
    
    private String notes;
    
    private UUID currentUserId;
    
    private LocalDate lastMaintenanceDate;
    
    private LocalDate nextMaintenanceDate;
} 