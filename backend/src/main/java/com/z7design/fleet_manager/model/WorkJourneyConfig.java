package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "work_journey_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkJourneyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "carga_horaria_diaria", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal cargaHorariaDiaria = new BigDecimal("8.00");

    @Column(name = "tolerancia_atraso_min", nullable = false)
    @Builder.Default
    private Integer toleranciaAtrasoMin = 10;

    @Column(name = "intervalo_min", nullable = false)
    @Builder.Default
    private Integer intervaloMin = 60;

    @Column(name = "percentual_he_normal", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percentualHENormal = new BigDecimal("50.00");

    @Column(name = "percentual_he_noturna", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percentualHENoturna = new BigDecimal("60.00");

    @Column(name = "percentual_he_100", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal percentualHE100 = new BigDecimal("100.00");

    @Column(name = "carga_horaria_semanal", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal cargaHorariaSemanal = new BigDecimal("44.00");

    @Column(name = "inicio_jornada_noturna", nullable = false)
    @Builder.Default
    private Integer inicioJornadaNoturna = 22;

    @Column(name = "fim_jornada_noturna", nullable = false)
    @Builder.Default
    private Integer fimJornadaNoturna = 5;

    @Column(name = "banco_horas_ativo", nullable = false)
    @Builder.Default
    private Boolean bancoHorasAtivo = false;

    @Column(name = "geo_obrigatoria", nullable = false)
    @Builder.Default
    private Boolean geoObrigatoria = false;

    @Column(name = "geo_raio_metros", nullable = false)
    @Builder.Default
    private Integer geoRaioMetros = 100;

    @Column(name = "ativo", nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
