package br.com.fleetmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "companies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "trade_name", length = 255)
    private String tradeName;

    @Column(name = "cnpj", length = 18, unique = true)
    private String cnpj;

    @Column(name = "inscricao_estadual", length = 20)
    private String inscricaoEstadual;

    @Column(name = "inscricao_municipal", length = 20)
    private String inscricaoMunicipal;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 2)
    private String state;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "contact_person", length = 255)
    private String contactPerson;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "status", length = 20)
    @Enumerated(EnumType.STRING)
    private CompanyStatus status;

    @Column(name = "type", length = 50)
    private String type; // LTDA, ME, EIRELI, S.A, etc.

    @Column(name = "sector", length = 100)
    private String sector; // Setor de atuação

    @Column(name = "size", length = 50)
    private String size; // Pequena, Média, Grande

    @Column(name = "annual_revenue", columnDefinition = "NUMERIC(15,2)")
    private Double annualRevenue;

    @Column(name = "employee_count")
    private Integer employeeCount;

    @Column(name = "notes", length = 1000)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    public enum CompanyStatus {
        ACTIVE("Ativa"),
        INACTIVE("Inativa"),
        PENDING("Pendente"),
        SUSPENDED("Suspensa");

        private final String description;

        CompanyStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
} 