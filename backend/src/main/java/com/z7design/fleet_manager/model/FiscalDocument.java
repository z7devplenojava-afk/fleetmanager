package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.FiscalDocumentStatus;
import com.z7design.fleet_manager.model.enums.FiscalDocumentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fiscal_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FiscalDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "doc_key", unique = true)
    private String key; // Chave de acesso 44 dígitos

    @Column(nullable = false)
    private String number; // Número documento

    @Column(nullable = false)
    private String series; // Série

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FiscalDocumentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FiscalDocumentStatus status;

    @Column(nullable = false)
    private LocalDateTime emissionDate;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private String issuerTaxId; // CNPJ Emissor

    @Column(nullable = false)
    private String issuerName; // Nome/Razão Social Emissor

    @Column
    private String recipientTaxId; // CNPJ Destinatário

    @Column
    private String xmlPath;

    @Column
    private String pdfPath;

    @Column
    private String notes;

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Company company;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null)
            status = FiscalDocumentStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
