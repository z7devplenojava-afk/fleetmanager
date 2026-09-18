package com.z7design.fleet_manager.dto.procurement;

import com.z7design.fleet_manager.model.StockInvoiceEntry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockInvoiceEntryDTO {
    private UUID id;
    private UUID companyId;
    private UUID purchaseOrderId;
    private String ocNumber;
    private UUID requisitionId;
    private String requisitionNumber;
    private UUID workOrderId;
    private String workOrderNumber;
    private UUID stockItemId;
    private String stockItemName;
    private String stockItemCode;
    private String invoiceNumber;
    private String invoiceSeries;
    private String invoiceKey;
    private String supplierName;
    private String supplierCnpj;
    private LocalDate issueDate;
    private LocalDateTime entryDate;
    private BigDecimal quantityReceived;
    private BigDecimal unitCost;
    private BigDecimal totalInvoiceCost;
    private UUID receivedById;
    private String receivedByName;
    private StockInvoiceEntry.EntryType entryType;
    private Boolean isReleasedToWorkOrder;
    private Long leadTimeMinutes;
    private String formattedLeadTime;
    private String notes;
    private LocalDateTime createdAt;
}
