package com.z7design.fleet_manager.model;

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

    @NotBlank(message = "Company sigla is required")
    @Size(min = 2, max = 10, message = "Company sigla must be between 2 and 10 characters")
    @Column(nullable = false, unique = true, length = 10)
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

    @Size(max = 50, message = "Tema cor must not exceed 50 characters")
    @Column(name = "tema_cor", length = 50)
    private String temaCor;

    @Column(name = "max_users")
    private Integer maxUsers;

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
