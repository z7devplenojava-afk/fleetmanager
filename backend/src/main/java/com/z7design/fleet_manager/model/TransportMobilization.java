package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transport_mobilizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportMobilization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private MobilizationType type;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "km_reading")
    private Integer kmReading;

    @Column(name = "odometer_photo_url", length = 500)
    private String odometerPhotoUrl;

    @Column(name = "json_data", columnDefinition = "TEXT")
    private String jsonData;

    @Column(name = "damage_data", columnDefinition = "TEXT")
    private String damageData;

    @Column(name = "parts_request_data", columnDefinition = "TEXT")
    private String partsRequestData;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "photos", columnDefinition = "TEXT")
    private String photos;

    @Column(name = "company_id")
    private UUID companyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", length = 20)
    @Builder.Default
    private SyncStatus syncStatus = SyncStatus.SYNCED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum MobilizationType {
        GENERAL_INSPECTION,
        BUS_RAC02
    }

    public enum SyncStatus {
        PENDING,
        SYNCED
    }
}
