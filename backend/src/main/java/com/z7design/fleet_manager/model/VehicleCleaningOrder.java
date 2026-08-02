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

/**
 * Ordem de limpeza (interna e/ou externa) de um veículo.
 * <p>
 * Fluxo: o responsável cria a ordem -> o responsável pela limpeza executa o
 * checklist (interno/externo) com fotos por item -> ao finalizar, o sistema
 * notifica o motorista (notificação interna + WhatsApp quando o número estiver
 * configurado).
 */
@Entity
@Table(name = "vehicle_cleaning_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleCleaningOrder {

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
    @Column(nullable = false, length = 20)
    private CleaningStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "cleaning_type", nullable = false, length = 20)
    private CleaningType cleaningType;

    @Column(name = "checklist_data", columnDefinition = "TEXT")
    private String checklistData;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(name = "driver_phone", length = 20)
    private String driverPhone;

    /** Usuário do motorista (conta no sistema) para notificação interna. */
    @Column(name = "driver_user_id")
    private UUID driverUserId;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum CleaningStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED
    }

    public enum CleaningType {
        INTERNAL,
        EXTERNAL,
        COMPLETE
    }
}
