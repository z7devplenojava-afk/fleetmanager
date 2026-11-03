package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.ReceivableStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Fatura de locação de veículos emitida para um cliente.
 * Os itens representam apenas os veículos locados (sem cessão de mão de obra).
 */
@Entity
@Table(name = "rental_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String number;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "contracts", "units", "workPosts", "measurementBulletins", "company", "password" })
    private Client client;

    @Column(name = "contract_id")
    private UUID contractId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "client" })
    private Contract contract;

    @Column(name = "contract_number", length = 50)
    private String contractNumber;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "client_cnpj", length = 30)
    private String clientCnpj;

    @Column(name = "client_ie", length = 50)
    private String clientIe;

    @Column(name = "client_address")
    private String clientAddress;

    @Column(name = "client_city", length = 120)
    private String clientCity;

    @Column(name = "client_state", length = 2)
    private String clientState;

    @Column(name = "client_zip_code", length = 20)
    private String clientZipCode;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "receipt_date")
    private LocalDate receiptDate;

    @Column(name = "nfse_number", length = 50)
    private String nfseNumber;

    @Column(name = "nfse_status", length = 30)
    private String nfseStatus;

    @Column(name = "nfse_issue_date")
    private LocalDateTime nfseIssueDate;

    @Column(name = "nfse_pdf_url", length = 500)
    private String nfsePdfUrl;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReceivableStatus status = ReceivableStatus.PENDING;

    @Column(name = "payment_method", length = 120)
    private String paymentMethod;

    @Column(name = "bank_name", length = 120)
    private String bankName;

    @Column(name = "bank_agency", length = 30)
    private String bankAgency;

    @Column(name = "bank_account", length = 60)
    private String bankAccount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @OneToMany(mappedBy = "rentalInvoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "rentalInvoice" })
    private List<RentalInvoiceVehicle> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addItem(RentalInvoiceVehicle item) {
        item.setRentalInvoice(this);
        this.items.add(item);
    }
}
