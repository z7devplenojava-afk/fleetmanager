package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class Vehicle implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String plate;

    @Column(name = "fleet_number")
    private String fleetNumber;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private Integer year;

    @Column
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FuelType fuelType;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Integer currentMileage;

    @Column
    private Integer initialMileage;

    @Column
    private String assignedDriver;

    @Column(name = "responsible_employee_id")
    private UUID responsibleEmployeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_employee_id", insertable = false, updatable = false)
    private Employee responsibleEmployee;

    @Column
    private String department;

    @Column(name = "department_id")
    private UUID departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Department departmentEntity;

    @Column(name = "work_post_id")
    private UUID workPostId;

    @Column
    private String location;

    @Column
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate acquisitionDate;

    @Column
    private BigDecimal acquisitionValue;

    @Column
    private BigDecimal averageConsumption;

    @Column
    private BigDecimal averageCostPerKm;

    @Column
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastMaintenanceDate;

    @Column
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate nextMaintenanceDate;

    @Column
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate insuranceExpiryDate;

    @Column
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate documentationExpiryDate;

    @Column
    private String notes;

    @Column
    private String photos;

    // =====================================================================
    // CAMPOS DOCUMENTAIS (Chassi, RENAVAN)
    // =====================================================================
    @Column(name = "chassis_number")
    private String chassisNumber;

    @Column(name = "renavan")
    private String renavan;

    // =====================================================================
    // CAMPOS ESPECÍFICOS PARA ÔNIBUS / VAN
    // =====================================================================
    @Enumerated(EnumType.STRING)
    @Column(name = "bus_type")
    private BusType busType;

    @Column(name = "passenger_capacity")
    private Integer passengerCapacity;

    @Column(name = "standing_capacity")
    private Integer standingCapacity;

    @Column(name = "total_doors")
    private Integer totalDoors;

    @Column(name = "has_accessibility")
    private Boolean hasAccessibility;

    @Column(name = "has_air_conditioning")
    private Boolean hasAirConditioning;

    @Column(name = "has_wi_fi")
    private Boolean hasWiFi;

    @Column(name = "has_camera")
    private Boolean hasCamera;

    @Column(name = "has_cctv")
    private Boolean hasCctv;

    @Column(name = "bus_body_type")
    private String busBodyType;

    @Column(name = "chassis_brand")
    private String chassisBrand;

    @Column(name = "body_builder")
    private String bodyBuilder;

    @Column(name = "engine_model")
    private String engineModel;

    @Column(name = "engine_power_hp")
    private Integer enginePowerHp;

    @Column(name = "transmission_type")
    private String transmissionType;

    @Column(name = "axle_count")
    private Integer axleCount;

    @Column(name = "total_weight_kg")
    private Integer totalWeightKg;

    @Column(name = "payload_kg")
    private Integer payloadKg;

    @Column(name = "fuel_tank_capacity_liters")
    private Integer fuelTankCapacityLiters;

    @Column(name = "route_number")
    private String routeNumber;

    @Column(name = "route_name")
    private String routeName;

    // =====================================================================
    // CAMPOS DE FINANCIAMENTO
    // =====================================================================
    @Enumerated(EnumType.STRING)
    @Column(name = "financing_status")
    private FinancingStatus financingStatus;

    @Column(name = "financing_installment_value", precision = 12, scale = 2)
    private BigDecimal financingInstallmentValue;

    @Column(name = "financing_remaining_installments")
    private Integer financingRemainingInstallments;

    @Column(name = "financing_payoff_balance", precision = 14, scale = 2)
    private BigDecimal financingPayoffBalance;

    @Column(name = "financing_bank_or institution")
    private String financingBankOrInstitution;

    @Column(name = "financing_contract_number")
    private String financingContractNumber;

    @Column(name = "financing_start_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate financingStartDate;

    @Column(name = "financing_end_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate financingEndDate;

    // =====================================================================
    // CAMPOS DE VALOR DE MERCADO
    // =====================================================================
    @Column(name = "market_value", precision = 14, scale = 2)
    private BigDecimal marketValue;

    // =====================================================================
    // CAMPOS DE SEGURO
    // =====================================================================
    @Column(name = "insurance_policy_number")
    private String insurancePolicyNumber;

    @Column(name = "insurance_company")
    private String insuranceCompany;

    @Column(name = "insurance_premium_value", precision = 12, scale = 2)
    private BigDecimal insurancePremiumValue;

    @Column(name = "insurance_coverage_type")
    private String insuranceCoverageType;

    @Column(name = "insurance_second_policy_number")
    private String insuranceSecondPolicyNumber;

    @Column(name = "insurance_second_company")
    private String insuranceSecondCompany;

    @Column(name = "insurance_second_premium_value", precision = 12, scale = 2)
    private BigDecimal insuranceSecondPremiumValue;

    @Column(name = "insurance_second_expiry_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate insuranceSecondExpiryDate;

    // =====================================================================
    // CAMPOS DE CLIENTE / ALOCAÇÃO
    // =====================================================================
    @Column(name = "client_name")
    private String clientName;

    @Column(name = "client_id")
    private UUID clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Client clientEntity;

    @Column(name = "allocation_contract_number")
    private String allocationContractNumber;

    @Column(name = "allocation_start_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate allocationStartDate;

    @Column(name = "allocation_end_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate allocationEndDate;

    // =====================================================================
    // CAMPOS DE GESTÃO DE AGREGADO
    // =====================================================================
    @Column(name = "is_aggregated")
    private Boolean isAggregated;

    @Column(name = "aggregated_owner_name")
    private String aggregatedOwnerName;

    @Column(name = "aggregated_owner_cpf_cnpj")
    private String aggregatedOwnerCpfCnpj;

    @Column(name = "aggregated_owner_phone")
    private String aggregatedOwnerPhone;

    @Column(name = "aggregated_owner_email")
    private String aggregatedOwnerEmail;

    @Column(name = "aggregated_daily_rate", precision = 10, scale = 2)
    private BigDecimal aggregatedDailyRate;

    @Column(name = "aggregated_monthly_rate", precision = 12, scale = 2)
    private BigDecimal aggregatedMonthlyRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "aggregated_payment_type")
    private AggregatedPaymentType aggregatedPaymentType;

    @Column(name = "aggregated_contract_start_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate aggregatedContractStartDate;

    @Column(name = "aggregated_contract_end_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate aggregatedContractEndDate;

    @Column(name = "aggregated_notes")
    private String aggregatedNotes;

    // =====================================================================
    // CAMPOS DE DIFERENÇA (VALOR - FINANCIAMENTO)
    // =====================================================================
    @Column(name = "financial_difference", precision = 14, scale = 2)
    private BigDecimal financialDifference;

    // =====================================================================
    // COMPANY
    // =====================================================================
    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Company company;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // =====================================================================
    // ENUMS
    // =====================================================================

    public enum VehicleStatus {
        ACTIVE("Ativo"),
        INACTIVE("Inativo"),
        MAINTENANCE("Em Manutenção"),
        OUT_OF_SERVICE("Fora de Serviço"),
        RESERVED("Reservado"),
        LEASED("Alugado");

        private final String displayName;
        VehicleStatus(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    public enum FuelType {
        GASOLINE("Gasolina"),
        ETHANOL("Etanol"),
        DIESEL("Diesel"),
        FLEX("Flex"),
        ELECTRIC("Elétrico"),
        HYBRID("Híbrido"),
        CNG("GNV");

        private final String displayName;
        FuelType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    public enum VehicleType {
        BUS_ROAD("Ônibus Rodoviário"),
        BUS_LUXURY_TOURISM("Ônibus Luxo Turismo / Double Decker"),
        MINIBUS("Micro-ônibus"),
        VAN("Van"),
        BUS_URBAN("Ônibus Urbano"),
        CAR_UTILITY("Carro Utilitário"),
        CAR("Carro"),
        TRUCK("Caminhão"),
        MOTORCYCLE("Motocicleta"),
        PICKUP("Pickup"),
        SUV("SUV"),
        OTHER("Outro");

        private final String displayName;
        VehicleType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    public enum BusType {
        RODOVIARIO("Rodoviário"),
        LUXO_TURISMO("Luxo Turismo"),
        DOUBLE_DECKER("Double Decker"),
        URBANO("Urbano"),
        ARTICULADO("Articulado"),
        BIARTICULADO("Biarticulado"),
        MICRO_ONIBUS("Micro-ônibus"),
        PADRON("Padrão"),
        ELETRICO("Elétrico"),
        HIBRIDO("Híbrido"),
        ESCOLA("Escolar"),
        FRETADO("Fretado"),
        INTERMUNICIPAL("Intermunicipal");

        private final String displayName;
        BusType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    public enum FinancingStatus {
        OWNED("Próprio / Quitado"),
        FINANCED("Financiado"),
        LEASED("Alugado / Locação"),
        RENTED("Cedido / Empréstimo");

        private final String displayName;
        FinancingStatus(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    public enum AggregatedPaymentType {
        DAILY("Diário"),
        MONTHLY("Mensal"),
        PER_TRIP("Por Viagem"),
        PERCENTAGE("Percentual sobre Faturamento");

        private final String displayName;
        AggregatedPaymentType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }
}
