package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.CostSimulationStatus;
import com.z7design.fleet_manager.model.enums.VehicleCategory;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 1: Engenharia de Custos, Orçamento & Precificação Paramétrica.
 * Modelagem matemática do custo operacional e preço de venda sugerido para rotas,
 * em regimes de 1 a 3 turnos, calculando franquia, diária, km excedente e viagens extras.
 */
@Entity
@Table(name = "cost_simulations")
@Data
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class CostSimulation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_category", nullable = false, length = 50)
    private VehicleCategory vehicleCategory = VehicleCategory.BUS;

    /** Fator de utilização da mão de obra: 1 motorista no ADM, 2 ou 3 em regime de turno. */
    @Column(name = "driver_count", nullable = false)
    private Integer driverCount = 1;

    /** Dias no mês: 22, 26 ou 30 dias. */
    @Column(name = "operating_days", nullable = false)
    private Integer operatingDays = 22;

    /** Cotação atualizada do litro do Óleo Diesel (R$/litro). */
    @Column(name = "diesel_price", nullable = false, precision = 10, scale = 4)
    private BigDecimal dieselPrice;

    // ===== Mão de obra =====
    /** Piso salarial da CCT local. */
    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalary;

    /** Encargos sociais (60% a 85%). */
    @Column(name = "payroll_charges_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal payrollChargesPct = new BigDecimal("0.7000");

    /** Ticket alimentação (R$/mês por motorista). */
    @Column(name = "meal_allowance", nullable = false, precision = 15, scale = 2)
    private BigDecimal mealAllowance = BigDecimal.ZERO;

    /** Plano de saúde/odonto (R$/mês por motorista). */
    @Column(name = "health_plan_cost", nullable = false, precision = 15, scale = 2)
    private BigDecimal healthPlanCost = BigDecimal.ZERO;

    // ===== Parâmetros de KM =====
    /** Extensão do trajeto (KM diário). */
    @Column(name = "daily_km", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyKm;

    /** Margem de quilometragem improdutiva (adição técnica de 10% para vazios e garagem). */
    @Column(name = "productivity_factor", nullable = false, precision = 6, scale = 4)
    private BigDecimal productivityFactor = new BigDecimal("1.1000");

    @Column(name = "maintenance_per_km", precision = 10, scale = 4)
    private BigDecimal maintenancePerKm = BigDecimal.ZERO;

    @Column(name = "tires_per_km", precision = 10, scale = 4)
    private BigDecimal tiresPerKm = BigDecimal.ZERO;

    @Column(name = "lubricants_per_km", precision = 10, scale = 4)
    private BigDecimal lubricantsPerKm = BigDecimal.ZERO;

    @Column(name = "parts_per_km", precision = 10, scale = 4)
    private BigDecimal partsPerKm = BigDecimal.ZERO;

    /** Custos fixos adicionais mensais (depreciação, licenciamento, seguro, rastreador). */
    @Column(name = "fixed_costs", nullable = false, precision = 15, scale = 2)
    private BigDecimal fixedCosts = BigDecimal.ZERO;

    // ===== Tributos e margens =====
    @Column(name = "iss_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal issPct = new BigDecimal("0.0500");

    @Column(name = "icms_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal icmsPct = new BigDecimal("0.1044");

    @Column(name = "pis_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal pisPct = new BigDecimal("0.0065");

    @Column(name = "cofins_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal cofinsPct = new BigDecimal("0.0300");

    @Column(name = "irpj_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal irpjPct = new BigDecimal("0.0240");

    @Column(name = "csll_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal csllPct = new BigDecimal("0.0108");

    @Column(name = "profit_margin_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal profitMarginPct = new BigDecimal("0.1000");

    /** BDI sobre tarifas. */
    @Column(name = "bdi_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal bdiPct = BigDecimal.ZERO;

    /** Margem operacional da viagem extra (15% sobre a diária cheia). */
    @Column(name = "extra_trip_margin_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal extraTripMarginPct = new BigDecimal("0.1500");

    // ===== Resultados calculados (outputs) =====
    @Column(name = "fixed_driver_cost", precision = 15, scale = 2)
    private BigDecimal fixedDriverCost;

    @Column(name = "total_fixed_cost", precision = 15, scale = 2)
    private BigDecimal totalFixedCost;

    @Column(name = "variable_cost_per_km", precision = 10, scale = 4)
    private BigDecimal variableCostPerKm;

    /** KM Franquia Mensal = KM Produtiva × fator (padrão 1,10). */
    @Column(name = "franchise_km", precision = 12, scale = 2)
    private BigDecimal franchiseKm;

    @Column(name = "total_monthly_cost", precision = 15, scale = 2)
    private BigDecimal totalMonthlyCost;

    @Column(name = "monthly_price", precision = 15, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(name = "daily_rate", precision = 15, scale = 2)
    private BigDecimal dailyRate;

    @Column(name = "excess_km_rate", precision = 10, scale = 4)
    private BigDecimal excessKmRate;

    @Column(name = "extra_trip_rate", precision = 15, scale = 2)
    private BigDecimal extraTripRate;

    @Column(name = "taxes_total_pct", precision = 6, scale = 4)
    private BigDecimal taxesTotalPct;

    // ===== Gestão =====
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private CostSimulationStatus status = CostSimulationStatus.DRAFT;

    @Column(name = "approved_by", length = 255)
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
