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
    @Column(nullable = false)
    private FuelType fuelType;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Integer currentMileage;

    // Campos adicionais que estavam faltando
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
    private String photos; // URLs das fotos do veÃ­culo (separadas por vÃ­rgula)

    // Campo company_id
    @Column(name = "company_id")
    private UUID companyId;

    // Relacionamento com Company (opcional)
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

    public enum VehicleStatus {
        ACTIVE("Ativo"),
        INACTIVE("Inativo"),
        MAINTENANCE("Em ManutenÃ§Ã£o"),
        OUT_OF_SERVICE("Fora de ServiÃ§o"),
        RESERVED("Reservado");

        private final String displayName;

        VehicleStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum FuelType {
        GASOLINE("Gasolina"),
        ETHANOL("Etanol"),
        DIESEL("Diesel"),
        FLEX("Flex"),
        ELECTRIC("ElÃ©trico"),
        HYBRID("HÃ­brido"),
        CNG("GNV");

        private final String displayName;

        FuelType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
