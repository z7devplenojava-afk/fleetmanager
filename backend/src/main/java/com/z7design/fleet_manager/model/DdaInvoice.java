package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "dda_invoices")
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class DdaInvoice implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "barcode", length = 255)
    private String barcode;

    @Column(name = "linha_digitavel", length = 255)
    private String linhaDigitavel;

    @Column(name = "issuer_cnpj", length = 20)
    private String issuerCnpj;

    @Column(name = "issuer_name", length = 255)
    private String issuerName;

    @Column(name = "payer_cnpj", length = 20)
    private String payerCnpj;

    @Column(name = "payer_name", length = 255)
    private String payerName;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "DETECTED"; // DETECTED, LINKED, PAID, DISCARDED

    @Column(name = "linked_invoice_id")
    private UUID linkedInvoiceId;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
