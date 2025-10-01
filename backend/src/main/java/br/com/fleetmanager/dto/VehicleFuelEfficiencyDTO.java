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
public class VehicleFuelEfficiencyDTO {
    
    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleName;
    
    // Métricas de eficiência
    private BigDecimal consumptionLPerKm;      // Consumo em L/km
    private BigDecimal efficiencyKmPerLiter;  // Eficiência em km/L
    private BigDecimal costPerKm;             // Custo por km
    
    // Dados totais
    private BigDecimal totalFuelConsumed;     // Total de combustível consumido
    private BigDecimal totalCost;             // Custo total
    private int totalDistance;                // Distância total percorrida
    private int totalRecords;                 // Total de registros de abastecimento
    
    // Métodos para formatação
    public String getFormattedConsumption() {
        if (consumptionLPerKm == null || consumptionLPerKm.compareTo(BigDecimal.ZERO) == 0) {
            return "0,000 L/km";
        }
        return String.format("%.3f L/km", consumptionLPerKm);
    }
    
    public String getFormattedEfficiency() {
        if (efficiencyKmPerLiter == null || efficiencyKmPerLiter.compareTo(BigDecimal.ZERO) == 0) {
            return "0,00 km/L";
        }
        return String.format("%.2f km/L", efficiencyKmPerLiter);
    }
    
    public String getFormattedCostPerKm() {
        if (costPerKm == null || costPerKm.compareTo(BigDecimal.ZERO) == 0) {
            return "R$ 0,00";
        }
        return String.format("R$ %.2f", costPerKm);
    }
    
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
    
    public String getFormattedTotalDistance() {
        return String.format("%d km", totalDistance);
    }
}
