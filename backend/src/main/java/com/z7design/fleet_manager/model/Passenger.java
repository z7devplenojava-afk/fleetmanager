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

    @Column(name = "cpf", length = 14)
    private String cpf;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    /** COMUM, ESTUDANTE, IDOSO, PCD */
    @Column(name = "passenger_type", length = 20)
    private String passengerType = "COMUM";

    @Column(name = "preferred_time")
    private java.time.LocalTime preferredTime;

    @Column(name = "notifications_enabled", nullable = false)
    private Boolean notificationsEnabled = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "disembark_point_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private RoutePoint disembarkPoint; // Ponto de desembarque autorizado

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "passenger_category", length = 30)
    private String passengerCategory = "FRETADO"; // FRETADO ou PUBLICO_ALEATORIO

    @Column(name = "cep", length = 10)
    private String cep;

    @Column(name = "street", length = 150)
    private String street;

    @Column(name = "number", length = 20)
    private String number;

    @Column(name = "complement", length = 100)
    private String complement;

    @Column(name = "neighborhood", length = 100)
    private String neighborhood;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 2)
    private String state;

    @Column(name = "boarding_cep", length = 10)
    private String boardingCep;

    @Column(name = "boarding_street", length = 150)
    private String boardingStreet;

    @Column(name = "boarding_number", length = 20)
    private String boardingNumber;

    @Column(name = "boarding_neighborhood", length = 100)
    private String boardingNeighborhood;

    @Column(name = "boarding_city", length = 100)
    private String boardingCity;

    @Column(name = "boarding_state", length = 2)
    private String boardingState;

    @Column(name = "is_pcd")
    private Boolean isPcd = false;

    @Column(name = "disability_type", length = 50)
    private String disabilityType;

    @Column(name = "disability_description", columnDefinition = "TEXT")
    private String disabilityDescription;

    @Column(name = "lgpd_accepted")
    private Boolean lgpdAccepted = false;

    @Column(name = "lgpd_accepted_at")
    private LocalDateTime lgpdAcceptedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "client_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "company" })
    private Client client;

    @Column(name = "user_id")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password" })
    private User user;

    /** Status do passageiro: ATIVO, BLOQUEADO, DEMITIDO, INATIVO */
    @Column(name = "status", length = 30)
    private String status = "ATIVO";

    /** Permite embarcar em múltiplas linhas do cliente */
    @Column(name = "multiple_routes_allowed")
    private Boolean multipleRoutesAllowed = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "return_route_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Route returnRoute;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "return_boarding_point_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private RoutePoint returnBoardingPoint;

    @Column(name = "qr_code_token", length = 255)
    private String qrCodeToken;

    @Column(name = "admission_date")
    private java.time.LocalDate admissionDate;

    @Column(name = "dismissal_date")
    private java.time.LocalDate dismissalDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
