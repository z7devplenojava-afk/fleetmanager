package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;

@Data
@Entity
@Table(name = "routes")
@JsonIgnoreProperties(ignoreUnknown = true)
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class Route implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Company company;

    @Column(unique = true)
    private String code;

    @NotBlank(message = "Route name is required")
    @Size(min = 3, max = 100, message = "Route name must be between 3 and 100 characters")
    @Column(nullable = false)
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column(length = 500)
    private String description;

    @ManyToOne
    @JoinColumn(name = "unit_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Unit unit;

    @ManyToOne
    @JoinColumn(name = "location_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Location location;

    @Column(name = "estimated_duration")
    private Duration estimatedDuration;

    @Column(name = "checkpoints_required", nullable = false)
    private boolean checkpointsRequired;

    @Column(name = "geofence_enabled", nullable = false)
    private boolean geofenceEnabled = false;

    @Column(name = "default_radius_meters")
    private Integer defaultRadiusMeters = 50;

    // Campos estendidos para CEP, endereço, turno, etc.
    @Column(name = "origin_cep", length = 10)
    private String originCep;

    @Column(name = "origin_address", length = 500)
    private String originAddress;

    @Column(name = "destination_cep", length = 10)
    private String destinationCep;

    @Column(name = "destination_address", length = 500)
    private String destinationAddress;

    @Column(name = "shift", length = 50)
    private String shift;

    @Column(name = "execution_time", length = 10)
    private String executionTime;

    @Column(name = "distance_km")
    private Double distanceKm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Client client;

    /** Horário programado de início da operação da rota */
    @Column(name = "scheduled_start_time")
    private LocalTime scheduledStartTime;

    /** Horário programado de término da operação */
    @Column(name = "scheduled_end_time")
    private LocalTime scheduledEndTime;

    /** Coordenadas da garagem/base de partida */
    @Column(name = "garage_latitude")
    private Double garageLatitude;

    @Column(name = "garage_longitude")
    private Double garageLongitude;

    @Column(name = "garage_name", length = 200)
    private String garageName;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("order ASC")
    @JsonManagedReference("route-points")
    private List<RoutePoint> points;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
