package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.fleetmanager.model.enums.RiskLevel;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa riscos específicos por funcionário
 * (exceções/ajustes individuais)
 */
@Entity
@Table(name = "employee_risks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRisk {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Funcionário é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "Tipo de risco é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_type_id", nullable = false)
    private OccupationalRiskType riskType;

    @NotNull(message = "Nível de risco é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel riskLevel;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "preventive_measures", columnDefinition = "TEXT")
    private String preventiveMeasures;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
