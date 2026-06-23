package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.BoardingStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "boardings")
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Boarding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "trip_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Trip trip; // Viagem associada

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "passenger_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Passenger passenger; // Passageiro

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "vehicle_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Vehicle vehicle; // Veículo

    @Column(name = "boarding_time")
    private LocalDateTime boardingTime; // Horário de embarque

    @Column(name = "boarding_latitude")
    private Double boardingLatitude; // Latitude do embarque

    @Column(name = "boarding_longitude")
    private Double boardingLongitude; // Longitude do embarque

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "boarding_point_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private RoutePoint boardingPoint; // Ponto de embarque

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BoardingStatus status; // Status: EMBARCADO, AUSENTE, JUSTIFICADO

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
