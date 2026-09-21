package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Vehicle;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class FuelTankDTO {
    private UUID id;
    private String name;
    private BigDecimal capacity;
    private BigDecimal currentLevel;
    private Vehicle.FuelType fuelType;
    private UUID garageId;
    private String garageName;

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

    public BigDecimal getCapacity() {
        return capacity;
    }

    public void setCapacity(BigDecimal capacity) {
        this.capacity = capacity;
    }

    public BigDecimal getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(BigDecimal currentLevel) {
        this.currentLevel = currentLevel;
    }

    public Vehicle.FuelType getFuelType() {
        return fuelType;
    }

    public void setFuelType(Vehicle.FuelType fuelType) {
        this.fuelType = fuelType;
    }
}
