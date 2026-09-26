package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.StockCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockNfeParsedDTO {

    private String accessKey;
    private String invoiceNumber;
    private String series;
    private LocalDate issueDate;
    private BigDecimal totalProductsAmount;
    private BigDecimal totalInvoiceAmount;
    private BigDecimal shippingAmount;
    private BigDecimal discountAmount;

    // Emitente / Fornecedor
    private String supplierCnpj;
    private String supplierName;
    private String supplierTradeName;
    private String supplierAddress;
    private String supplierCity;
    private String supplierState;
    private String supplierZipCode;
    private UUID existingSupplierId;

    // Validação de Duplicidade
    private boolean alreadyImported;
    private String duplicateWarning;

    @Builder.Default
    private List<StockNfeItemDTO> items = new ArrayList<>();

    @Builder.Default
    private List<StockNfeInstallmentDTO> installments = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StockNfeItemDTO {
        private String productCode;
        private String barcode;
        private String description;
        private String ncm;
        private String cfop;
        private String unitOfMeasure;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;

        // Análise inteligente e vinculação de estoque
        private UUID matchedStockItemId;
        private String matchedStockItemCode;
        private String matchedStockItemName;
        private Integer matchedStockItemQuantity;
        private StockCategory suggestedCategory;
        private boolean isBattery;
        private boolean isTire;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StockNfeInstallmentDTO {
        private Integer installmentNumber;
        private LocalDate dueDate;
        private BigDecimal amount;
        private String barcode;
    }
}
