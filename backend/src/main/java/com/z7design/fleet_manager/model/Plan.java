package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "O nome do plano é obrigatório")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(name = "price_cents", nullable = false)
    @Builder.Default
    private Integer priceCents = 0;

    @Column(name = "billing_cycle", length = 20, nullable = false)
    @Builder.Default
    private String billingCycle = "monthly";

    @Column(name = "max_users")
    @Builder.Default
    private Integer maxUsers = 50;

    @Column(name = "max_vehicles")
    @Builder.Default
    private Integer maxVehicles = 30;

    /**
     * Feature Flags em formato JSON string (ex: {"contracts_white_label": true, "telemetry": true})
     */
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "features", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String features = "{}";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
