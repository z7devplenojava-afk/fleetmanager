package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tire_shop_services")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TireShopServiceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "service_number", nullable = false, length = 40)
    private String serviceNumber;

    @Column(name = "catalog_service_id")
    private UUID catalogServiceId;

    @Column(name = "service_name", nullable = false, length = 200)
    private String serviceName;

    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    @Column(name = "supplier_name", length = 200)
    private String supplierName;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "tire_ids_json", columnDefinition = "TEXT")
    private String tireIdsJson;

    @Column(name = "tire_labels_summary", length = 500)
    private String tireLabelsSummary;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;

    @Builder.Default
    @Column(name = "unit_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "boleto_url", columnDefinition = "TEXT")
    private String boletoUrl;

    @Column(name = "boleto_original_name", length = 255)
    private String boletoOriginalName;

    @Column(name = "linha_digitavel", length = 100)
    private String linhaDigitavel;

    @Column(length = 255)
    private String barcode;

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "invoice_number", length = 60)
    private String invoiceNumber;

    @Column(name = "nf_number", length = 60)
    private String nfNumber;

    @Column(name = "nf_key", length = 100)
    private String nfKey;

    @Column(name = "nf_url", columnDefinition = "TEXT")
    private String nfUrl;

    @Column(name = "nf_original_name", length = 255)
    private String nfOriginalName;

    @Column(name = "beneficiary_name", length = 200)
    private String beneficiaryName;

    @Column(name = "beneficiary_cnpj", length = 30)
    private String beneficiaryCnpj;

    @Builder.Default
    @Column(name = "generate_payable", nullable = false)
    private Boolean generatePayable = Boolean.TRUE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    @Column(name = "created_by_name", length = 150)
    private String createdByName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (quantity == null || quantity < 1) quantity = 1;
        if (unitAmount == null) unitAmount = BigDecimal.ZERO;
        if (totalAmount == null) totalAmount = BigDecimal.ZERO;
        if (generatePayable == null) generatePayable = Boolean.TRUE;
        if (serviceDate == null) serviceDate = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

