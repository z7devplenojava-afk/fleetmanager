package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import br.com.fleetmanager.model.enums.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentReportDTO {
    
    // Informações do relatório
    private String reportTitle;
    private String reportType;
    private LocalDateTime generatedAt;
    private String generatedBy;
    private String filtersApplied;
    
    // Estatísticas gerais
    private Long totalEquipments;
    private Long activeEquipments;
    private Long expiredEquipments;
    private Long expiringSoonEquipments;
    private Long dangerousEquipments;
    private Long weaponsWithExpiredRegistration;
    private Long weaponsExpiringSoon;
    
    // Dados do relatório
    private List<EquipmentDTO> equipments;
    private List<EquipmentMovementDTO> movements;
    
    // Relatórios específicos
    private List<EquipmentByEmployeeDTO> equipmentByEmployee;
    private List<WeaponValidityDTO> weaponValidity;
    private List<EquipmentUsageDTO> equipmentUsage;
    private List<EquipmentExpiryDTO> equipmentExpiry;
    
    // Resumo por categoria
    private List<EquipmentCategorySummaryDTO> categorySummary;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentByEmployeeDTO {
        private UUID employeeId;
        private String employeeName;
        private String employeeCpf;
        private UUID workPostId;
        private String workPostName;
        private String workPostLocation;
        private Long totalEquipments;
        private Long activeEquipments;
        private Long expiredEquipments;
        private List<EquipmentDTO> equipments;
        private List<EquipmentMovementDTO> movements;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeaponValidityDTO {
        private UUID equipmentId;
        private String serialNumber;
        private String model;
        private String caNumber;
        private LocalDate weaponRegistrationValidity;
        private Boolean isExpired;
        private Boolean isExpiringSoon;
        private Integer daysToExpiry;
        private String currentUserName;
        private String currentUserCpf;
        private String workPostName;
        private String workPostLocation;
        private EquipmentMovementDTO lastMovement;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentUsageDTO {
        private UUID equipmentId;
        private String serialNumber;
        private String model;
        private EquipmentStatus status;
        private EquipmentUsage usage;
        private Long totalMovements;
        private Long activeMovements;
        private Long daysInUse;
        private String mostUsedBy;
        private String mostUsedAt;
        private LocalDateTime lastMovementDate;
        private String currentUserName;
        private String currentUserCpf;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentExpiryDTO {
        private UUID equipmentId;
        private String serialNumber;
        private String model;
        private LocalDate validityDate;
        private LocalDate sixYearExpiry;
        private LocalDate weaponRegistrationValidity;
        private Boolean isExpired;
        private Boolean isExpiringSoon;
        private Integer daysToExpiry;
        private Boolean isWeaponRegistrationExpired;
        private Boolean isWeaponRegistrationExpiringSoon;
        private Integer daysToWeaponRegistrationExpiry;
        private String currentUserName;
        private String currentUserCpf;
        private String workPostName;
        private String workPostLocation;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentCategorySummaryDTO {
        private String category; // "Weapons", "Vests", "Other"
        private Long totalCount;
        private Long activeCount;
        private Long expiredCount;
        private Long expiringSoonCount;
        private Long inMaintenanceCount;
        private Long inStockCount;
        private Double averageAgeInDays;
        private String mostCommonModel;
        private String mostCommonProtectionLevel;
    }
} 