package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class FuelPumpReadingDTO {
    private UUID id;
    private LocalDate readingDate;
    private BigDecimal initialValue;
    private BigDecimal finalValue;
    private BigDecimal totalLiters;
    private UUID fuelPumpId;
    private String fuelPumpName;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LocalDate getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(LocalDate readingDate) {
        this.readingDate = readingDate;
    }

    public BigDecimal getInitialValue() {
        return initialValue;
    }

    public void setInitialValue(BigDecimal initialValue) {
        this.initialValue = initialValue;
    }

    public BigDecimal getFinalValue() {
        return finalValue;
    }

    public void setFinalValue(BigDecimal finalValue) {
        this.finalValue = finalValue;
    }

    public BigDecimal getTotalLiters() {
        return totalLiters;
    }

    public void setTotalLiters(BigDecimal totalLiters) {
        this.totalLiters = totalLiters;
    }

    public UUID getFuelPumpId() {
        return fuelPumpId;
    }

    public void setFuelPumpId(UUID fuelPumpId) {
        this.fuelPumpId = fuelPumpId;
    }

    public String getFuelPumpName() {
        return fuelPumpName;
    }

    public void setFuelPumpName(String fuelPumpName) {
        this.fuelPumpName = fuelPumpName;
    }
}
