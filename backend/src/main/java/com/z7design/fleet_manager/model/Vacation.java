package com.z7design.fleet_manager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.model.enums.VacationType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "vacations")
public class Vacation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull(message = "Employee is required")
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference
    private Employee employee;
    
    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @NotNull(message = "Days taken is required")
    @Min(value = 0, message = "Days taken must be a positive value or zero")
    @Column(name = "days_taken", nullable = false)
    private Integer daysTaken;
    
    @NotNull(message = "Remaining days is required")
    @Min(value = 0, message = "Remaining days must be a positive value or zero")
    @Column(name = "remaining_days", nullable = false)
    private Integer remainingDays;
    
    @NotNull(message = "Vacation status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VacationStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "vacation_type")
    @Builder.Default
    private VacationType vacationType = VacationType.NORMAL;
    
    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;
    
    @Column(name = "approval_date")
    private LocalDate approvalDate;
    
    /** Periodo Aquisitivo do qual estes dias estao sendo consumidos (CLT Art. 129). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "periodo_aquisitivo_id")
    @JsonBackReference("periodo-aquisitivo-vacations")
    private PeriodoAquisitivo periodoAquisitivo;
    
    /** Vinculo quando esta solicitacao nasce de um evento de ferias coletivas (Art. 139/140). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ferias_coletivas_id")
    @JsonBackReference("ferias-coletivas-vacations")
    private FeriasColetivas feriasColetivas;
    
    /** Quem efetuou a solicitacao (colaborador via portal ou DP/gestor). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante_id")
    @JsonBackReference("solicitante-vacations")
    private Employee solicitante;
    
    /**
     * Blocos de gozo para fracionamento (Art. 134, §1º): ate 3 periodos,
     * sendo um deles >= 14 dias corridos e os demais >= 5 dias corridos.
     * Cada elemento: {"inicio":"2026-03-02","fim":"2026-03-15","dias":14}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "blocos", columnDefinition = "JSONB")
    private List<VacationBloco> blocos;
    
    /** Dias convertidos em abono pecuniario (Art. 143) - maximo 1/3 do saldo. */
    @Column(name = "dias_abono")
    @Builder.Default
    private Integer diasAbono = 0;
    
    /**
     * Dias excedentes ao saldo proporcional em ferias coletivas de colaborador
     * com menos de 12 meses, lançados como Licenca Remunerada (Secao 2.3 do PRD).
     */
    @Column(name = "dias_licenca_remunerada")
    @Builder.Default
    private Integer diasLicencaRemunerada = 0;
    
    /** Art. 145: pagamento ate 2 dias antes do inicio do gozo. */
    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;
    
    /** Motivo quando o status = REJECTED. */
    @Column(name = "motivo_rejeicao")
    private String motivoRejeicao;
    
    /** Observacoes livres do solicitante / DP. */
    @Column(name = "observacoes")
    private String observacoes;
    
    /** Quantidade de blocos de gozo (1 a 3). */
    @Column(name = "numero_blocos")
    @Builder.Default
    private Integer numeroBlocos = 1;
    
    /**
     * Fase 2: indica que os dias ja foram abatidos do saldo do PA.
     * Evita abate duplo (aprovacao + conclusao do gozo) e permite estorno
     * quando a solicitacao e rejeitada ou cancelada.
     */
    @Column(name = "saldo_abatido", nullable = false)
    @Builder.Default
    private Boolean saldoAbatido = false;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
} 
