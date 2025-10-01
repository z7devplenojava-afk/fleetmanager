package br.com.fleetmanager.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDTO {
    
    private UUID id;
    private String name;
    private String description;
    private String code;
    private String barcode;
    private String category;
    private String brand;
    private String model;
    private String unit;
    private BigDecimal costPrice;
    private BigDecimal salePrice;
    private BigDecimal currentStock;
    private BigDecimal minimumStock;
    private BigDecimal maximumStock;
    private BigDecimal reorderPoint;
    private String status;
    private String location;
    private String supplier;
    private String shelfLife;
    private BigDecimal weight;
    private String weightUnit;
    private String dimensions;
    private String storageConditions;
    private String notes;
    
    // Campos para variações de produtos
    private String size; // Tamanho (P, M, G, GG, 36, 37, 38, etc.)
    private String color; // Cor (Cinza, Preto, Branco, Azul, etc.)
    private String productType; // Tipo (Padrão, Social, Convencional, Nilon, Táticos, etc.)
    private String footwearSize; // Numeração para calçados (36, 37, 38, etc.)
    private String clothingSize; // Tamanho para roupas (P, M, G, GG, etc.)
    private String beltSize; // Tamanho para cintos (90, 95, 100, etc.)
    private String material; // Material (Algodão, Poliéster, Couro, etc.)
    private String style; // Estilo (Casual, Formal, Esportivo, etc.)
    private String gender; // Gênero (Masculino, Feminino, Unissex)
    private String season; // Estação (Verão, Inverno, Primavera, Outono, Todas)
    
    private UUID unitId;
    private String unitName;
    private LocalDateTime lastInventoryDate;
    private LocalDateTime nextInventoryDate;
    private LocalDateTime lastPurchaseDate;
    private LocalDateTime lastSaleDate;
    private BigDecimal averageConsumption;
    private String consumptionPeriod;
    private BigDecimal safetyStock;
    private BigDecimal leadTime;
    private String abcClassification;
    private BigDecimal turnoverRate;
    private BigDecimal daysOfInventory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Campos calculados
    private String stockStatus;
    private BigDecimal stockLevel;
    private boolean lowStock;
    private boolean overStock;
    private boolean needsReorder;
    private BigDecimal reorderQuantity;
}