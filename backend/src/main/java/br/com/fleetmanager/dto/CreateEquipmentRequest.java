package br.com.fleetmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

import br.com.fleetmanager.model.enums.EquipmentSize;
import br.com.fleetmanager.model.enums.EquipmentStatus;
import br.com.fleetmanager.model.enums.EquipmentUsage;
import br.com.fleetmanager.model.enums.ProtectionLevel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEquipmentRequest {
    
    @NotBlank(message = "Número de série é obrigatório")
    @Size(max = 100, message = "Número de série não pode exceder 100 caracteres")
    private String serialNumber;
    
    @NotNull(message = "Status é obrigatório")
    private EquipmentStatus status;
    
    @Size(max = 100, message = "Modelo não pode exceder 100 caracteres")
    private String model;
    
    @Size(max = 100, message = "Lote não pode exceder 100 caracteres")
    private String batch;
    
    @Size(max = 50, message = "Número CA não pode exceder 50 caracteres")
    private String caNumber;
    
    private ProtectionLevel protectionLevel;
    private EquipmentSize size;
    private EquipmentUsage usageType;
    
    @Size(max = 100, message = "Placa balística não pode exceder 100 caracteres")
    private String ballisticPlate;
    
    @NotNull(message = "Data de fabricação é obrigatória")
    private LocalDate manufacturingDate;
    
    private LocalDate validityDate;
    private LocalDate weaponRegistrationValidity;
    
    @Builder.Default
    private Boolean isDangerous = false;
    
    private UUID currentUserId;
    
    @Size(max = 1000, message = "Observações não podem exceder 1000 caracteres")
    private String notes;
}