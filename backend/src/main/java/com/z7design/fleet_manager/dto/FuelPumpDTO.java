package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class FuelPumpDTO {
    private UUID id;
    private String name;
    private UUID fuelTankId;
    private String fuelTankName;
    private BigDecimal lastMeterReading;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UUID getFuelTankId() {
        return fuelTankId;
    }

    public void setFuelTankId(UUID fuelTankId) {
        this.fuelTankId = fuelTankId;
    }

    public String getFuelTankName() {
        return fuelTankName;
    }

    public void setFuelTankName(String fuelTankName) {
        this.fuelTankName = fuelTankName;
    }

    public BigDecimal getLastMeterReading() {
        return lastMeterReading;
    }

    public void setLastMeterReading(BigDecimal lastMeterReading) {
        this.lastMeterReading = lastMeterReading;
    }
}
