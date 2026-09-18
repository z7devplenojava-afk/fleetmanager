package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "client_service_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClientServiceRequest implements TenantAware {

    public enum RequestType {
        RESERVE_VEHICLE,    // Solicitação de Veículo Reserva
        EXTRA_TRIP,         // Solicitação de Viagem Extra / Serviço Eventual
        SCHEDULE_CHANGE,    // Ajuste de Horário/Itinerário
        OTHER               // Outra Solicitação
    }

    public enum RequestStatus {
        PENDING,        // Pendente de Avaliação
        APPROVED,       // Aprovado
        IN_PROGRESS,    // Em Atendimento / Mobilização
        COMPLETED,      // Concluído / Realizado
        REJECTED,       // Recusado
        CANCELLED       // Cancelado pelo Cliente
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", insertable = false, updatable = false)
    private Client client;

    @Column(name = "contract_id")
    private UUID contractId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", insertable = false, updatable = false)
    private Contract contract;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 50)
    private RequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    // Campos de Veículo Reserva
    @Column(name = "has_contract_reserve_clause")
    private Boolean hasContractReserveClause;

    @Column(name = "is_extra_reserve")
    private Boolean isExtraReserve;

    @Column(name = "affected_vehicle_plate", length = 20)
    private String affectedVehiclePlate;

    // Campos de Viagem Extra
    @Column(name = "origin", length = 255)
    private String origin;

    @Column(name = "destination", length = 255)
    private String destination;

    @Column(name = "departure_date_time")
    private LocalDateTime departureDateTime;

    @Column(name = "return_date_time")
    private LocalDateTime returnDateTime;

    @Column(name = "passenger_count")
    private Integer passengerCount;

    @Column(name = "vehicle_type_needed", length = 100)
    private String vehicleTypeNeeded;

    @Column(name = "requested_by_user_id")
    private UUID requestedByUserId;

    @Column(name = "requested_by_user_name", length = 255)
    private String requestedByUserName;

    @Column(name = "assigned_vehicle_plate", length = 20)
    private String assignedVehiclePlate;

    @Column(name = "assigned_driver_name", length = 255)
    private String assignedDriverName;

    @Column(name = "response_notes", columnDefinition = "TEXT")
    private String responseNotes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
