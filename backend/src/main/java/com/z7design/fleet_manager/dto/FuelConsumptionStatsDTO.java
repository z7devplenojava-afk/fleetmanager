package com.z7design.fleet_manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FuelConsumptionStatsDTO {
    
    private String vehiclePlate;
    private String vehicleModel;
    private Integer totalRecords;
    private BigDecimal totalFuelConsumed;
    private BigDecimal totalCost;
    private BigDecimal averageFuelPerRefill;
    private BigDecimal averagePricePerLiter;
    private BigDecimal consumptionPerKm;
    private BigDecimal costPerKm;
    private Integer totalDistance;
    private LocalDate lastRefillDate;
    private BigDecimal lastRefillQuantity;
    private BigDecimal lastRefillCost;
    
    // Construtor padrÃ£o
    public FuelConsumptionStatsDTO() {}
    
    // Construtor com parÃ¢metros principais
    public FuelConsumptionStatsDTO(String vehiclePlate, String vehicleModel) {
        this.vehiclePlate = vehiclePlate;
        this.vehicleModel = vehicleModel;
    }
    
    // Getters e Setters
    public String getVehiclePlate() {
        return vehiclePlate;
    }
    
    public void setVehiclePlate(String vehiclePlate) {
        this.vehiclePlate = vehiclePlate;
    }
    
    public String getVehicleModel() {
        return vehicleModel;
    }
    
    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }
    
    public Integer getTotalRecords() {
        return totalRecords;
    }
    
    public void setTotalRecords(Integer totalRecords) {
        this.totalRecords = totalRecords;
    }
    
    public BigDecimal getTotalFuelConsumed() {
        return totalFuelConsumed;
    }
    
    public void setTotalFuelConsumed(BigDecimal totalFuelConsumed) {
        this.totalFuelConsumed = totalFuelConsumed;
    }
    
    public BigDecimal getTotalCost() {
        return totalCost;
    }
    
    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }
    
    public BigDecimal getAverageFuelPerRefill() {
        return averageFuelPerRefill;
    }
    
    public void setAverageFuelPerRefill(BigDecimal averageFuelPerRefill) {
        this.averageFuelPerRefill = averageFuelPerRefill;
    }
    
    public BigDecimal getAveragePricePerLiter() {
        return averagePricePerLiter;
    }
    
    public void setAveragePricePerLiter(BigDecimal averagePricePerLiter) {
        this.averagePricePerLiter = averagePricePerLiter;
    }
    
    public BigDecimal getConsumptionPerKm() {
        return consumptionPerKm;
    }
    
    public void setConsumptionPerKm(BigDecimal consumptionPerKm) {
        this.consumptionPerKm = consumptionPerKm;
    }
    
    public BigDecimal getCostPerKm() {
        return costPerKm;
    }
    
    public void setCostPerKm(BigDecimal costPerKm) {
        this.costPerKm = costPerKm;
    }
    
    public Integer getTotalDistance() {
        return totalDistance;
    }
    
    public void setTotalDistance(Integer totalDistance) {
        this.totalDistance = totalDistance;
    }
    
    public LocalDate getLastRefillDate() {
        return lastRefillDate;
    }
    
    public void setLastRefillDate(LocalDate lastRefillDate) {
        this.lastRefillDate = lastRefillDate;
    }
    
    public BigDecimal getLastRefillQuantity() {
        return lastRefillQuantity;
    }
    
    public void setLastRefillQuantity(BigDecimal lastRefillQuantity) {
        this.lastRefillQuantity = lastRefillQuantity;
    }
    
    public BigDecimal getLastRefillCost() {
        return lastRefillCost;
    }
    
    public void setLastRefillCost(BigDecimal lastRefillCost) {
        this.lastRefillCost = lastRefillCost;
    }
    
    // MÃ©todo para calcular consumo por km
    public void calculateConsumptionPerKm() {
        if (totalDistance != null && totalDistance > 0 && totalFuelConsumed != null && totalFuelConsumed.compareTo(BigDecimal.ZERO) > 0) {
            this.consumptionPerKm = totalFuelConsumed.divide(BigDecimal.valueOf(totalDistance), 3, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    // MÃ©todo para calcular custo por km
    public void calculateCostPerKm() {
        if (totalDistance != null && totalDistance > 0 && totalCost != null && totalCost.compareTo(BigDecimal.ZERO) > 0) {
            this.costPerKm = totalCost.divide(BigDecimal.valueOf(totalDistance), 3, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    // MÃ©todo para calcular mÃ©dia de combustÃ­vel por abastecimento
    public void calculateAverageFuelPerRefill() {
        if (totalRecords != null && totalRecords > 0 && totalFuelConsumed != null && totalFuelConsumed.compareTo(BigDecimal.ZERO) > 0) {
            this.averageFuelPerRefill = totalFuelConsumed.divide(BigDecimal.valueOf(totalRecords), 2, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    // MÃ©todo para calcular preÃ§o mÃ©dio por litro
    public void calculateAveragePricePerLiter() {
        if (totalFuelConsumed != null && totalFuelConsumed.compareTo(BigDecimal.ZERO) > 0 && totalCost != null && totalCost.compareTo(BigDecimal.ZERO) > 0) {
            this.averagePricePerLiter = totalCost.divide(totalFuelConsumed, 3, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    @Override
    public String toString() {
        return "FuelConsumptionStatsDTO{" +
                "vehiclePlate='" + vehiclePlate + '\'' +
                ", vehicleModel='" + vehicleModel + '\'' +
                ", totalRecords=" + totalRecords +
                ", totalFuelConsumed=" + totalFuelConsumed +
                ", totalCost=" + totalCost +
                ", averageFuelPerRefill=" + averageFuelPerRefill +
                ", averagePricePerLiter=" + averagePricePerLiter +
                ", consumptionPerKm=" + consumptionPerKm +
                ", costPerKm=" + costPerKm +
                ", totalDistance=" + totalDistance +
                ", lastRefillDate=" + lastRefillDate +
                '}';
    }

    public static Double toDouble(Object value) {
        if (value instanceof BigDecimal) {
            return ((BigDecimal) value).doubleValue();
        } else if (value instanceof Double) {
            return (Double) value;
        } else if (value instanceof Integer) {
            return ((Integer) value).doubleValue();
        } else if (value instanceof Long) {
            return ((Long) value).doubleValue();
        } else {
            return 0.0;
        }
    }
} 
