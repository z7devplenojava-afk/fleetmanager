package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.*;
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
public class EquipmentReportFiltersDTO {
    
    // Filtros bÃ¡sicos
    private String searchTerm;
    private EquipmentStatus status;
    private ProtectionLevel protectionLevel;
    private EquipmentUsage usage;
    private EquipmentSize size;
    private Boolean isDangerous;
    
    // Filtros de funcionÃ¡rio
    private UUID employeeId;
    private String employeeName;
    private String employeeCpf;
    
    // Filtros de posto de trabalho
    private UUID workPostId;
    private String workPostName;
    
    // Filtros de datas
    private LocalDate manufacturingDateFrom;
    private LocalDate manufacturingDateTo;
    private LocalDate validityDateFrom;
    private LocalDate validityDateTo;
    private LocalDate sixYearExpiryFrom;
    private LocalDate sixYearExpiryTo;
    private LocalDate weaponRegistrationValidityFrom;
    private LocalDate weaponRegistrationValidityTo;
    
    // Filtros de expiraÃ§Ã£o
    private Boolean isExpired;
    private Boolean isExpiringSoon;
    private Integer daysToExpiry;
    private Boolean isWeaponRegistrationExpired;
    private Boolean isWeaponRegistrationExpiringSoon;
    private Integer daysToWeaponRegistrationExpiry;
    
    // Filtros de movimentaÃ§Ã£o
    private UUID currentUserId;
    private Boolean hasActiveMovement;
    private Boolean isOverdue;
    private UUID authorizedById;
    
    // Filtros de lote e fabricaÃ§Ã£o
    private String batch;
    private String model;
    private String serialNumber;
    private String caNumber;
    
    // Filtros de relatÃ³rio
    private String reportType; // "equipment_by_employee", "weapon_validity", "usage_report", "expiry_report"
    private String exportFormat; // "pdf", "excel"
    private Boolean includeHistory;
    private Boolean includeMovements;
    
    // PaginaÃ§Ã£o
    private Integer page;
    private Integer pageSize;
    private String sortBy;
    private String sortDirection;
} 
