package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.tenant.TenantAware;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "access_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "company_id = :companyId")
public class AccessRecord implements TenantAware {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessType type; // VISITOR, EMPLOYEE

    @Column(nullable = false)
    private String name;

    @Column(name = "document_number")
    private String documentNumber;

    @Column(name = "vehicle_plate")
    private String vehiclePlate;

    @Column(name = "purpose_of_visit")
    private String purposeOfVisit;

    @Column(name = "entry_time", nullable = false)
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    private String status; // IN, OUT

    @Column(name = "authorized_by")
    private String authorizedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @PrePersist
    protected void onCreate() {
        if (entryTime == null) {
            entryTime = LocalDateTime.now();
        }
        if (status == null) {
            status = "IN";
        }
    }

    public enum AccessType {
        VISITOR,
        EMPLOYEE
    }
}
