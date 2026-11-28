package com.z7design.fleet_manager.model.email;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.UUID;

/** Cota de armazenamento de uma caixa de e-mail (tenant isolado). */
@Entity
@Table(name = "email_mailbox_quotas")
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailMailboxQuota {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "max_bytes", nullable = false)
    @Builder.Default
    private Long maxBytes = 1073741824L;

    @Column(name = "used_bytes", nullable = false)
    @Builder.Default
    private Long usedBytes = 0L;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    @PrePersist
    protected void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
