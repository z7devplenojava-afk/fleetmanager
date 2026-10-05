package com.z7design.fleet_manager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ferias Coletivas - CLT Art. 139 e 140.
 *
 * Regras ligadas (RF-04 / Secao 2.3 do PRD):
 * - Empregados com menos de 12 meses gozam ferias proporcionais (2,5 dias/mes).
 * - Dias excedentes ao saldo proporcional sao lancados como Licenca Remunerada.
 * - Apos o gozo, para quem tem menos de 12 meses, inicia-se um NOVO PA
 *   a partir do primeiro dia das ferias coletivas.
 * - Colaboradora em licenca-maternidade nao e atingida; saldo permanece intacto.
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "ferias_coletivas")
public class FeriasColetivas {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "titulo", nullable = false, length = 100)
    private String titulo;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    @Column(name = "dias_duracao", nullable = false)
    private Integer diasDuracao;

    @Column(name = "abrange_toda_empresa", nullable = false)
    @Builder.Default
    private Boolean abrangeTodaEmpresa = true;

    /** IDs de departamentos abrangidos quando abrangeTodaEmpresa = false. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "departamento_ids", columnDefinition = "JSONB")
    private List<UUID> departamentoIds;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(name = "unit_id")
    private UUID unitId;

    /** Planejado | Em Andamento | Concluido | Cancelado */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "Planejado";

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "observacoes")
    private String observacoes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
