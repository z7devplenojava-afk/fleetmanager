package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_reservations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StockReservation implements TenantAware {

    public enum ReservationStatus {
        ACTIVE_RESERVED,        // Reservada aguardando início/continuidade da OS
        READY_FOR_INSTALLATION, // Liberada no almoxarifado pronta para instalação
        CONSUMED,               // Baixa definitiva executada na conclusão da OS
        CANCELLED               // Cancelada / Devolvida ao saldo livre
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "stock_item_id", nullable = false)
    private UUID stockItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_item_id", insertable = false, updatable = false)
    private StockItem stockItem;

    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", insertable = false, updatable = false)
    private FleetWorkOrder workOrder;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    @Column(name = "requisition_id")
    private UUID requisitionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", insertable = false, updatable = false)
    private MaterialRequisition requisition;

    @Column(name = "quantity_reserved", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal quantityReserved = BigDecimal.ONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.ACTIVE_RESERVED;

    @Column(name = "reserved_by_id")
    private UUID reservedById;

    @Column(name = "reserved_by_name")
    private String reservedByName;

    @Column(name = "reserved_at", nullable = false)
    @Builder.Default
    private LocalDateTime reservedAt = LocalDateTime.now();

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
