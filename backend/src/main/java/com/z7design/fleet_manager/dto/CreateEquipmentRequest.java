package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.EquipmentSize;
import com.z7design.fleet_manager.model.enums.EquipmentStatus;
import com.z7design.fleet_manager.model.enums.EquipmentUsage;
import com.z7design.fleet_manager.model.enums.ProtectionLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEquipmentRequest {
    
    @NotBlank(message = "NÃºmero de sÃ©rie Ã© obrigatÃ³rio")
    @Size(max = 100, message = "NÃºmero de sÃ©rie nÃ£o pode exceder 100 caracteres")
    private String serialNumber;
    
    @NotNull(message = "Status Ã© obrigatÃ³rio")
    private EquipmentStatus status;
    
    @Size(max = 100, message = "Modelo nÃ£o pode exceder 100 caracteres")
    private String model;
    
    @Size(max = 100, message = "Lote nÃ£o pode exceder 100 caracteres")
    private String batch;
    
    @Size(max = 50, message = "NÃºmero CA nÃ£o pode exceder 50 caracteres")
    private String caNumber;
    
    private ProtectionLevel protectionLevel;
    private EquipmentSize size;
    private EquipmentUsage usageType;
    
    @Size(max = 100, message = "Placa balÃ­stica nÃ£o pode exceder 100 caracteres")
    private String ballisticPlate;
    
    @NotNull(message = "Data de fabricaÃ§Ã£o Ã© obrigatÃ³ria")
    private LocalDate manufacturingDate;
    
    private LocalDate validityDate;
    private LocalDate weaponRegistrationValidity;
    
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    
    @Builder.Default
    private Boolean isDangerous = false;
    
    private UUID currentUserId;
    
    @Size(max = 1000, message = "ObservaÃ§Ãµes nÃ£o podem exceder 1000 caracteres")
    private String notes;
}
