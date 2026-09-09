package com.z7design.fleet_manager.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "(company_id = :companyId OR company_id IS NULL)")
public class Department implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Nome do departamento Ã© obrigatÃ³rio")
    @Column(nullable = false, length = 100, unique = true)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "email_domain")
    private String emailDomain;

    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    @NotNull(message = "Data de criaÃ§Ã£o Ã© obrigatÃ³ria")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "company_id")
    private UUID companyId;

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
