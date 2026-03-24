package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEquipmentDTO {
    
    @NotNull(message = "Status Ã© obrigatÃ³rio")
    private EquipmentStatus status;
    
    @Size(max = 100, message = "Placa balÃ­stica deve ter no mÃ¡ximo 100 caracteres")
    private String ballisticPlate;
    
    @NotNull(message = "Data de fabricaÃ§Ã£o Ã© obrigatÃ³ria")
    private LocalDate manufacturingDate;
    
    private LocalDate weaponRegistrationValidity;
    
    private EquipmentUsage usageType;
    
    @NotBlank(message = "NÃºmero de sÃ©rie Ã© obrigatÃ³rio")
    @Size(max = 100, message = "NÃºmero de sÃ©rie deve ter no mÃ¡ximo 100 caracteres")
    private String serialNumber;
    
    @Size(max = 50, message = "NÃºmero do CA deve ter no mÃ¡ximo 50 caracteres")
    private String caNumber;
    
    private ProtectionLevel protectionLevel;
    
    @Size(max = 100, message = "Lote deve ter no mÃ¡ximo 100 caracteres")
    private String batch;
    
    @Size(max = 100, message = "Modelo deve ter no mÃ¡ximo 100 caracteres")
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
