package com.z7design.fleet_manager.dto.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO que encapsula os dados extraídos do arquivo XML da NF-e para conferência prévia.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseInboundParsedXmlDTO {

    private String accessKey;
    private String documentNumber;
    private String series;
    private String supplierCnpj;
    private String supplierName;
    private LocalDate issueDate;
    private BigDecimal totalProductsValue;
    private BigDecimal totalInvoiceValue;

    @Builder.Default
    private List<ParsedItemDTO> items = new ArrayList<>();

    @Builder.Default
    private List<ParsedInstallmentDTO> installments = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParsedItemDTO {
        private String productCode;
        private String description;
        private String ncm;
        private String cfop;
        private String unitMeasure;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParsedInstallmentDTO {
        private Integer installmentNumber;
        private LocalDate dueDate;
        private BigDecimal amount;
        private String barcode;
    }
}
