package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "parte_diaria_atividades")
@Data
@EqualsAndHashCode(callSuper = false)
public class ParteDiariaAtividade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parte_diaria_id", nullable = false)
    private ParteDiaria parteDiaria;

    @Column(name = "start_time")
    private String startTime;

    @Column(name = "end_time")
    private String endTime;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "activity_type")
    private String activityType;

    @Column(name = "route_code", length = 20)
    private String routeCode;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "start_km")
    private Integer startKm;

    @Column(name = "end_km")
    private Integer endKm;

    @Column(name = "passengers_count")
    private Integer passengersCount;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
