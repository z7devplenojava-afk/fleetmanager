package com.z7design.fleet_manager.model.email;

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
 * Pasta espelhada do servidor IMAP (INBOX, Sent, Drafts, custom folders...).
 * O par (account_id, remote_name) é único - remote_name é o path completo
 * retornado pelo comando LIST do servidor.
 */
@Entity
@Table(name = "email_folders", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "account_id", "remote_name" },
                name = "uq_email_folders_account_remote")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class EmailFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EmailAccount account;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "remote_name", nullable = false)
    private String remoteName;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "delimiter", length = 10)
    private String delimiter;

    @Column(name = "attributes", length = 200)
    private String attributes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private EmailFolder parent;

    @Column(name = "uid_validity")
    private Long uidValidity;

    @Column(name = "highest_uid")
    private Long highestUid = 0L;

    @Column(name = "total_messages")
    private Integer totalMessages = 0;

    @Column(name = "is_system")
    private Boolean system = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
