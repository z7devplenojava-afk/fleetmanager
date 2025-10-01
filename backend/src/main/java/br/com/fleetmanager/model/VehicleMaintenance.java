package br.com.fleetmanager.model;

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
@Table(name = "vehicle_maintenances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleMaintenance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false)
    private MaintenanceType maintenanceType;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "cost", precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(name = "provider", length = 200)
    private String provider;

    @Column(name = "mileage", precision = 15, scale = 9)
    private BigDecimal mileage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MaintenanceStatus status = MaintenanceStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private MaintenancePriority priority = MaintenancePriority.MEDIUM;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Convert(converter = br.com.fleetmanager.util.StringListConverter.class)
    @Column(name = "photos", columnDefinition = "TEXT")
    private java.util.List<String> photos = new java.util.ArrayList<>();

    @Convert(converter = br.com.fleetmanager.util.StringListConverter.class)
    @Column(name = "documents", columnDefinition = "TEXT")
    private java.util.List<String> documents = new java.util.ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Enums
    public enum MaintenanceType {
        PREVENTIVE("Preventiva"),
        CORRECTIVE("Corretiva"),
        PREDICTIVE("Preditiva"),
        IMPROVEMENT("Melhoria"),
        OTHER("Outro");

        private final String displayName;

        MaintenanceType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum MaintenanceStatus {
        SCHEDULED("Agendada"),
        IN_PROGRESS("Em Andamento"),
        COMPLETED("Concluída"),
        CANCELLED("Cancelada");

        private final String displayName;

        MaintenanceStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum MaintenancePriority {
        LOW("Baixa"),
        MEDIUM("Média"),
        HIGH("Alta"),
        URGENT("Urgente");

        private final String displayName;

        MaintenancePriority(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
