package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Vehicle;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleReportDTO {

    private UUID id;
    private String plate;
    private String brand;
    private String model;
    private Integer year;
    private String fuelType;
    private Integer currentMileage;
    private Integer capacity;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VehicleReportDTO fromEntity(Vehicle vehicle) {
        VehicleReportDTO dto = new VehicleReportDTO();
        dto.setId(vehicle.getId());
        dto.setPlate(vehicle.getPlate());
        dto.setBrand(vehicle.getBrand());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setFuelType(vehicle.getFuelType().toString());
        dto.setCurrentMileage(vehicle.getCurrentMileage());
        dto.setCapacity(vehicle.getCapacity());
        dto.setStatus(vehicle.getStatus().toString());
        dto.setCreatedAt(vehicle.getCreatedAt());
        dto.setUpdatedAt(vehicle.getUpdatedAt());
        return dto;
    }
}

