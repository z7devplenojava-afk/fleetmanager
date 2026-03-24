package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;
import com.z7design.fleet_manager.tenant.TenantAware;
import java.util.UUID;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "suppliers")
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class Supplier implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @NotBlank(message = "Nome do fornecedor Ã© obrigatÃ³rio")
    @Size(max = 255, message = "Nome deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 18, message = "CNPJ deve ter no mÃ¡ximo 18 caracteres")
    @Column(name = "cnpj", unique = true)
    private String cnpj;

    @Email(message = "Email deve ser vÃ¡lido")
    @Size(max = 255, message = "Email deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "email")
    private String email;

    @Size(max = 20, message = "Telefone deve ter no mÃ¡ximo 20 caracteres")
    @Column(name = "phone")
    private String phone;

    @Size(max = 255, message = "EndereÃ§o deve ter no mÃ¡ximo 255 caracteres")
    @Column(name = "address")
    private String address;

    @Size(max = 100, message = "Cidade deve ter no mÃ¡ximo 100 caracteres")
    @Column(name = "city")
    private String city;

    @Size(max = 2, message = "Estado deve ter no mÃ¡ximo 2 caracteres")
    @Column(name = "state")
    private String state;

    @Size(max = 10, message = "CEP deve ter no mÃ¡ximo 10 caracteres")
    @Column(name = "zip_code")
    private String zipCode;

    @Size(max = 500, message = "ObservaÃ§Ãµes deve ter no mÃ¡ximo 500 caracteres")
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
