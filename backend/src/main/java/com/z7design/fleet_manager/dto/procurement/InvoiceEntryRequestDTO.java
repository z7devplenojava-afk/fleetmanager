package com.z7design.fleet_manager.dto.procurement;

import com.z7design.fleet_manager.model.StockInvoiceEntry;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class InvoiceEntryRequestDTO {

    private UUID purchaseOrderId;
    private UUID requisitionId;
    private UUID stockItemId;

    @NotBlank(message = "Número da nota fiscal é obrigatório")
    private String invoiceNumber;

    private String invoiceSeries;
    private String invoiceKey;

    @NotBlank(message = "Nome do fornecedor é obrigatório")
    private String supplierName;

    private String supplierCnpj;
    private LocalDate issueDate;

    @NotNull(message = "Quantidade recebida é obrigatória")
    private BigDecimal quantityReceived;

    @NotNull(message = "Custo unitário é obrigatório")
    private BigDecimal unitCost;

    @NotNull(message = "Custo total da nota é obrigatório")
    private BigDecimal totalInvoiceCost;

    @Builder.Default
    private StockInvoiceEntry.EntryType entryType = StockInvoiceEntry.EntryType.PURCHASE_ORDER;

    @Builder.Default
    private Boolean releaseToWorkOrder = true;

    private String notes;
}
