package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "billing_events", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"gateway_name", "gateway_event_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class BillingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "gateway_event_id", nullable = false, length = 150)
    private String gatewayEventId;

    @Column(name = "gateway_name", nullable = false, length = 50)
    @Builder.Default
    private String gatewayName = "ASAAS";

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "amount_cents")
    private Integer amountCents;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
