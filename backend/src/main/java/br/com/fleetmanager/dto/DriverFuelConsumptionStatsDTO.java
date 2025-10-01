package br.com.fleetmanager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DriverFuelConsumptionStatsDTO {
    
    private String driverName;
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
    private List<VehicleStats> vehiclesUsed;
    
    // Construtor padrão
    public DriverFuelConsumptionStatsDTO() {}
    
    // Construtor com parâmetros principais
    public DriverFuelConsumptionStatsDTO(String driverName) {
        this.driverName = driverName;
    }
    
    // Classe interna para estatísticas por veículo
    public static class VehicleStats {
        private String vehiclePlate;
        private String vehicleModel;
        private Integer recordsCount;
        private BigDecimal totalFuel;
        private BigDecimal totalCost;
        private BigDecimal averageConsumption;
        
        public VehicleStats() {}
        
        public VehicleStats(String vehiclePlate, String vehicleModel) {
            this.vehiclePlate = vehiclePlate;
            this.vehicleModel = vehicleModel;
        }
        
        // Getters e Setters
        public String getVehiclePlate() { return vehiclePlate; }
        public void setVehiclePlate(String vehiclePlate) { this.vehiclePlate = vehiclePlate; }
        
        public String getVehicleModel() { return vehicleModel; }
        public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }
        
        public Integer getRecordsCount() { return recordsCount; }
        public void setRecordsCount(Integer recordsCount) { this.recordsCount = recordsCount; }
        
        public BigDecimal getTotalFuel() { return totalFuel; }
        public void setTotalFuel(BigDecimal totalFuel) { this.totalFuel = totalFuel; }
        
        public BigDecimal getTotalCost() { return totalCost; }
        public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
        
        public BigDecimal getAverageConsumption() { return averageConsumption; }
        public void setAverageConsumption(BigDecimal averageConsumption) { this.averageConsumption = averageConsumption; }
    }
    
    // Getters e Setters
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    
    public Integer getTotalRecords() { return totalRecords; }
    public void setTotalRecords(Integer totalRecords) { this.totalRecords = totalRecords; }
    
    public BigDecimal getTotalFuelConsumed() { return totalFuelConsumed; }
    public void setTotalFuelConsumed(BigDecimal totalFuelConsumed) { this.totalFuelConsumed = totalFuelConsumed; }
    
    public BigDecimal getTotalCost() { return totalCost; }
    public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
    
    public BigDecimal getAverageFuelPerRefill() { return averageFuelPerRefill; }
    public void setAverageFuelPerRefill(BigDecimal averageFuelPerRefill) { this.averageFuelPerRefill = averageFuelPerRefill; }
    
    public BigDecimal getAveragePricePerLiter() { return averagePricePerLiter; }
    public void setAveragePricePerLiter(BigDecimal averagePricePerLiter) { this.averagePricePerLiter = averagePricePerLiter; }
    
    public BigDecimal getConsumptionPerKm() { return consumptionPerKm; }
    public void setConsumptionPerKm(BigDecimal consumptionPerKm) { this.consumptionPerKm = consumptionPerKm; }
    
    public BigDecimal getCostPerKm() { return costPerKm; }
    public void setCostPerKm(BigDecimal costPerKm) { this.costPerKm = costPerKm; }
    
    public Integer getTotalDistance() { return totalDistance; }
    public void setTotalDistance(Integer totalDistance) { this.totalDistance = totalDistance; }
    
    public LocalDate getLastRefillDate() { return lastRefillDate; }
    public void setLastRefillDate(LocalDate lastRefillDate) { this.lastRefillDate = lastRefillDate; }
    
    public BigDecimal getLastRefillQuantity() { return lastRefillQuantity; }
    public void setLastRefillQuantity(BigDecimal lastRefillQuantity) { this.lastRefillQuantity = lastRefillQuantity; }
    
    public BigDecimal getLastRefillCost() { return lastRefillCost; }
    public void setLastRefillCost(BigDecimal lastRefillCost) { this.lastRefillCost = lastRefillCost; }
    
    public List<VehicleStats> getVehiclesUsed() { return vehiclesUsed; }
    public void setVehiclesUsed(List<VehicleStats> vehiclesUsed) { this.vehiclesUsed = vehiclesUsed; }
    
    // Métodos de cálculo
    public void calculateConsumptionPerKm() {
        if (totalDistance != null && totalDistance > 0 && totalFuelConsumed != null && totalFuelConsumed.compareTo(BigDecimal.ZERO) > 0) {
            this.consumptionPerKm = totalFuelConsumed.divide(BigDecimal.valueOf(totalDistance), 3, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    public void calculateCostPerKm() {
        if (totalDistance != null && totalDistance > 0 && totalCost != null && totalCost.compareTo(BigDecimal.ZERO) > 0) {
            this.costPerKm = totalCost.divide(BigDecimal.valueOf(totalDistance), 3, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    public void calculateAverageFuelPerRefill() {
        if (totalRecords != null && totalRecords > 0 && totalFuelConsumed != null && totalFuelConsumed.compareTo(BigDecimal.ZERO) > 0) {
            this.averageFuelPerRefill = totalFuelConsumed.divide(BigDecimal.valueOf(totalRecords), 2, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    public void calculateAveragePricePerLiter() {
        if (totalFuelConsumed != null && totalFuelConsumed.compareTo(BigDecimal.ZERO) > 0 && totalCost != null && totalCost.compareTo(BigDecimal.ZERO) > 0) {
            this.averagePricePerLiter = totalCost.divide(totalFuelConsumed, 3, BigDecimal.ROUND_HALF_UP);
        }
    }
} 