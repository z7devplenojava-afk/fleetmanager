package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleFuelStatsDTO {
    
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleModel;
    private String vehicleBrand;
    private Integer totalRecords;
    private BigDecimal totalFuelConsumed;
    private BigDecimal totalCost;
    private BigDecimal averageFuelPerRefill;
    private BigDecimal averagePricePerLiter;
    private BigDecimal consumptionPerKm;
    private BigDecimal costPerKm;
    private Integer totalDistance;
    
    // Métodos para formatação
    public String getFormattedTotalFuel() {
        if (totalFuelConsumed == null || totalFuelConsumed.compareTo(BigDecimal.ZERO) == 0) {
            return "0,00 L";
        }
        return String.format("%.2f L", totalFuelConsumed);
    }
    
    public String getFormattedTotalCost() {
        if (totalCost == null || totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return "R$ 0,00";
        }
        return String.format("R$ %.2f", totalCost);
    }
    
    public String getFormattedConsumptionPerKm() {
        if (consumptionPerKm == null || consumptionPerKm.compareTo(BigDecimal.ZERO) == 0) {
            return "0,000 L/km";
        }
        return String.format("%.3f L/km", consumptionPerKm);
    }
    
    public String getFormattedCostPerKm() {
        if (costPerKm == null || costPerKm.compareTo(BigDecimal.ZERO) == 0) {
            return "R$ 0,00";
        }
        return String.format("R$ %.2f", costPerKm);
    }
    
    public String getFormattedTotalDistance() {
        if (totalDistance == null || totalDistance == 0) {
            return "0 km";
        }
        return String.format("%d km", totalDistance);
    }
    
    public String getFormattedAverageFuelPerRefill() {
        if (averageFuelPerRefill == null || averageFuelPerRefill.compareTo(BigDecimal.ZERO) == 0) {
            return "0,00 L";
        }
        return String.format("%.2f L", averageFuelPerRefill);
    }
    
    public String getFormattedAveragePricePerLiter() {
        if (averagePricePerLiter == null || averagePricePerLiter.compareTo(BigDecimal.ZERO) == 0) {
            return "R$ 0,00";
        }
        return String.format("R$ %.2f", averagePricePerLiter);
    }
}
