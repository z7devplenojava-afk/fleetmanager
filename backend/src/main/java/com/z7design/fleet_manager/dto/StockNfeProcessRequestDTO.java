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
public class StockNfeProcessRequestDTO {

    private String accessKey;
    private String invoiceNumber;
    private String series;
    private LocalDate issueDate;
    private BigDecimal totalAmount;

    // Fornecedor
    private String supplierCnpj;
    private String supplierName;
    private String supplierTradeName;
    private String supplierAddress;
    private String supplierCity;
    private String supplierState;
    private String supplierZipCode;
    private String supplierPhone;
    private String supplierEmail;
    private UUID supplierId;

    // Metadados de Boleto Bancário e NFS-e / Ordem de Serviço
    private String boletoAttachmentUrl;
    private String originalBoletoFileName;
    private boolean isNfse;
    private String workOrderId;
    private String workOrderNumber;

    // Configurações de processamento
    @Builder.Default
    private boolean createFinancialAccounts = true;

    @Builder.Default
    private boolean forceImport = false;

    @Builder.Default
    private List<ProcessItemDTO> items = new ArrayList<>();

    @Builder.Default
    private List<ProcessInstallmentDTO> installments = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProcessItemDTO {
        // Ação: "LINK_EXISTING" ou "CREATE_NEW"
        private String action;
        private UUID stockItemId;

        private String code;
        private String name;
        private StockCategory category;
        private String unitName;
        private UUID unitId;
        private String ncm;
        private String cst;
        private String cfop;
        private String unitMeasure;
        private BigDecimal quantity;
        private BigDecimal unitCost;
        private String description;
        private String barcode;
        private String caNumber;
        private Integer minimumQuantity;

        // Dados técnicos opcionais de pneus para entrada individualizada
        private String tireBrand;
        private String tireModel;
        private String tireSize;
        private String tireDot;
        private List<String> tireFireNumbers;
        private List<String> tireSerialNumbers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProcessInstallmentDTO {
        private Integer installmentNumber;
        private LocalDate dueDate;
        private BigDecimal amount;
        private String barcode;
        private String linhaDigitavel;
        private String boletoUrl;
        private String originalBoletoName;
        private String divergenceAlert;
        private String notes;
    }
}
