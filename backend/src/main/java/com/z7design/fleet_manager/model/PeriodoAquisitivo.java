package com.z7design.fleet_manager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.z7design.fleet_manager.model.enums.PeriodoAquisitivoOrigem;
import com.z7design.fleet_manager.model.enums.PeriodoAquisitivoStatus;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Periodo Aquisitivo de ferias - CLT Art. 129 a 137.
 *
 * - data_inicio / data_fim: 12 meses em que o colaborador adquire o direito (Art. 130).
 * - limite_concessivo: fim dos 12 meses seguintes em que o empregador DEVE conceder
 *   as ferias (Art. 134). Apos essa data o Art. 137 determina remuneracao em dobro.
 * - dias_direito: calculado pela tabela de faltas injustificadas do Art. 130.
 * - dias_saldo: dias ainda nao concedidos dentro do PA.
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "periodo_aquisitivo",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_periodo_aquisitivo_vigente",
        columnNames = { "employee_id", "data_inicio" }
    )
)
public class PeriodoAquisitivo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference("employee-periodos-aquisitivos")
    private Employee employee;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    @Column(name = "limite_concessivo", nullable = false)
    private LocalDate limiteConcessivo;

    /** Dias de direito do PA: 30, 24, 18, 12 ou 0 conforme faltas (Art. 130). */
    @Column(name = "dias_direito", nullable = false)
    @Builder.Default
    private Integer diasDireito = 30;

    /** Dias ainda disponiveis para concessao/liquidacao neste PA. */
    @Column(name = "dias_saldo", nullable = false)
    @Builder.Default
    private Integer diasSaldo = 30;

    @Column(name = "dias_utilizados", nullable = false)
    @Builder.Default
    private Integer diasUtilizados = 0;

    @Column(name = "faltas_injustificadas", nullable = false)
    @Builder.Default
    private Integer faltasInjustificadas = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PeriodoAquisitivoStatus status = PeriodoAquisitivoStatus.EM_ANDAMENTO;

    @Enumerated(EnumType.STRING)
    @Column(name = "origem", nullable = false, length = 20)
    @Builder.Default
    private PeriodoAquisitivoOrigem origem = PeriodoAquisitivoOrigem.ADMISSAO;

    @Column(name = "resetado_por_coletiva", nullable = false)
    @Builder.Default
    private Boolean resetadoPorColetiva = false;

    @Column(name = "observacoes")
    private String observacoes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
