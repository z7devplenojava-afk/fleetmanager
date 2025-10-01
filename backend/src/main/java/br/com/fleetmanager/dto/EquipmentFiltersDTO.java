package br.com.fleetmanager.dto;

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
public class EquipmentFiltersDTO {
    private String searchTerm;
    private EquipmentStatus status;
    private EquipmentUsage usageType;
    private ProtectionLevel protectionLevel;
    private EquipmentSize size;
    private Boolean isDangerous;
    private Boolean isExpired;
    private Boolean isExpiringSoon;
    private Boolean isWeaponRegistrationExpired;
    private Boolean isWeaponRegistrationExpiringSoon;
    private UUID currentUserId;
    private String batch;
    private String model;
    private LocalDate validityDateFrom;
    private LocalDate validityDateTo;
    private LocalDate manufacturingDateFrom;
    private LocalDate manufacturingDateTo;
    private LocalDate weaponRegistrationValidityFrom;
    private LocalDate weaponRegistrationValidityTo;
} 