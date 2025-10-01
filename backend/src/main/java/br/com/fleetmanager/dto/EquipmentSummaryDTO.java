package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentSummaryDTO {
    private Long totalEquipments;
    private Long activeEquipments;
    private Long inMaintenanceEquipments;
    private Long inStockEquipments;
    private Long expiredEquipments;
    private Long expiringSoon30Days;
    private Long expiringSoon60Days;
    private Long weaponRegistrationExpired;
    private Long weaponRegistrationExpiringSoon30Days;
    private Long weaponRegistrationExpiringSoon60Days;
    private Long dangerousEquipments;
    private Long equipmentsWithUsers;
} 