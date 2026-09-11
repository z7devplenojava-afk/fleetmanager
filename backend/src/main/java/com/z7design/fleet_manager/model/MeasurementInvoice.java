package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "measurement_invoices")
@Data
@EqualsAndHashCode(callSuper = false)
public class MeasurementInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id", nullable = false)
    private MeasurementBulletin bulletin;

    @Column(name = "invoice_type", nullable = false)
    private String invoiceType; // NFE, CTE

    @Column(name = "number", nullable = false)
    private String number;

    @Column(name = "series")
    private String series;

    @Column(name = "access_key")
    private String accessKey;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "issuer_name")
    private String issuerName;

    @Column(name = "status")
    private String status = "VINCULADO";

    @Column(name = "xml_url", columnDefinition = "TEXT")
    private String xmlUrl;

    @Column(name = "pdf_url", columnDefinition = "TEXT")
    private String pdfUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
