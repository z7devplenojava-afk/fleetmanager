package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "boarding_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    private Employee passenger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "point_id", nullable = false)
    private RoutePoint point;

    @Column(nullable = false)
    private LocalDateTime boardingTime;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private Boolean geofenceValidated;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
