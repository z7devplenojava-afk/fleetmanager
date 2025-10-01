package br.com.fleetmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import br.com.fleetmanager.model.enums.EquipmentSize;
import br.com.fleetmanager.model.enums.EquipmentStatus;
import br.com.fleetmanager.model.enums.EquipmentUsage;
import br.com.fleetmanager.model.enums.ProtectionLevel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDTO {
    
    private UUID id;
    private String serialNumber;
    private EquipmentStatus status;
    private String model;
    private String batch;
    private String caNumber;
    private ProtectionLevel protectionLevel;
    private EquipmentSize size;
    private EquipmentUsage usageType;
    private String ballisticPlate;
    
    // Datas
    private LocalDate manufacturingDate;
    private LocalDate validityDate;
    private LocalDate sixYearExpiry;
    private LocalDate weaponRegistrationValidity;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    
    // Flags
    private Boolean isDangerous;
    
    // Usuário atual (simplificado)
    private UUID currentUserId;
    private String currentUserName;
    
    // Observações
    private String notes;
    private String qrCode;
    
    // Auditoria
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Métodos auxiliares
    public boolean isExpired() {
        return validityDate != null && validityDate.isBefore(LocalDate.now());
    }
    
    public boolean isExpiringSoon(int days) {
        if (validityDate == null) return false;
        LocalDate alertDate = LocalDate.now().plusDays(days);
        return validityDate.isBefore(alertDate);
    }
    
    public boolean isWeaponRegistrationExpired() {
        return weaponRegistrationValidity != null && weaponRegistrationValidity.isBefore(LocalDate.now());
    }
}