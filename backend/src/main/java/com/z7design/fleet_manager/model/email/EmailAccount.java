package com.z7design.fleet_manager.model.email;

import com.z7design.fleet_manager.converter.EmailCryptoConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Conta de e-mail conectada ao módulo de gestão de e-mails.
 * Guarda as credenciais IMAP/SMTP de forma criptografada e os metadados
 * da última sincronização.
 */
@Entity
@Table(name = "email_accounts", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "company_id", "email_address" },
                name = "uq_email_accounts_company_address")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class EmailAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "email_address", nullable = false)
    private String emailAddress;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "imap_host", nullable = false)
    private String imapHost;

    @Column(name = "imap_port", nullable = false)
    private Integer imapPort = 993;

    @Column(name = "imap_ssl", nullable = false)
    private Boolean imapSsl = true;

    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort = 587;

    @Column(name = "smtp_ssl", nullable = false)
    private Boolean smtpSsl = false;

    @Column(name = "username")
    private String username;

    @Convert(converter = EmailCryptoConverter.class)
    @Column(name = "password_encrypted", columnDefinition = "TEXT")
    private String password;

    @Column(name = "auth_type", length = 20)
    private String authType = "PASSWORD"; // 'password' | 'oauth2'

    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "last_sync_status", length = 30)
    private String lastSyncStatus;

    @Column(name = "last_sync_message", columnDefinition = "TEXT")
    private String lastSyncMessage;

    @Column(name = "last_sync_total")
    private Integer lastSyncTotal = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
