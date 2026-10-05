package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Vehicle.FuelType;
import com.z7design.fleet_manager.model.Vehicle.VehicleType;
import com.z7design.fleet_manager.model.Vehicle.BusType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrlvParsedDataDTO {
    private String plate;
    private String renavam;
    private String chassisNumber;
    private String brand;
    private String model;
    private Integer manufactureYear;
    private Integer modelYear;
    private String color;
    private String fuelTypeRaw;
    private FuelType fuelType;
    private Integer capacity;
    private String category;
    private Integer enginePowerHp;
    private Integer totalWeightKg;
    private String engineNumber;
    private String cmt;
    private Integer axleCount;
    private String bodyType;
    private String ownerName;
    private String ownerCpfCnpj;
    private String cityState;
    private String issueDate;
    private VehicleType vehicleType;
    private BusType busType;
    private String rawText;
}
