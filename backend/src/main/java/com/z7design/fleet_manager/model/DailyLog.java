package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "daily_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "vehicle_plate", length = 20)
    private String vehiclePlate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(length = 100)
    private String route;

    @Column(length = 50)
    private String shift;

    @Column(name = "initial_km", nullable = false)
    private Integer initialKm;

    @Column(name = "final_km", nullable = false)
    private Integer finalKm;

    @Column(name = "total_km_run", nullable = false)
    private Integer totalKmRun;

    @Column(name = "discounted_km", nullable = false)
    private Integer discountedKm = 0;

    @Column(name = "considered_km", nullable = false)
    private Integer consideredKm;

    @Column(name = "allowance", nullable = false)
    private Integer allowance = 0;

    @Column(name = "excess_km", nullable = false)
    private Integer excessKm;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // PRD Módulo 3 (RF-03.5): vínculo da Parte Diária com a folha do talão
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private com.z7design.fleet_manager.model.DailyLogBook book;

    @Column(name = "book_sequential_number")
    private Integer bookSequentialNumber;

    // ===== PRD Módulo 5 (RF-05.1): estrutura obrigatória da Parte Diária =====
    /** Nome do motorista que realizou o percurso. */
    @Column(name = "driver_name", length = 255)
    private String driverName;

    /** Horário de início do percurso. */
    @Column(name = "start_time")
    private LocalDateTime startTime;

    /** Horário de término do percurso. */
    @Column(name = "end_time")
    private LocalDateTime endTime;

    /** Descrição detalhada da atividade (ex.: Ibirité x FM2C, Retorno Almoço). */
    @Column(name = "activity_description", columnDefinition = "TEXT")
    private String activityDescription;

    /** Assinatura do motorista. */
    @Column(name = "driver_signature", columnDefinition = "TEXT")
    private String driverSignature;

    @Column(name = "driver_signed_at")
    private LocalDateTime driverSignedAt;

    /** Assinatura do Representante/Fiscal da Contratante. */
    @Column(name = "inspector_signature", columnDefinition = "TEXT")
    private String inspectorSignature;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Column(name = "inspector_signed_at")
    private LocalDateTime inspectorSignedAt;

    // ===== PRD Módulo 5 (RF-05.2): conciliação com rastreamento satelital =====
    /** KM reportado pela telemetria/rastreador via satélite. */
    @Column(name = "telemetry_km")
    private Integer telemetryKm;

    @Column(name = "telemetry_diff_km")
    private Integer telemetryDiffKm;

    /** Divergência percentual (0.07 = 7%). */
    @Column(name = "telemetry_diff_pct", precision = 6, scale = 4)
    private java.math.BigDecimal telemetryDiffPct;

    @Enumerated(EnumType.STRING)
    @Column(name = "telemetry_status", length = 30)
    private com.z7design.fleet_manager.model.enums.TelemetryReconciliationStatus telemetryStatus =
            com.z7design.fleet_manager.model.enums.TelemetryReconciliationStatus.NOT_RECONCILED;

    @Column(name = "telemetry_imported_at")
    private LocalDateTime telemetryImportedAt;

    @Column(name = "telemetry_source", length = 100)
    private String telemetrySource;

    // ===== PRD Módulo 5 (RF-05.3): classificação automática de viagens extras =====
    @Column(name = "extra_trip", nullable = false)
    private Boolean extraTrip = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "extra_trip_reason", length = 50)
    private com.z7design.fleet_manager.model.enums.ExtraTripReason extraTripReason;

    @Column(name = "extra_trip_auto_classified", nullable = false)
    private Boolean extraTripAutoClassified = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void calculateMetrics() {
        if (initialKm != null && finalKm != null) {
            this.totalKmRun = Math.max(0, finalKm - initialKm);

            int discKm = (discountedKm != null) ? discountedKm : 0;
            this.consideredKm = Math.max(0, this.totalKmRun - discKm);

            int allow = (allowance != null) ? allowance : 0;
            this.excessKm = Math.max(0, this.consideredKm - allow);
        } else {
            this.totalKmRun = 0;
            this.consideredKm = 0;
            this.excessKm = 0;
        }

        if (vehicle != null && vehiclePlate == null) {
            this.vehiclePlate = vehicle.getPlate();
        }
    }
}
