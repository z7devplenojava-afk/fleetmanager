package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.ArlaRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArlaRecordDTO {

    private UUID id;
    private UUID vehicleId;
    private String vehiclePlate;
    private UUID driverId;
    private String driverName;
    private LocalDate date;
    private BigDecimal quantity;
    private BigDecimal cost;
    private Integer mileage;
    private String station;
    private String notes;
    private LocalDateTime createdAt;

    public static ArlaRecordDTO fromEntity(ArlaRecord entity) {
        if (entity == null)
            return null;
        return ArlaRecordDTO.builder()
                .id(entity.getId())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehiclePlate(entity.getVehicle() != null ? entity.getVehicle().getPlate() : null)
                .driverId(entity.getDriver() != null ? entity.getDriver().getId() : null)
                .driverName(entity.getDriver() != null ? entity.getDriver().getName() : null)
                .date(entity.getDate())
                .quantity(entity.getQuantity())
                .cost(entity.getCost())
                .mileage(entity.getMileage())
                .station(entity.getStation())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
