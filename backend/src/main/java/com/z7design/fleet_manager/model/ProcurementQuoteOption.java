package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "procurement_quote_options")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProcurementQuoteOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comparison_id", nullable = false)
    @JsonIgnore
    private ProcurementQuoteComparison comparison;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "supplier_cnpj", length = 20)
    private String supplierCnpj;

    @Column(name = "supplier_contact", length = 100)
    private String supplierContact;

    @Column(name = "supplier_phone", length = 50)
    private String supplierPhone;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "payment_terms", nullable = false, length = 100)
    private String paymentTerms; // À VISTA, 30 DIAS, 30/60 DIAS, 30/60/90 DIAS

    @Column(name = "payment_term_days")
    @Builder.Default
    private Integer paymentTermDays = 0; // 0, 30, 60, 90

    @Column(name = "delivery_time_days", nullable = false)
    @Builder.Default
    private Integer deliveryTimeDays = 1;

    @Column(name = "shipping_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Column(name = "warranty_months")
    @Builder.Default
    private Integer warrantyMonths = 3;

    @Column(name = "is_winner")
    @Builder.Default
    private Boolean isWinner = false;

    @Column(name = "proposal_attachment_url", columnDefinition = "TEXT")
    private String proposalAttachmentUrl;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
