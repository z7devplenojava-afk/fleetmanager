package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_invoice_entries")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StockInvoiceEntry implements TenantAware {

    public enum EntryType {
        PURCHASE_ORDER,
        MANUAL_ENTRY,
        XML_IMPORT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "purchase_order_id")
    private UUID purchaseOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", insertable = false, updatable = false)
    private ProcurementPurchaseOrder purchaseOrder;

    @Column(name = "requisition_id")
    private UUID requisitionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", insertable = false, updatable = false)
    private MaterialRequisition requisition;

    @Column(name = "stock_item_id")
    private UUID stockItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_item_id", insertable = false, updatable = false)
    private StockItem stockItem;

    @Column(name = "invoice_number", nullable = false, length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_series", length = 20)
    private String invoiceSeries;

    @Column(name = "invoice_key", length = 100)
    private String invoiceKey;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "supplier_cnpj", length = 20)
    private String supplierCnpj;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "entry_date", nullable = false)
    @Builder.Default
    private LocalDateTime entryDate = LocalDateTime.now();

    @Column(name = "quantity_received", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal quantityReceived = BigDecimal.ONE;

    @Column(name = "unit_cost", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "total_invoice_cost", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalInvoiceCost = BigDecimal.ZERO;

    @Column(name = "received_by_id")
    private UUID receivedById;

    @Column(name = "received_by_name")
    private String receivedByName;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 50)
    @Builder.Default
    private EntryType entryType = EntryType.PURCHASE_ORDER;

    @Column(name = "is_released_to_work_order")
    @Builder.Default
    private Boolean isReleasedToWorkOrder = true;

    @Column(name = "lead_time_minutes")
    private Long leadTimeMinutes;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
