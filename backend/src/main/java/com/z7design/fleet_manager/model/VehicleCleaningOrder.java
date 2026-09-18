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
 * Ordem de limpeza/higienização de um veículo com fluxo ponta a ponta:
 * <p>
 * 1. Solicitação por setor (Motorista, Gestor de Tráfego, Operacional, Manutenção)
 *    com prioridade e horário limite de liberação (deadline da viagem/escala).
 * 2. Triagem &amp; fila inteligente ordenada por prazo (SLA).
 * 3. Execução em fases: AGUARDANDO -> EXTERNA -> INTERNA -> INSPECAO -> LIBERADO.
 * 4. Inspeção de qualidade com checklist rápido (WC, bancos, vidros).
 * 5. Liberação final notifica o motorista (sino + WhatsApp) com vaga e horário.
 * <p>
 * SLA dinâmico: Previsão = Início + Tempo Padrão da Categoria + Margem de Inspeção (5 min).
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

    @Column(columnDefinition = "TEXT")
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

    /** Nome do usuário solicitante (desnormalizado para exibição rápida no Kanban). */
    @Column(name = "requested_by_name", length = 120)
    private String requestedByName;

    /** Setor solicitante: DRIVER, TRAFFIC, OPERATIONAL, MAINTENANCE. */
    @Enumerated(EnumType.STRING)
    @Column(name = "requester_sector", length = 20)
    private RequesterSector requesterSector;

    /** Prioridade: NORMAL, MEDIA, ALTA, URGENTE. */
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Priority priority;

    /** Fase operacional exibida no Kanban. */
    @Enumerated(EnumType.STRING)
    @Column(name = "phase", length = 20)
    private CleaningPhase phase;

    /** Horário limite de liberação (saída/escala do veículo). */
    @Column(name = "release_deadline")
    private LocalDateTime releaseDeadline;

    /** Previsão calculada de término: início + tempo padrão + margem de inspeção. */
    @Column(name = "estimated_completion")
    private LocalDateTime estimatedCompletion;

    /** Início efetivo da higienização. */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /** Fase atual em execução (EXTERNAL, INTERNAL) para retomada. */
    @Enumerated(EnumType.STRING)
    @Column(name = "current_phase", length = 20)
    private CleaningPhase currentPhase;

    /** Tempo padrão da categoria (minutos) capturado no início do serviço. */
    @Column(name = "standard_time_minutes")
    private Integer standardTimeMinutes;

    /** Indica que o alerta de risco de escala (20 min) já foi enviado. */
    @Column(name = "delay_alert_sent", nullable = false)
    @Builder.Default
    private Boolean delayAlertSent = false;

    /** Inspeção de qualidade aprovada antes da liberação. */
    @Column(name = "quality_approved")
    private Boolean qualityApproved;

    /** Quem realizou/aprovou a inspeção de qualidade. */
    @Column(name = "quality_inspected_by", length = 120)
    private String qualityInspectedBy;

    /** Quando a inspeção de qualidade foi aprovada. */
    @Column(name = "quality_inspected_at")
    private LocalDateTime qualityInspectedAt;

    /** Checklist rápido da inspeção de qualidade (WC, bancos, vidros) em JSON. */
    @Column(name = "quality_checklist", columnDefinition = "TEXT")
    private String qualityChecklist;

    /** Vaga de liberação no pátio (ex.: B-04) informada na liberação. */
    @Column(name = "release_spot", length = 20)
    private String releaseSpot;

    /** Momento da liberação final para viagem. */
    @Column(name = "released_at")
    private LocalDateTime releasedAt;

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

    /** Setor solicitante da limpeza e prioridade padrão de cada gatilho. */
    public enum RequesterSector {
        /** Motorista: pós-viagem / ocorrência interna. */
        DRIVER,
        /** Gestor de Tráfego: programação da escala / cliente VIP. */
        TRAFFIC,
        /** Operacional/Pátio: rotina de recolhimento. */
        OPERATIONAL,
        /** Manutenção: pós-serviço mecânico. */
        MAINTENANCE;

        /** Prioridade padrão por setor (tabela do fluxo). */
        public Priority defaultPriority() {
            return switch (this) {
                case DRIVER -> Priority.MEDIA;
                case TRAFFIC -> Priority.ALTA;
                case OPERATIONAL -> Priority.NORMAL;
                case MAINTENANCE -> Priority.MEDIA;
            };
        }
    }

    public enum Priority {
        NORMAL,
        MEDIA,
        ALTA,
        URGENTE
    }

    /**
     * Fases do Kanban:
     * 🟡 AGUARDANDO (fila de triagem) -> 🔵 EXTERNA (lavagem) ->
     * 🟣 INTERNA (higienização) -> 🔵 INSPECAO (checklist de qualidade) ->
     * 🟢 LIBERADO (pronto para viagem). 🔴 ATRASADO é derivado do SLA.
     */
    public enum CleaningPhase {
        AGUARDANDO,
        EXTERNA,
        INTERNA,
        INSPECAO,
        LIBERADO;

        /** Indica se a fase é de execução (atualiza currentPhase para retomada). */
        public boolean isExecutionPhase() {
            return this == EXTERNA || this == INTERNA;
        }
    }

    public enum CleaningStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED
    }

    public enum CleaningType {
        /** Apenas Externa (lavagem rápida ou chassi/rodas). */
        EXTERNAL,
        /** Apenas Interna (varrição, lixo, estofados, painel). */
        INTERNAL,
        /** Sanitário: descarte e reabastecimento químico. */
        SANITARY,
        /** Completa (interna + externa). */
        COMPLETE
    }

    /** Tempo padrão de execução por categoria (minutos), usado no SLA dinâmico. */
    public int standardTimeMinutes() {
        return switch (cleaningType) {
            case EXTERNAL -> 30;
            case INTERNAL -> 60;
            case SANITARY -> 20;
            case COMPLETE -> 90;
        };
    }

    /** Margem de inspeção (minutos) somada à previsão de término. */
    public static final int INSPECTION_MARGIN_MINUTES = 5;

    /** Janela (minutos) antes do deadline para o alerta preventivo de atraso. */
    public static final int DELAY_ALERT_WINDOW_MINUTES = 20;
}
