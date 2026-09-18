package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Garagem (pátio/base) onde os veículos ficam recolhidos.
 * <p>
 * Cada garagem possui um responsável ({@link Employee}) e serve como referência para:
 * <ul>
 *   <li>Ordens de Serviço de Frota (qual garagem executará o serviço);</li>
 *   <li>Mobilização de Transporte (garagem de destino para manutenção/limpeza);</li>
 *   <li>Gestão de Limpeza de Veículos (fila por garagem);</li>
 *   <li>Alocação de veículos (vehicle.garageId) e contagem de veículos por garagem.</li>
 * </ul>
 */
@Entity
@Table(name = "garages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Garage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String address;

    /** Responsável pela garagem (colaborador). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_employee_id")
    private Employee responsibleEmployee;

    /** Nome do responsável (desnormalizado para listagens rápidas). */
    @Column(name = "responsible_name", length = 200)
    private String responsibleName;

    /** Contato do responsável (telefone/WhatsApp). */
    @Column(name = "responsible_phone", length = 30)
    private String responsiblePhone;

    /** Capacidade máxima de vagas. */
    @Column
    private Integer capacity;

    @Column(length = 500)
    private String notes;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
