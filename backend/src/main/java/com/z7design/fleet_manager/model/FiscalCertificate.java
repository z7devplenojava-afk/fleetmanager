package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Certificado digital A1 (PKCS#12) usado na assinatura e no mTLS com a SEFIN Nacional.
 * O material sensível é persistido criptografado com AES-GCM (ver CertificateCrypto).
 */
@Entity
@Table(name = "fiscal_certificates")
@Data
@NoArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class FiscalCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(length = 120)
    private String alias;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(length = 500)
    private String subject;

    @Column(length = 14)
    private String cnpj;

    @Column(name = "serial_number", length = 120)
    private String serialNumber;

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "encrypted_pfx", nullable = false, columnDefinition = "BYTEA")
    private byte[] encryptedPfx;

    @Column(name = "pfx_iv", nullable = false, columnDefinition = "BYTEA")
    private byte[] pfxIv;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "encrypted_password", nullable = false, columnDefinition = "BYTEA")
    private byte[] encryptedPassword;

    @Column(name = "password_iv", nullable = false, columnDefinition = "BYTEA")
    private byte[] passwordIv;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean isExpired() {
        return validUntil != null && validUntil.isBefore(LocalDateTime.now());
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
