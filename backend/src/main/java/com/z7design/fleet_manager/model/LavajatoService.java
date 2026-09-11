package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro de serviço de lavajato (lavagem de veículos).
 * <p>
 * Fluxo: operador registra o veículo -> checklist interno/externo ->
 * timer de execução -> ao finalizar, notifica motorista e/ou operacional.
 */
@Entity
@Table(name = "lavajato_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LavajatoService {

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
    private LavajatoStatus status;

    /** Checklist de limpeza interna (JSON). */
    @Column(name = "checklist_internal", columnDefinition = "TEXT")
    private String checklistInternal;

    /** Checklist de limpeza externa (JSON). */
    @Column(name = "checklist_external", columnDefinition = "TEXT")
    private String checklistExternal;

    /** Data/hora em que o serviço foi iniciado (operador clicou "Iniciar"). */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /** Data/hora em que o serviço foi finalizado. */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /** Duração total do serviço em segundos (calculado ao finalizar). */
    @Column(name = "duration_seconds")
    private Long durationSeconds;

    /** Observações gerais do operador. */
    @Column(columnDefinition = "TEXT")
    private String observations;

    /** Telefone do motorista para notificação WhatsApp. */
    @Column(name = "driver_phone", length = 20)
    private String driverPhone;

    /** ID do usuário do motorista (conta no sistema) para notificação interna. */
    @Column(name = "driver_user_id")
    private UUID driverUserId;

    /** Usuário operador que registrou o serviço. */
    @Column(name = "operator_id")
    private UUID operatorId;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum LavajatoStatus {
        PENDING("Pendente"),
        IN_PROGRESS("Em andamento"),
        COMPLETED("Finalizado");

        private final String displayName;

        LavajatoStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /** Calcula a duração do serviço em segundos. */
    public Long calculateDuration() {
        if (startedAt == null) return null;
        LocalDateTime end = completedAt != null ? completedAt : LocalDateTime.now();
        return Duration.between(startedAt, end).getSeconds();
    }
}
