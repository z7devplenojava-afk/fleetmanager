package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.z7design.fleet_manager.tenant.TenantAware;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "fleet_work_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class FleetWorkOrder implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Número sequencial legível da OS, ex: OS-001042 */
    @Column(name = "os_number", length = 50)
    private String osNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private MaintenancePlan plan;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false, length = 30)
    @Builder.Default
    private MaintenanceType maintenanceType = MaintenanceType.CORRETIVA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WorkOrderStatus status = WorkOrderStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WorkOrderPriority priority = WorkOrderPriority.MEDIUM;

    @Column(name = "mechanic_id")
    private UUID mechanicId;

    /** Nome livre do mecânico/prestador (complementa mechanicId) */
    @Column(name = "mechanic_name", length = 255)
    private String mechanicName;

    @Enumerated(EnumType.STRING)
    @Column(name = "labor_type")
    private LaborType laborType;

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    /** Data real de entrada na oficina */
    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "completion_date")
    private LocalDateTime completionDate;

    // ── Campos PRD OS: Parada e Saída ──────────────────────────────
    @Column(name = "stop_date")
    private LocalDate stopDate;

    @Column(name = "stop_time", length = 10)
    private String stopTime;

    @Column(name = "exit_date")
    private LocalDate exitDate;

    @Column(name = "exit_time", length = 10)
    private String exitTime;

    @Column(name = "aggregate_info", length = 100)
    private String aggregateInfo;

    // ── Campos PRD OS: Descrições ──────────────────────────────────
    @Column(name = "anomalies_description", columnDefinition = "TEXT")
    private String anomaliesDescription;

    @Column(name = "other_description", columnDefinition = "TEXT")
    private String otherDescription;

    @Column(name = "maintenance_performed", columnDefinition = "TEXT")
    private String maintenancePerformed;

    // ── Envolvidos PRD OS ──────────────────────────────────────────
    /**
     * Obra (Posto) em que o veículo está alocado no momento da OS.
     * Resolvida automaticamente a partir de vehicle.workPostId quando não informada.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_post_id")
    private WorkPost workPost;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "sector_id")
    private UUID sectorId;

    @Column(name = "requester_id")
    private UUID requesterId;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "supervisor_id")
    private UUID supervisorId;

    // ── Assinaturas PRD OS ──────────────────────────────────────────
    @Column(name = "responsible_signature", columnDefinition = "TEXT")
    private String responsibleSignature;

    @Column(name = "responsible_signature_date")
    private LocalDateTime responsibleSignatureDate;

    @Column(name = "supervisor_signature", columnDefinition = "TEXT")
    private String supervisorSignature;

    @Column(name = "supervisor_signature_date")
    private LocalDateTime supervisorSignatureDate;

    // ── Odômetro ──────────────────────────────────────────────
    /** Quilometragem do veículo na entrada da OS */
    @Column(name = "odometer_in")
    private Integer odometerIn;

    /** Quilometragem do veículo na saída (após manutenção) */
    @Column(name = "odometer_out")
    private Integer odometerOut;

    // ── Motivo da parada ─────────────────────────────────────
    /** Descrição do motivo pelo qual o veículo foi parado */
    @Column(name = "stop_reason", columnDefinition = "TEXT")
    private String stopReason;

    // ── Custos ───────────────────────────────────────────────
    @Column(name = "labor_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal laborCost = BigDecimal.ZERO;

    @Column(name = "parts_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal partsCost = BigDecimal.ZERO;

    @Column(name = "total_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkOrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FleetWorkOrderChecklist> checklistItems = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "fleet_work_order_photos", joinColumns = @JoinColumn(name = "work_order_id"))
    @Column(name = "photo_url")
    @Builder.Default
    private List<String> photoAttachments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** Soft-delete — RN10: OS concluída não pode ser deletada fisicamente */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "company_id")
    private UUID companyId;

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Calcula o tempo total de parada em HORAS entre startDate e completionDate.
     * Se ainda estiver em andamento, usa o momento atual.
     */
    public Long getDowntimeHours() {
        if (startDate == null) return null;
        LocalDateTime end = (completionDate != null) ? completionDate : LocalDateTime.now();
        return ChronoUnit.HOURS.between(startDate, end);
    }

    /**
     * Tempo de parada em dias (arredondado para cima).
     */
    public Long getDowntimeDays() {
        Long hours = getDowntimeHours();
        if (hours == null) return null;
        return (long) Math.ceil(hours / 24.0);
    }

    // ── Enums ─────────────────────────────────────────────────

    public enum MaintenanceType {
        CORRETIVA, PREVENTIVA, PREDITIVA, INSPECAO, LUBRIFICACAO, OUTROS
    }

    public enum WorkOrderStatus {
        OPEN, DRAFT, PENDING_APPROVAL, APPROVED, IN_PROGRESS, WAITING_PARTS, COMPLETED, CANCELLED
    }

    public enum WorkOrderPriority {
        LOW, MEDIUM, HIGH, URGENT
    }

    public enum LaborType {
        INTERNAL, EXTERNAL
    }
}
