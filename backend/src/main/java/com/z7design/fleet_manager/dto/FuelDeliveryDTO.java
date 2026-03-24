package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class FuelDeliveryDTO {
    private UUID id;
    private LocalDate deliveryDate;
    private String invoiceNumber;
    private String supplier;
    private BigDecimal liters;
    private BigDecimal pricePerLiter;
    private BigDecimal totalPrice;
    private UUID fuelTankId;
    private String fuelTankName;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(LocalDate deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public BigDecimal getLiters() {
        return liters;
    }

    public void setLiters(BigDecimal liters) {
        this.liters = liters;
    }

    public BigDecimal getPricePerLiter() {
        return pricePerLiter;
    }

    public void setPricePerLiter(BigDecimal pricePerLiter) {
        this.pricePerLiter = pricePerLiter;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public UUID getFuelTankId() {
        return fuelTankId;
    }

    public void setFuelTankId(UUID fuelTankId) {
        this.fuelTankId = fuelTankId;
    }

    public String getFuelTankName() {
        return fuelTankName;
    }

    public void setFuelTankName(String fuelTankName) {
        this.fuelTankName = fuelTankName;
    }
}
