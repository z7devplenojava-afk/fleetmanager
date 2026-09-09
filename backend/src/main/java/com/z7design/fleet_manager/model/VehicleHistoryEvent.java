package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;
import com.z7design.fleet_manager.tenant.TenantEntityListener;

@Entity
@Table(name = "vehicle_history_events")
@EntityListeners(TenantEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class VehicleHistoryEvent implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "vehicle_plate")
    private String vehiclePlate;

    @Column(name = "event_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime eventDate;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "responsible_name")
    private String responsibleName;

    @Column(precision = 12, scale = 2)
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "cost_category")
    private String costCategory; // MANUTENCAO, PECAS, MAO_DE_OBRA, COMBUSTIVEL, COMPRAS, OUTROS

    @Column(name = "related_entity_type")
    private String relatedEntityType;

    @Column(name = "related_entity_id")
    private UUID relatedEntityId;

    @Column(name = "documents_urls", columnDefinition = "TEXT")
    private String documentsUrls;

    @Column(name = "evidences_urls", columnDefinition = "TEXT")
    private String evidencesUrls;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (eventDate == null) {
            eventDate = LocalDateTime.now();
        }
        createdAt = LocalDateTime.now();
    }
}
