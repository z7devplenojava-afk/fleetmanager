package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.WarehouseInboundStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Documento de Entrada (NF-e de compra e conferência operacional).
 */
@Entity
@Table(name = "warehouse_inbound_documents", uniqueConstraints = {
    @UniqueConstraint(name = "uk_wh_doc_key", columnNames = {"company_id", "access_key"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WarehouseInboundDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "document_number", nullable = false, length = 30)
    private String documentNumber; // Número da NF

    @Column(length = 10)
    private String series;

    @Column(name = "access_key", length = 44)
    private String accessKey; // Chave de 44 dígitos da NF-e

    @Column(name = "supplier_cnpj", nullable = false, length = 20)
    private String supplierCnpj;

    @Column(name = "supplier_name", nullable = false, length = 150)
    private String supplierName;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "arrival_date", nullable = false)
    @Builder.Default
    private LocalDateTime arrivalDate = LocalDateTime.now();

    @Column(name = "total_products_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalProductsValue = BigDecimal.ZERO;

    @Column(name = "total_invoice_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalInvoiceValue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private WarehouseInboundStatus status = WarehouseInboundStatus.RECEBIDA;

    @Column(name = "receiver_user_id", nullable = false)
    private UUID receiverUserId;

    @Column(name = "checked_user_id")
    private UUID checkedUserId;

    @Column(name = "checked_at")
    private LocalDateTime checkedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "inboundDocument", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<WarehouseInboundItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "inboundDocument", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<WarehouseInboundInstallment> installments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
