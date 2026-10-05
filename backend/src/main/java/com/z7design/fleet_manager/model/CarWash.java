package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "car_washes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarWash {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "cnpj_cpf", length = 20)
    private String cnpjCpf;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Column(name = "price_internal", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal priceInternal = BigDecimal.ZERO;

    @Column(name = "price_external", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal priceExternal = BigDecimal.ZERO;

    @Column(name = "price_complete", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal priceComplete = BigDecimal.ZERO;

    @Column(name = "price_sanitary", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal priceSanitary = BigDecimal.ZERO;

    @Column(name = "company_id")
    private UUID companyId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
