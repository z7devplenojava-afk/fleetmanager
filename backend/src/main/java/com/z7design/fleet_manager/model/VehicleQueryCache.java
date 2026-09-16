package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vehicle_query_cache")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleQueryCache {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(nullable = false, length = 20)
    private String plate;

    @Column(length = 30)
    private String renavam;

    @Column(length = 10)
    private String uf;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "vehicle_brand_model", length = 150)
    private String vehicleBrandModel;

    @Column(name = "vehicle_year")
    private Integer vehicleYear;

    @Column(name = "vehicle_color", length = 50)
    private String vehicleColor;

    @Column(name = "vehicle_city", length = 100)
    private String vehicleCity;

    @Column(name = "total_fines")
    private Integer totalFines;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "restrictions_json", columnDefinition = "TEXT")
    private String restrictionsJson;

    @Column(name = "response_json", columnDefinition = "TEXT")
    private String responseJson;

    @Column(length = 50)
    private String origin; // API_LIVE, CACHE

    @Column(name = "queried_by", length = 150)
    private String queriedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
