package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "measurement_contracts")
@Data
@EqualsAndHashCode(callSuper = false)
public class MeasurementContract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(name = "contract_number", nullable = false)
    private String contractNumber;

    @Column(name = "obra_name")
    private String obraName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "billing_type")
    private String billingType = "MENSAL";

    @Column(name = "periodicity")
    private String periodicity = "MENSAL";

    @Column(name = "base_days")
    private Integer baseDays = 30;

    @Column(name = "start_day_of_month")
    private Integer startDayOfMonth = 21;

    @Column(name = "end_day_of_month")
    private Integer endDayOfMonth = 20;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "status")
    private String status = "ATIVO";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeasurementContractPrice> prices = new ArrayList<>();

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MeasurementAdjustment> adjustments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
