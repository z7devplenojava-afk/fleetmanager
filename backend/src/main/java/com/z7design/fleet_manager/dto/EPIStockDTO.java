package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO para representar EPI no formato de estoque esperado pelo frontend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EPIStockDTO {
    private UUID id;
    private String name;
    private String description;
    private String type; // HELMET, GLOVES, SAFETY_GLASSES, SAFETY_SHOES, UNIFORM, RESPIRATOR, OTHER
    private String brand; // Mapeado de manufacturer
    private String model;
    private String size;
    private String color;
    private String certification; // Mapeado de caNumber
    private String status; // ACTIVE, INACTIVE, MAINTENANCE, EXPIRED
    private Integer quantity; // Mapeado de currentStock
    private Integer availableQuantity; // Calculado: currentStock - assigned
    private BigDecimal unitPrice; // Mapeado de unitCost
    private String supplier; // Pode ser null ou mapeado de manufacturer
    private String purchaseDate; // ISO string format
    private String expiryDate; // ISO string format (mapeado de caValidity)
    private String lastMaintenanceDate;
    private String nextMaintenanceDate;
    private String location; // Pode ser null ou padrÃ£o
    private String notes;
    private String createdAt; // ISO string format
    private String updatedAt; // ISO string format
}

