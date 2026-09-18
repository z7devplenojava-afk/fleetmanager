package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "procurement_purchase_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProcurementPurchaseOrder implements TenantAware {

    public enum PurchaseOrderStatus {
        PENDING_FINANCIAL_APPROVAL, // Aguardando aprovação/pagamento do financeiro
        FINANCIAL_APPROVED,         // Aprovado pelo financeiro
        PURCHASED_IN_TRANSIT,       // Compra realizada, em trânsito
        DELIVERED_IN_ALMOXARIFADO,  // Entregue no almoxarifado (NF-e lançada)
        CANCELLED                   // Cancelada
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "oc_number", nullable = false, length = 50)
    private String ocNumber;

    @Column(name = "requisition_id", nullable = false)
    private UUID requisitionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", insertable = false, updatable = false)
    private MaterialRequisition requisition;

    @Column(name = "comparison_id")
    private UUID comparisonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comparison_id", insertable = false, updatable = false)
    private ProcurementQuoteComparison comparison;

    @Column(name = "winning_quote_option_id")
    private UUID winningQuoteOptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winning_quote_option_id", insertable = false, updatable = false)
    private ProcurementQuoteOption winningQuoteOption;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "supplier_cnpj", length = 20)
    private String supplierCnpj;

    @Column(name = "supplier_contact", length = 100)
    private String supplierContact;

    @Column(name = "supplier_phone", length = 50)
    private String supplierPhone;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "item_code", length = 100)
    private String itemCode;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_terms", nullable = false, length = 100)
    private String paymentTerms;

    @Column(name = "delivery_estimated_date")
    private LocalDate deliveryEstimatedDate;

    @Column(name = "urgency", nullable = false, length = 30)
    @Builder.Default
    private String urgency = "NORMAL";

    @Column(name = "justification", nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    @Builder.Default
    private PurchaseOrderStatus status = PurchaseOrderStatus.PENDING_FINANCIAL_APPROVAL;

    @Column(name = "financial_approved_by_id")
    private UUID financialApprovedById;

    @Column(name = "financial_approved_by_name")
    private String financialApprovedByName;

    @Column(name = "financial_approved_at")
    private LocalDateTime financialApprovedAt;

    @Column(name = "financial_notes", columnDefinition = "TEXT")
    private String financialNotes;

    // Campos de Programação Financeira e Cartão de Crédito
    @Column(name = "payment_method", length = 50)
    private String paymentMethod; // CARTAO_CREDITO, CARTAO_DEBITO, BOLETO, PIX, TRANSFERENCIA, DINHEIRO

    @Column(name = "installments_count")
    @Builder.Default
    private Integer installmentsCount = 1;

    @Column(name = "card_number", length = 100)
    private String cardNumber; // Ex: Final 4821 - Cartão Corporativo Bradesco

    @Column(name = "card_flag", length = 50)
    private String cardFlag; // MASTERCARD, VISA, ELO, AMEX

    @Column(name = "payment_reference", length = 255)
    private String paymentReference; // Chave PIX, NSU/Autorização, Banco/Agência/Conta

    @Column(name = "payment_scheduled_date")
    private LocalDate paymentScheduledDate;

    @Column(name = "payment_due_date")
    private LocalDate paymentDueDate;

    @Column(name = "payment_status", length = 50)
    @Builder.Default
    private String paymentStatus = "PENDING_PROGRAMMING"; // PENDING_PROGRAMMING, PROGRAMMED, PAID, CANCELLED

    @Column(name = "installment_details", columnDefinition = "TEXT")
    private String installmentDetails; // JSON com detalhamento das parcelas

    @Column(name = "financial_programmed_by_id")
    private UUID financialProgrammedById;

    @Column(name = "financial_programmed_by_name")
    private String financialProgrammedByName;

    @Column(name = "financial_programmed_at")
    private LocalDateTime financialProgrammedAt;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_key", length = 100)
    private String invoiceKey;

    @Column(name = "invoice_received_at")
    private LocalDateTime invoiceReceivedAt;

    @Column(name = "created_by_id")
    private UUID createdById;

    @Column(name = "created_by_name")
    private String createdByName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
