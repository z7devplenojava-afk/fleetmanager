package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "material_requisitions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MaterialRequisition implements TenantAware {

    public enum UrgencyLevel {
        NORMAL,
        EMERGENCIA
    }

    public enum RequisitionStatus {
        PENDING_CHECK,              // Aguardando verificação no almoxarifado
        RESERVED_STOCK,             // Atendido com reserva de estoque
        WAITING_QUOTES,             // Aguardando 3 cotações
        QUOTES_RECEIVED,            // 3 cotações cadastradas e prontas para avaliação
        APPROVED_BY_MANAGER,        // Cotação e requisição aprovadas pelo Gestor de Manutenção
        OC_GENERATED,               // Ordem de Compra enviada para o Financeiro
        WAITING_DELIVERY,           // Compra realizada, aguardando entrega do fornecedor
        AVAILABLE_FOR_INSTALLATION, // Peça recebida no almoxarifado e liberada para instalação
        INSTALLED_COMPLETED,        // Instalada no veículo e OS finalizada (baixa definitiva)
        REJECTED,                   // Rejeitada
        CANCELLED                   // Cancelada
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "requisition_number", nullable = false, length = 50)
    private String requisitionNumber;

    @Column(name = "work_order_id")
    private UUID workOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", insertable = false, updatable = false)
    private FleetWorkOrder workOrder;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    @Column(name = "stock_item_id")
    private UUID stockItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_item_id", insertable = false, updatable = false)
    private StockItem stockItem;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "item_code", length = 100)
    private String itemCode;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit", length = 20)
    @Builder.Default
    private String unit = "UN";

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency", nullable = false, length = 30)
    @Builder.Default
    private UrgencyLevel urgency = UrgencyLevel.NORMAL;

    @Column(name = "justification", nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Column(name = "requester_id")
    private UUID requesterId;

    @Column(name = "requester_name")
    private String requesterName;

    @Column(name = "origin_department", length = 50)
    @Builder.Default
    private String originDepartment = "OPERATIONAL";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private RequisitionStatus status = RequisitionStatus.PENDING_CHECK;

    @Column(name = "manager_approval_id")
    private UUID managerApprovalId;

    @Column(name = "manager_approval_name")
    private String managerApprovalName;

    @Column(name = "manager_approval_date")
    private LocalDateTime managerApprovalDate;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "sla_lead_time_minutes")
    private Long slaLeadTimeMinutes;

    @Column(name = "sla_target_minutes")
    @Builder.Default
    private Long slaTargetMinutes = 4320L; // 72h default

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "delivered_by_id")
    private UUID deliveredById;

    @Column(name = "delivered_by_name")
    private String deliveredByName;

    @Column(name = "received_by_name")
    private String receivedByName;

    @Column(name = "delivery_notes", columnDefinition = "TEXT")
    private String deliveryNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
