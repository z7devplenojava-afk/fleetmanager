package com.z7design.fleet_manager.model.kiosk;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.tenant.TenantAware;
import com.z7design.fleet_manager.tenant.TenantEntityListener;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "kiosk_devices")
@EntityListeners(TenantEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "(company_id = :companyId OR company_id IS NULL)")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class KioskDevice implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "client_id")
    private UUID clientId;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "client_id", insertable = false, updatable = false)
    private Client client;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "device_code", nullable = false, unique = true, length = 64)
    private String deviceCode;

    @Column(length = 50)
    @Builder.Default
    private String platform = "UNKNOWN";

    @Column(name = "platform_version", length = 50)
    private String platformVersion;

    @Column(name = "player_version", length = 50)
    private String playerVersion;

    @Column(name = "resolution_width")
    @Builder.Default
    private Integer resolutionWidth = 1080;

    @Column(name = "resolution_height")
    @Builder.Default
    private Integer resolutionHeight = 1920;

    @Column(length = 20)
    @Builder.Default
    private String orientation = "PORTRAIT";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING_PAIRING";

    @Column(name = "last_heartbeat_at")
    private LocalDateTime lastHeartbeatAt;

    @Column(name = "active_presentation_version_id")
    private UUID activePresentationVersionId;

    @Column(name = "desired_presentation_version_id")
    private UUID desiredPresentationVersionId;

    @Column(name = "paired_at")
    private LocalDateTime pairedAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

