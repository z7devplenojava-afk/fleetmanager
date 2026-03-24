package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "trip_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripEventType type;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private Double latitude;
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum TripEventType {
        TRIP_START,
        TRIP_END,
        TRIP_PAUSE,
        TRIP_RESUME,
        BOARDING,
        BOARDING_DENIED_GEOFENCE,
        DEVIATION,
        BREAKDOWN,
        TRAFFIC_JAM,
        DRIVER_SWAP,
        VEHICLE_SWAP,
        OPERATIONAL_PAUSE
    }
}
