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
@Table(name = "client_checklist_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientChecklistRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private ClientChecklistTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "km_reading")
    private Integer kmReading;

    @Column(columnDefinition = "TEXT")
    private String responses;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(name = "equipment_released")
    private Boolean equipmentReleased;

    @Column(name = "odometer_photo_url", length = 500)
    private String odometerPhotoUrl;

    @Column(name = "odometer_photo_description", columnDefinition = "TEXT")
    private String odometerPhotoDescription;

    @Column(name = "vehicle_photos", columnDefinition = "TEXT")
    private String vehiclePhotos;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Column(name = "inspector_signature", columnDefinition = "TEXT")
    private String inspectorSignature;

    @Column(name = "driver_signature", columnDefinition = "TEXT")
    private String driverSignature;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
