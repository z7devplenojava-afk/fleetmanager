package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.EPICategory;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa os EPIs (Equipamentos de ProteÃ§Ã£o Individual)
 */
@Entity
@Table(name = "personal_protective_equipment")
public class PersonalProtectiveEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Nome do EPI Ã© obrigatÃ³rio")
    @Size(max = 100, message = "Nome deve ter no mÃ¡ximo 100 caracteres")
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Categoria do EPI Ã© obrigatÃ³ria")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EPICategory category;

    @Size(max = 50, message = "NÃºmero do CA deve ter no mÃ¡ximo 50 caracteres")
    @Column(name = "ca_number")
    private String caNumber;

    @Column(name = "ca_validity")
    private LocalDate caValidity;

    @Size(max = 100, message = "Fabricante deve ter no mÃ¡ximo 100 caracteres")
    private String manufacturer;

    @Size(max = 100, message = "Modelo deve ter no mÃ¡ximo 100 caracteres")
    private String model;

    @NotBlank(message = "Unidade de medida Ã© obrigatÃ³ria")
    @Size(max = 20, message = "Unidade de medida deve ter no mÃ¡ximo 20 caracteres")
    @Column(name = "unit_of_measurement", nullable = false)
    private String unitOfMeasurement = "UNIDADE";

    @NotNull(message = "Estoque mÃ­nimo Ã© obrigatÃ³rio")
    @Column(name = "minimum_stock", nullable = false)
    private Integer minimumStock = 0;

    @NotNull(message = "Estoque atual Ã© obrigatÃ³rio")
    @Column(name = "current_stock", nullable = false)
    private Integer currentStock = 0;

    @Column(name = "unit_cost", precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "validity_months")
    private Integer validityMonths = 6;

    @Column(name = "periodicity_days")
    private Integer periodicityDays = 180;

    @Column(nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Integer getValidityMonths() {
        return validityMonths;
    }

    public void setValidityMonths(Integer validityMonths) {
        this.validityMonths = validityMonths;
    }

    public Integer getPeriodicityDays() {
        return periodicityDays;
    }

    public void setPeriodicityDays(Integer periodicityDays) {
        this.periodicityDays = periodicityDays;
    }

    // Getters e Setters explícitos para resolver problemas de compilação com
    // Lombok
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public EPICategory getCategory() {
        return category;
    }

    public void setCategory(EPICategory category) {
        this.category = category;
    }

    public String getCaNumber() {
        return caNumber;
    }

    public void setCaNumber(String caNumber) {
        this.caNumber = caNumber;
    }

    public LocalDate getCaValidity() {
        return caValidity;
    }

    public void setCaValidity(LocalDate caValidity) {
        this.caValidity = caValidity;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getUnitOfMeasurement() {
        return unitOfMeasurement;
    }

    public void setUnitOfMeasurement(String unitOfMeasurement) {
        this.unitOfMeasurement = unitOfMeasurement;
    }

    public Integer getMinimumStock() {
        return minimumStock;
    }

    public void setMinimumStock(Integer minimumStock) {
        this.minimumStock = minimumStock;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Builder manual para resolver problemas de compilaÃ§Ã£o
    public static PersonalProtectiveEquipmentBuilder builder() {
        return new PersonalProtectiveEquipmentBuilder();
    }

    public static class PersonalProtectiveEquipmentBuilder {
        private PersonalProtectiveEquipment instance = new PersonalProtectiveEquipment();

        public PersonalProtectiveEquipmentBuilder id(UUID id) {
            instance.setId(id);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder name(String name) {
            instance.setName(name);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder description(String description) {
            instance.setDescription(description);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder category(EPICategory category) {
            instance.setCategory(category);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder caNumber(String caNumber) {
            instance.setCaNumber(caNumber);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder caValidity(LocalDate caValidity) {
            instance.setCaValidity(caValidity);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder manufacturer(String manufacturer) {
            instance.setManufacturer(manufacturer);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder model(String model) {
            instance.setModel(model);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder unitOfMeasurement(String unitOfMeasurement) {
            instance.setUnitOfMeasurement(unitOfMeasurement);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder minimumStock(Integer minimumStock) {
            instance.setMinimumStock(minimumStock);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder currentStock(Integer currentStock) {
            instance.setCurrentStock(currentStock);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder unitCost(BigDecimal unitCost) {
            instance.setUnitCost(unitCost);
            return this;
        }

        public PersonalProtectiveEquipmentBuilder isActive(Boolean isActive) {
            instance.setIsActive(isActive);
            return this;
        }

        public PersonalProtectiveEquipment build() {
            return instance;
        }
    }

    public PersonalProtectiveEquipment() {
    }

    public PersonalProtectiveEquipment(UUID id, String name, String description, EPICategory category, String caNumber,
            LocalDate caValidity, String manufacturer, String model, String unitOfMeasurement, Integer minimumStock,
            Integer currentStock, BigDecimal unitCost, Boolean isActive, LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
        this.caNumber = caNumber;
        this.caValidity = caValidity;
        this.manufacturer = manufacturer;
        this.model = model;
        this.unitOfMeasurement = unitOfMeasurement;
        this.minimumStock = minimumStock;
        this.currentStock = currentStock;
        this.unitCost = unitCost;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
