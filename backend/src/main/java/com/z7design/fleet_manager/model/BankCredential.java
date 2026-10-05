package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "bank_credentials")
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class BankCredential implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @NotBlank(message = "Código do banco é obrigatório")
    @Column(name = "bank_code", length = 10, nullable = false)
    private String bankCode;

    @NotBlank(message = "Nome do banco é obrigatório")
    @Column(name = "bank_name", length = 100, nullable = false)
    private String bankName;

    @Column(name = "client_id", length = 255)
    private String clientId;

    @Column(name = "client_secret", length = 500)
    private String clientSecret;

    @Column(name = "certificate_path", length = 500)
    private String certificatePath;

    @Column(name = "environment", length = 20)
    @Builder.Default
    private String environment = "SANDBOX"; // SANDBOX or PRODUCTION

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
