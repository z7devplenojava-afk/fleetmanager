package com.z7design.fleet_manager.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Entity
@Table(name = "companies")
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Company name is required")
    @Size(max = 100, message = "Company name must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    // Sigla opcional: empresas legadas/seed podem ter sigla NULL.
    // Validação de obrigatoriedade fica no DTO (quando enviada pela API).
    @Size(max = 10, message = "Company sigla must not exceed 10 characters")
    @Column(unique = true, length = 10)
    private String sigla;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Size(max = 18, message = "CNPJ must not exceed 18 characters")
    @Column(length = 18, unique = true)
    private String cnpj;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    @Column(length = 255)
    private String address;

    // Campos de endereÃ§o separados
    @Size(max = 255, message = "Street must not exceed 255 characters")
    @Column(name = "endereco_rua", length = 255)
    private String enderecoRua;

    @Size(max = 20, message = "Number must not exceed 20 characters")
    @Column(name = "endereco_numero", length = 20)
    private String enderecoNumero;

    @Size(max = 100, message = "Complement must not exceed 100 characters")
    @Column(name = "endereco_complemento", length = 100)
    private String enderecoComplemento;

    @Size(max = 100, message = "Neighborhood must not exceed 100 characters")
    @Column(name = "endereco_bairro", length = 100)
    private String enderecoBairro;

    @Size(max = 100, message = "City must not exceed 100 characters")
    @Column(length = 100)
    private String city;

    @Size(max = 2, message = "State must not exceed 2 characters")
    @Column(length = 2)
    private String state;

    @Size(max = 10, message = "Zip code must not exceed 10 characters")
    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    @Column(length = 20)
    private String phone;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Column(length = 100)
    private String email;

    @Size(max = 255, message = "Website must not exceed 255 characters")
    @Column(length = 255)
    private String website;

    @Size(max = 500, message = "Logo URL must not exceed 500 characters")
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Size(max = 500, message = "Icon URL must not exceed 500 characters")
    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    /** Domínio obrigatório para criação de e-mails profissionais da empresa. */
    @Size(max = 120, message = "Domínio de e-mail must not exceed 120 characters")
    @Column(name = "email_domain", length = 120)
    private String emailDomain;

    // ===================== Dados fiscais =====================

    @Size(max = 20, message = "Inscrição estadual must not exceed 20 characters")
    @Column(name = "inscricao_estadual", length = 20)
    private String inscricaoEstadual;

    @Size(max = 20, message = "Inscrição municipal must not exceed 20 characters")
    @Column(name = "inscricao_municipal", length = 20)
    private String inscricaoMunicipal;

    /** Código IBGE do município emissor (7 dígitos). */
    @Size(max = 7, message = "Código do município deve ter 7 dígitos")
    @Column(name = "codigo_municipio", length = 7)
    private String codigoMunicipio;

    /** Situação perante o Simples Nacional: 1=Não optante, 2=MEI, 3=ME/EPP. */
    @Size(max = 2, message = "Regime tributário must not exceed 2 characters")
    @Column(name = "regime_tributario", length = 2)
    private String regimeTributario;

    @Column(name = "banner_urls", columnDefinition = "TEXT")
    private String bannerUrls;

    @Size(max = 50, message = "Tema cor must not exceed 50 characters")
    @Column(name = "tema_cor", length = 50)
    private String temaCor;

    @Column(name = "max_users")
    private Integer maxUsers;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @Column(name = "subscription_status", length = 30)
    private String subscriptionStatus = "active"; // trialing, active, past_due, canceled, suspended

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "grace_period_days")
    private Integer gracePeriodDays = 5;

    @Column(name = "gateway_customer_id", length = 100)
    private String gatewayCustomerId;

    @Column(name = "gateway_subscription_id", length = 100)
    private String gatewaySubscriptionId;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "legal_representative", columnDefinition = "jsonb")
    private String legalRepresentative;

    public boolean isSubscriptionOverdue() {
        if ("canceled".equalsIgnoreCase(subscriptionStatus) || "suspended".equalsIgnoreCase(subscriptionStatus)) {
            return true;
        }
        if ("past_due".equalsIgnoreCase(subscriptionStatus)) {
            if (dueDate == null) return true;
            int grace = gracePeriodDays != null ? gracePeriodDays : 5;
            return LocalDate.now().isAfter(dueDate.plusDays(grace));
        }
        return false;
    }

    @NotNull(message = "Company status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyStatus status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Relacionamentos
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("company-employees")
    private List<Employee> employees;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("company-branches")
    private List<Branch> branches;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonManagedReference("company-default-epis")
    private List<CompanyDefaultEPI> defaultEpis;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("company-passengers")
    private List<Passenger> passengers;

    public enum CompanyStatus {
        ACTIVE("Ativo"),
        INACTIVE("Inativo"),
        PENDING("Pendente"),
        SUSPENDED("Suspenso");

        private final String description;

        CompanyStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
