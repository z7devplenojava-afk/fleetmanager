package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "passengers")
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class Passenger implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String registration; // Matrícula do funcionário

    @Column(nullable = false)
    private String name; // Nome completo

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "employee_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Employee employee; // Relacionamento com Employee, se for o caso

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    @JsonBackReference("company-passengers")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "route_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Route route; // Linha utilizada

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "boarding_point_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private RoutePoint boardingPoint; // Ponto de embarque autorizado

    @Column(length = 50)
    private String shift; // Manhã, tarde, noite

    @Column(nullable = false)
    private Boolean active = true; // Status: Ativo/Inativo

    @Column(length = 100)
    private String costCenter; // Centro de custo (opcional)

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
