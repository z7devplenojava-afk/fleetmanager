package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.CostSimulation;
import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.model.enums.VehicleCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - Módulo 1: Ficha Paramétrica de Custos.
 * Percentuais são enviados como fração decimal (0.10 = 10%).
 */
@Data
public class CostSimulationDTO {

    private UUID id;

    @NotBlank(message = "Nome da simulação é obrigatório")
    private String name;

    private UUID clientId;
    private String clientName;

    private UUID contractId;
    private String contractDescription;

    @NotNull(message = "Categoria do veículo é obrigatória")
    private VehicleCategory vehicleCategory;

    @Min(value = 1, message = "Regime deve ser de 1 a 3 motoristas")
    @Max(value = 3, message = "Regime deve ser de 1 a 3 motoristas")
    private Integer driverCount = 1;

    @Min(value = 1, message = "Dias operacionais deve estar entre 1 e 31")
    @Max(value = 31, message = "Dias operacionais deve estar entre 1 e 31")
    private Integer operatingDays = 22;

    @NotNull(message = "Cotação do diesel é obrigatória")
    @DecimalMin(value = "0.01", message = "Cotação do diesel deve ser maior que zero")
    private BigDecimal dieselPrice;

    @NotNull(message = "Piso salarial é obrigatório")
    private BigDecimal baseSalary;

    /** Encargos sociais (0.60 a 0.85). */
    private BigDecimal payrollChargesPct = new BigDecimal("0.7000");

    private BigDecimal mealAllowance = BigDecimal.ZERO;
    private BigDecimal healthPlanCost = BigDecimal.ZERO;

    @NotNull(message = "KM diário é obrigatório")
    @DecimalMin(value = "0.01", message = "KM diário deve ser maior que zero")
    private BigDecimal dailyKm;

    /** Fator de KM improdutiva (padrão 1.10). */
    private BigDecimal productivityFactor = new BigDecimal("1.1000");

    private BigDecimal maintenancePerKm = BigDecimal.ZERO;
    private BigDecimal tiresPerKm = BigDecimal.ZERO;
    private BigDecimal lubricantsPerKm = BigDecimal.ZERO;
    private BigDecimal partsPerKm = BigDecimal.ZERO;
    private BigDecimal fixedCosts = BigDecimal.ZERO;

    private BigDecimal issPct = new BigDecimal("0.0500");
    private BigDecimal icmsPct = new BigDecimal("0.1044");
    private BigDecimal pisPct = new BigDecimal("0.0065");
    private BigDecimal cofinsPct = new BigDecimal("0.0300");
    private BigDecimal irpjPct = new BigDecimal("0.0240");
    private BigDecimal csllPct = new BigDecimal("0.0108");
    private BigDecimal profitMarginPct = new BigDecimal("0.1000");
    private BigDecimal bdiPct = BigDecimal.ZERO;
    private BigDecimal extraTripMarginPct = new BigDecimal("0.1500");

    // ===== Resultados calculados =====
    private BigDecimal fixedDriverCost;
    private BigDecimal totalFixedCost;
    private BigDecimal variableCostPerKm;
    private BigDecimal franchiseKm;
    private BigDecimal totalMonthlyCost;
    private BigDecimal monthlyPrice;
    private BigDecimal dailyRate;
    private BigDecimal excessKmRate;
    private BigDecimal extraTripRate;
    private BigDecimal taxesTotalPct;

    // ===== Gestão =====
    private CostSimulationStatus status = CostSimulationStatus.DRAFT;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CostSimulationDTO fromEntity(CostSimulation entity) {
        CostSimulationDTO dto = new CostSimulationDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        if (entity.getClient() != null) {
            dto.setClientId(entity.getClient().getId());
            dto.setClientName(entity.getClient().getName());
        }
        if (entity.getContract() != null) {
            dto.setContractId(entity.getContract().getId());
            dto.setContractDescription(entity.getContract().getDescription());
        }
        dto.setVehicleCategory(entity.getVehicleCategory());
        dto.setDriverCount(entity.getDriverCount());
        dto.setOperatingDays(entity.getOperatingDays());
        dto.setDieselPrice(entity.getDieselPrice());
        dto.setBaseSalary(entity.getBaseSalary());
        dto.setPayrollChargesPct(entity.getPayrollChargesPct());
        dto.setMealAllowance(entity.getMealAllowance());
        dto.setHealthPlanCost(entity.getHealthPlanCost());
        dto.setDailyKm(entity.getDailyKm());
        dto.setProductivityFactor(entity.getProductivityFactor());
        dto.setMaintenancePerKm(entity.getMaintenancePerKm());
        dto.setTiresPerKm(entity.getTiresPerKm());
        dto.setLubricantsPerKm(entity.getLubricantsPerKm());
        dto.setPartsPerKm(entity.getPartsPerKm());
        dto.setFixedCosts(entity.getFixedCosts());
        dto.setIssPct(entity.getIssPct());
        dto.setIcmsPct(entity.getIcmsPct());
        dto.setPisPct(entity.getPisPct());
        dto.setCofinsPct(entity.getCofinsPct());
        dto.setIrpjPct(entity.getIrpjPct());
        dto.setCsllPct(entity.getCsllPct());
        dto.setProfitMarginPct(entity.getProfitMarginPct());
        dto.setBdiPct(entity.getBdiPct());
        dto.setExtraTripMarginPct(entity.getExtraTripMarginPct());
        dto.setFixedDriverCost(entity.getFixedDriverCost());
        dto.setTotalFixedCost(entity.getTotalFixedCost());
        dto.setVariableCostPerKm(entity.getVariableCostPerKm());
        dto.setFranchiseKm(entity.getFranchiseKm());
        dto.setTotalMonthlyCost(entity.getTotalMonthlyCost());
        dto.setMonthlyPrice(entity.getMonthlyPrice());
        dto.setDailyRate(entity.getDailyRate());
        dto.setExcessKmRate(entity.getExcessKmRate());
        dto.setExtraTripRate(entity.getExtraTripRate());
        dto.setTaxesTotalPct(entity.getTaxesTotalPct());
        dto.setStatus(entity.getStatus());
        dto.setApprovedBy(entity.getApprovedBy());
        dto.setApprovedAt(entity.getApprovedAt());
        dto.setApprovalNotes(entity.getApprovalNotes());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
