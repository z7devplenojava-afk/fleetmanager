package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.MeasurementCategory;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "measurement_items")
@Data
@EqualsAndHashCode(callSuper = false)
public class MeasurementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "item_number", nullable = false)
    private Integer itemNumber;

    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit", nullable = false)
    private String unit;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "total_value", precision = 15, scale = 2, insertable = false, updatable = false)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "cost_center_id")
    private String costCenterId;

    @Column(name = "cost_center_name")
    private String costCenterName;

    @Column(name = "vehicle_plate")
    private String vehiclePlate;

    @Column(name = "trip_count")
    private Integer tripCount = 0;

    @Column(name = "is_extra_trip")
    private Boolean isExtraTrip = false;

    @Column(name = "base_value", precision = 15, scale = 2)
    private BigDecimal baseValue = BigDecimal.ZERO;

    @Column(name = "working_days")
    private Integer workingDays = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private MeasurementCategory category = MeasurementCategory.OTHER;

    @Column(name = "initial_km", precision = 10, scale = 2)
    private BigDecimal initialKm;

    @Column(name = "final_km", precision = 10, scale = 2)
    private BigDecimal finalKm;

    @Column(name = "franchise_km", precision = 10, scale = 2)
    private BigDecimal franchiseKm;

    @Column(name = "disregarded_km", precision = 10, scale = 2)
    private BigDecimal disregardedKm;

    @Column(name = "diaria", precision = 15, scale = 2)
    private BigDecimal diaria = BigDecimal.ZERO;

    @Column(name = "km_considerado", precision = 10, scale = 2)
    private BigDecimal kmConsiderado;

    @Column(name = "km_excedido", precision = 10, scale = 2)
    private BigDecimal kmExcedido;

    @Column(name = "valor_km_excedido", precision = 15, scale = 2)
    private BigDecimal valorKmExcedido = BigDecimal.ZERO;

    @Column(name = "trip_date")
    private LocalDate tripDate;

    @Column(name = "route")
    private String route;

    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "observations", length = 500)
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id", nullable = false)
    private MeasurementBulletin bulletin;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // MÃ©todo para calcular valor total automaticamente
    public void calculateTotalValue() {
        this.totalValue = this.unitPrice.multiply(this.quantity);
    }

    // MÃ©todo para obter valor formatado em reais
    public String getFormattedUnitPrice() {
        return String.format("R$ %.2f", this.unitPrice);
    }

    public String getFormattedTotalValue() {
        return String.format("R$ %.2f", this.totalValue);
    }

    // MÃ©todo para obter quantidade formatada
    public String getFormattedQuantity() {
        return String.format("%.2f", this.quantity);
    }

    // MÃ©todo para obter nome do centro de custo
    public String getCostCenterDisplayName() {
        if (costCenterName != null && !costCenterName.trim().isEmpty()) {
            return costCenterName;
        }

        // Mapeamento padrÃ£o se nÃ£o houver nome personalizado
        switch (costCenterId) {
            case "1":
                return "Operacional";
            case "2":
                return "Comercial";
            case "3":
                return "RH";
            case "4":
                return "Financeiro";
            case "5":
                return "VigilÃ¢ncia";
            case "6":
                return "Portaria";
            case "7":
                return "Rondas";
            default:
                return "NÃ£o definido";
        }
    }

    // Removido @PrePersist e @PreUpdate para totalValue
    // A coluna total_value Ã© gerada automaticamente pelo banco de dados
    // O mÃ©todo calculateTotalValue() ainda pode ser usado para cÃ¡lculos em
    // memÃ³ria

    // Getters and Setters explicitly added to bypass Lombok issues
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Integer getItemNumber() {
        return itemNumber;
    }

    public void setItemNumber(Integer itemNumber) {
        this.itemNumber = itemNumber;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public MeasurementBulletin getBulletin() {
        return bulletin;
    }

    public void setBulletin(MeasurementBulletin bulletin) {
        this.bulletin = bulletin;
    }

    public BigDecimal getDiaria() {
        return diaria;
    }

    public void setDiaria(BigDecimal diaria) {
        this.diaria = diaria;
    }

    public BigDecimal getKmConsiderado() {
        return kmConsiderado;
    }

    public void setKmConsiderado(BigDecimal kmConsiderado) {
        this.kmConsiderado = kmConsiderado;
    }

    public BigDecimal getKmExcedido() {
        return kmExcedido;
    }

    public void setKmExcedido(BigDecimal kmExcedido) {
        this.kmExcedido = kmExcedido;
    }

    public BigDecimal getValorKmExcedido() {
        return valorKmExcedido;
    }

    public void setValorKmExcedido(BigDecimal valorKmExcedido) {
        this.valorKmExcedido = valorKmExcedido;
    }

    public LocalDate getTripDate() {
        return tripDate;
    }

    public void setTripDate(LocalDate tripDate) {
        this.tripDate = tripDate;
    }

    public String getRoute() {
        return route;
    }

    public void setRoute(String route) {
        this.route = route;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }
}
