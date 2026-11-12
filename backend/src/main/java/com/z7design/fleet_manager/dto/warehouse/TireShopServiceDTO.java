package com.z7design.fleet_manager.dto.warehouse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TireShopServiceDTO {

    private UUID id;
    private UUID companyId;
    private String serviceNumber;

    private UUID catalogServiceId;
    private String serviceName;

    private UUID supplierId;
    private String supplierName;
    private String supplierCnpj;

    private UUID vehicleId;
    private String vehiclePlate;
    private String vehicleFleetNumber;

    private List<UUID> tireIds;
    private String tireLabelsSummary;

    private Integer quantity;
    private BigDecimal unitAmount;
    private BigDecimal totalAmount;

    private LocalDate serviceDate;
    private LocalDate dueDate;

    private String boletoUrl;
    private String boletoOriginalName;
    private String linhaDigitavel;
    private String barcode;

    private UUID invoiceId;
    private String invoiceNumber;
    private String invoiceStatus;
    private LocalDate invoiceDueDate;
    private LocalDate invoicePaymentDate;

    private String nfNumber;
    private String nfKey;
    private String nfUrl;
    private String nfOriginalName;

    private String beneficiaryName;
    private String beneficiaryCnpj;

    private Boolean generatePayable;
    private String notes;

    private String createdByName;
    private LocalDateTime createdAt;
}

