package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Viagem — representa uma definição de viagem no módulo de Gestão de Tráfego.
 * Pode ser do tipo FRETADO (tempo padrão) ou TURISTICO (tempo de execução maior).
 * Suporta até 4 "pegadas" (trechos/paradas da viagem).
 * Substitui o "Posto de Trabalho" no formulário de escala.
 */
@Entity
@Table(name = "travel_trips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Nome da viagem (ex: "BH → Betim Manhã", "Turismo Serra do Cipó") */
    @NotBlank(message = "Nome da viagem é obrigatório")
    @Column(nullable = false, length = 200)
    private String name;

    /** Código da viagem (gerado automaticamente) */
    @Column(unique = true, length = 20)
    private String code;

    /** Tipo da viagem */
    @NotNull(message = "Tipo da viagem é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripType tripType;

    /** Número de pegadas (trechos/paradas) — de 1 a 4 */
    @NotNull
    @Min(value = 1, message = "Mínimo de 1 pegada")
    @Max(value = 4, message = "Máximo de 4 pegadas")
    @Column(nullable = false)
    @Builder.Default
    private Integer legs = 1;

    /** Descrição da pegada 1 (obrigatória) */
    @Column(name = "leg1_description", length = 300)
    private String leg1Description;

    /** Descrição da pegada 2 (se houver) */
    @Column(name = "leg2_description", length = 300)
    private String leg2Description;

    /** Descrição da pegada 3 (se houver) */
    @Column(name = "leg3_description", length = 300)
    private String leg3Description;

    /** Descrição da pegada 4 (se houver) */
    @Column(name = "leg4_description", length = 300)
    private String leg4Description;

    /** Tempo estimado de execução total (calculado conforme tipo) */
    @Column(name = "estimated_duration")
    private Duration estimatedDuration;

    /** Fator multiplicador para turístico (ex: 1.5x mais tempo que fretado) */
    @Column(name = "duration_multiplier")
    @Builder.Default
    private Double durationMultiplier = 1.0;

    /** Distância total estimada em km */
    @Column(name = "distance_km")
    private Double distanceKm;

    /** Rota associada */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "points"})
    private Route route;

    /** Cliente associado */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Client client;

    /** Endereço de origem */
    @Column(name = "origin_address", length = 500)
    private String originAddress;

    /** Endereço de destino */
    @Column(name = "destination_address", length = 500)
    private String destinationAddress;

    /** Observações */
    @Column(length = 1000)
    private String observations;

    /** Status da viagem */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TravelTripStatus status = TravelTripStatus.ACTIVE;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ========================
    // Enums
    // ========================

    public enum TripType {
        FRETADO,        // Fretamento — tempo de execução padrão
        TURISTICO       // Turístico — tempo de execução maior (1.5x ou conforme config)
    }

    public enum TravelTripStatus {
        ACTIVE,
        INACTIVE,
        CANCELLED
    }
}
