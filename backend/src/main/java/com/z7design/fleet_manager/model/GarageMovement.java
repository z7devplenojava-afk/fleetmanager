package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Movimentação de veículo entre garagens (remanejamento) ou entrada/saída de pátio.
 * <p>
 * Cada transferência entre garagens gera um registro com origem, destino, quem
 * solicitou/executou e o motivo — formando o histórico de movimentações do pátio.
 * Entradas sem origem representam o primeiro recolhimento do veículo.
 */
@Entity
@Table(name = "garage_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class GarageMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    /** Placa do veículo (desnormalizada para listagens). */
    @Column(name = "vehicle_plate", length = 20)
    private String vehiclePlate;

    /** Garagem de origem (null = primeira entrada no pátio). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_garage_id")
    private Garage fromGarage;

    /** Nome da garagem de origem (desnormalizado). */
    @Column(name = "from_garage_name", length = 150)
    private String fromGarageName;

    /** Garagem de destino. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_garage_id", nullable = false)
    private Garage toGarage;

    /** Nome da garagem de destino (desnormalizado). */
    @Column(name = "to_garage_name", length = 150)
    private String toGarageName;

    /** Motivo: REMANEJAMENTO, MANUTENCAO, LIMPEZA, OPERACAO, ESCALA, OUTROS. */
    @Column(name = "reason", length = 30)
    private String reason;

    /** Detalhe livre do motivo. */
    @Column(name = "reason_detail", length = 500)
    private String reasonDetail;

    /** Usuário que solicitou/executou a movimentação. */
    @Column(name = "performed_by")
    private UUID performedBy;

    /** Nome do usuário (desnormalizado). */
    @Column(name = "performed_by_name", length = 120)
    private String performedByName;

    /** KM do veículo no momento da movimentação (opcional). */
    @Column(name = "km_reading")
    private Integer kmReading;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Reason {
        REMANEJAMENTO,
        MANUTENCAO,
        LIMPEZA,
        OPERACAO,
        ESCALA,
        OUTROS
    }
}
