package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Item constante na nota fiscal / documento de entrada com quantidade faturada vs conferida.
 */
@Entity
@Table(name = "warehouse_inbound_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WarehouseInboundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inbound_document_id", nullable = false)
    @JsonIgnore
    private WarehouseInboundDocument inboundDocument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private WarehouseProduct product;

    @Column(name = "product_code_invoice", nullable = false, length = 60)
    private String productCodeInvoice;

    @Column(name = "product_description_invoice", nullable = false, length = 150)
    private String productDescriptionInvoice;

    @Column(length = 10)
    private String ncm;

    @Column(name = "unit_measure", nullable = false, length = 10)
    private String unitMeasure;

    @Column(name = "quantity_invoiced", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityInvoiced;

    @Column(name = "quantity_checked", precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantityChecked = BigDecimal.ZERO;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "lot_number", length = 50)
    private String lotNumber;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
