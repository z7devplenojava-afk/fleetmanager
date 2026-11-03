package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalInvoiceDTO {

    private UUID id;
    private String number;

    private UUID clientId;
    private String clientName;
    private String clientCnpj;
    private String clientIe;
    private String clientAddress;
    private String clientCity;
    private String clientState;
    private String clientZipCode;

    private UUID contractId;
    private String contractNumber;

    private LocalDate issueDate;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private LocalDate dueDate;
    private LocalDate receiptDate;

    private String nfseNumber;
    private String nfseStatus;
    private LocalDateTime nfseIssueDate;
    private String nfsePdfUrl;
    private UUID receivableId;

    private BigDecimal totalAmount;
    private BigDecimal discount;
    private BigDecimal netAmount;

    private ReceivableStatus status;
    private String paymentMethod;
    private String bankName;
    private String bankAgency;
    private String bankAccount;
    private String notes;

    @Builder.Default
    private List<Item> items = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private UUID id;
        private UUID vehicleId;
        private String plate;
        private String model;
        private String description;
        private BigDecimal amount;
    }
}
