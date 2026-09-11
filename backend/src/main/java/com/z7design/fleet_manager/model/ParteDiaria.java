package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "parte_diaria")
@Data
@EqualsAndHashCode(callSuper = false)
public class ParteDiaria {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "number", nullable = false)
    private String number;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private MeasurementContract contract;

    @Column(name = "obra_name")
    private String obraName;

    @Column(name = "service_name")
    private String serviceName;

    @Column(name = "route_name")
    private String routeName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "vehicle_plate", nullable = false)
    private String vehiclePlate;

    @Column(name = "vehicle_model")
    private String vehicleModel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(name = "driver_name")
    private String driverName;

    @Column(name = "start_time")
    private String startTime;

    @Column(name = "end_time")
    private String endTime;

    @Column(name = "start_km", precision = 12, scale = 2)
    private BigDecimal startKm = BigDecimal.ZERO;

    @Column(name = "end_km", precision = 12, scale = 2)
    private BigDecimal endKm = BigDecimal.ZERO;

    @Column(name = "driven_km", precision = 12, scale = 2)
    private BigDecimal drivenKm = BigDecimal.ZERO;

    @Column(name = "disregarded_km", precision = 12, scale = 2)
    private BigDecimal disregardedKm = BigDecimal.ZERO;

    @Column(name = "considered_km", precision = 12, scale = 2)
    private BigDecimal consideredKm = BigDecimal.ZERO;

    @Column(name = "disregard_reason")
    private String disregardReason;

    @Column(name = "status")
    private String status = "LANÇADA";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private String createdBy;

    @OneToMany(mappedBy = "parteDiaria", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParteDiariaAtividade> atividades = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void calculateKms() {
        if (endKm != null && startKm != null && endKm.compareTo(startKm) >= 0) {
            this.drivenKm = endKm.subtract(startKm);
        } else {
            this.drivenKm = BigDecimal.ZERO;
        }
        BigDecimal dir = disregardedKm != null ? disregardedKm : BigDecimal.ZERO;
        this.consideredKm = drivenKm.subtract(dir);
        if (this.consideredKm.compareTo(BigDecimal.ZERO) < 0) {
            this.consideredKm = BigDecimal.ZERO;
        }
    }
}
