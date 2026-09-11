package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.VehicleBattery;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleBatteryDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleModel;
    private String batteryCode;
    private String brand;
    private String model;
    private String voltage;
    private String capacity;
    private LocalDate installDate;
    private LocalDate warrantyExpiryDate;
    private VehicleBattery.BatteryStatus status;
    private BigDecimal cost;
    private String notes;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VehicleBatteryDTO fromEntity(VehicleBattery battery) {
        VehicleBatteryDTO dto = new VehicleBatteryDTO();
        dto.setId(battery.getId());
        dto.setVehicleId(battery.getVehicle().getId());
        dto.setVehiclePlate(battery.getVehicle().getPlate());
        dto.setVehicleModel(battery.getVehicle().getModel());
        dto.setBatteryCode(battery.getBatteryCode());
        dto.setBrand(battery.getBrand());
        dto.setModel(battery.getModel());
        dto.setVoltage(battery.getVoltage());
        dto.setCapacity(battery.getCapacity());
        dto.setInstallDate(battery.getInstallDate());
        dto.setWarrantyExpiryDate(battery.getWarrantyExpiryDate());
        dto.setStatus(battery.getStatus());
        dto.setCost(battery.getCost());
        dto.setNotes(battery.getNotes());
        dto.setCompanyId(battery.getCompanyId());
        dto.setCreatedAt(battery.getCreatedAt());
        dto.setUpdatedAt(battery.getUpdatedAt());
        return dto;
    }
}
