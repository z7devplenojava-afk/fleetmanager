package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "electronic_ctes")
@Data
@NoArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class ElectronicCte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "fiscal_document_id")
    private UUID fiscalDocumentId;

    @Column(nullable = false, length = 20)
    private String number;

    @Column(nullable = false, length = 10)
    private String series;

    @Column(name = "access_key", nullable = false, length = 44)
    private String accessKey;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "emission_date", nullable = false)
    private LocalDateTime emissionDate;

    @Column(nullable = false, length = 4)
    private String cfop;

    @Column(name = "nature_operation", nullable = false, length = 120)
    private String natureOperation;

    @Column(name = "service_taker", nullable = false, length = 20)
    private String serviceTaker;

    @Column(name = "issuer_name", nullable = false, length = 200)
    private String issuerName;

    @Column(name = "issuer_tax_id", nullable = false, length = 20)
    private String issuerTaxId;

    @Column(name = "issuer_address")
    private String issuerAddress;

    @Column(name = "issuer_city", length = 120)
    private String issuerCity;

    @Column(name = "issuer_state", length = 2)
    private String issuerState;

    @Column(name = "issuer_zip", length = 12)
    private String issuerZip;

    @Column(name = "issuer_phone", length = 30)
    private String issuerPhone;

    @Column(name = "issuer_email", length = 120)
    private String issuerEmail;

    @Column(name = "issuer_state_registration", length = 20)
    private String issuerStateRegistration;

    @Column(name = "sender_name", nullable = false, length = 200)
    private String senderName;

    @Column(name = "sender_tax_id", nullable = false, length = 20)
    private String senderTaxId;

    @Column(name = "sender_address")
    private String senderAddress;

    @Column(name = "sender_city", length = 120)
    private String senderCity;

    @Column(name = "sender_state", length = 2)
    private String senderState;

    @Column(name = "sender_zip", length = 12)
    private String senderZip;

    @Column(name = "sender_state_registration", length = 20)
    private String senderStateRegistration;

    @Column(name = "recipient_name", nullable = false, length = 200)
    private String recipientName;

    @Column(name = "recipient_tax_id", nullable = false, length = 20)
    private String recipientTaxId;

    @Column(name = "recipient_address")
    private String recipientAddress;

    @Column(name = "recipient_city", length = 120)
    private String recipientCity;

    @Column(name = "recipient_state", length = 2)
    private String recipientState;

    @Column(name = "recipient_zip", length = 12)
    private String recipientZip;

    @Column(name = "recipient_state_registration", length = 20)
    private String recipientStateRegistration;

    @Column(name = "origin_city", nullable = false, length = 120)
    private String originCity;

    @Column(name = "origin_state", nullable = false, length = 2)
    private String originState;

    @Column(name = "destination_city", nullable = false, length = 120)
    private String destinationCity;

    @Column(name = "destination_state", nullable = false, length = 2)
    private String destinationState;

    @Column(name = "vehicle_plate", length = 10)
    private String vehiclePlate;

    @Column(length = 20)
    private String rntrc;

    @Column(name = "cargo_description", nullable = false)
    private String cargoDescription;

    @Column(name = "cargo_weight", nullable = false, precision = 15, scale = 3)
    private BigDecimal cargoWeight;

    @Column(name = "cargo_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal cargoValue;

    @Column(name = "freight_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal freightValue;

    @Column(name = "icms_base", nullable = false, precision = 15, scale = 2)
    private BigDecimal icmsBase;

    @Column(name = "icms_rate", nullable = false, precision = 7, scale = 4)
    private BigDecimal icmsRate;

    @Column(name = "icms_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal icmsValue;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = "EMITIDO";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
