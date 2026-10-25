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
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "vehicle_gate_checklists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class VehicleGateChecklist {

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
    @Column(name = "type", nullable = false, length = 20)
    private ChecklistType type;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "km_reading", nullable = false)
    private Integer kmReading;

    @Column(name = "initial_km")
    private Integer initialKm;

    @Column(name = "final_km")
    private Integer finalKm;

    @Column(name = "distance_travelled")
    private Integer distanceTravelled;

    @Column(name = "has_displacement")
    private Boolean hasDisplacement;

    @Column(name = "displacement_type", length = 100)
    private String displacementType;

    @Column(name = "displacement_initial_km")
    private Integer displacementInitialKm;

    @Column(name = "displacement_final_km")
    private Integer displacementFinalKm;

    @Column(name = "displacement_distance")
    private Integer displacementDistance;

    @Column(name = "total_km_travelled")
    private Integer totalKmTravelled;

    @Column(name = "odometer_photo_url", length = 500)
    private String odometerPhotoUrl;

    @Column(name = "odometer_photo_description", columnDefinition = "TEXT")
    private String odometerPhotoDescription;

    @Column(name = "checklist_data", columnDefinition = "TEXT")
    private String checklistData;

    @Column(name = "driver_problem_report", columnDefinition = "TEXT")
    private String driverProblemReport;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "vehicle_photos", columnDefinition = "TEXT")
    private String vehiclePhotos;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum ChecklistType {
        EXIT,
        ARRIVAL
    }
}
