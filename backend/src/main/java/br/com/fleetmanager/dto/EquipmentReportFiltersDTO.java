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
public class EquipmentReportFiltersDTO {
    
    // Filtros básicos
    private String searchTerm;
    private EquipmentStatus status;
    private ProtectionLevel protectionLevel;
    private EquipmentUsage usage;
    private EquipmentSize size;
    private Boolean isDangerous;
    
    // Filtros de funcionário
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
    
    // Filtros de expiração
    private Boolean isExpired;
    private Boolean isExpiringSoon;
    private Integer daysToExpiry;
    private Boolean isWeaponRegistrationExpired;
    private Boolean isWeaponRegistrationExpiringSoon;
    private Integer daysToWeaponRegistrationExpiry;
    
    // Filtros de movimentação
    private UUID currentUserId;
    private Boolean hasActiveMovement;
    private Boolean isOverdue;
    private UUID authorizedById;
    
    // Filtros de lote e fabricação
    private String batch;
    private String model;
    private String serialNumber;
    private String caNumber;
    
    // Filtros de relatório
    private String reportType; // "equipment_by_employee", "weapon_validity", "usage_report", "expiry_report"
    private String exportFormat; // "pdf", "excel"
    private Boolean includeHistory;
    private Boolean includeMovements;
    
    // Paginação
    private Integer page;
    private Integer pageSize;
    private String sortBy;
    private String sortDirection;
} 