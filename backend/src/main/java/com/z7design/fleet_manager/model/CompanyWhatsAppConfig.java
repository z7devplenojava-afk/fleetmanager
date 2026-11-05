package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.WhatsAppProviderType;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
 * Configuracao de WhatsApp por empresa.
 *
 * <p>Quando nao existe linha para a empresa, o provedor global
 * {@code whatsapp.notifications.provider} e usado. O {@code sessionId}
 * permite que cada empresa use uma sessao diferente no AstraCalls.</p>
 */
@Entity
@Table(name = "company_whatsapp_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class CompanyWhatsAppConfig implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false, unique = true)
    private UUID companyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private WhatsAppProviderType provider = WhatsAppProviderType.ASTRACALLS;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /** Sessao do AstraCalls. Nulo usa a sessao global configurada. */
    @Column(name = "session_id", length = 120)
    private String sessionId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
