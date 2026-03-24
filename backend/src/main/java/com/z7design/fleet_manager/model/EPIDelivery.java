package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.z7design.fleet_manager.model.enums.EPIDeliveryReason;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa o controle de entrega de EPIs aos funcionÃ¡rios
 */
@Entity
@Table(name = "epi_deliveries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EPIDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "FuncionÃ¡rio Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "unit", "position", "user"})
    private Employee employee;

    @NotNull(message = "EPI Ã© obrigatÃ³rio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "epi_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private PersonalProtectiveEquipment epi;

    @NotNull(message = "Data de entrega Ã© obrigatÃ³ria")
    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @NotNull(message = "Quantidade Ã© obrigatÃ³ria")
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @NotNull(message = "Motivo da entrega Ã© obrigatÃ³rio")
    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_reason", nullable = false)
    private EPIDeliveryReason deliveryReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivered_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User deliveredByUser;

    @Builder.Default
    @Column(name = "received_by_employee", nullable = false)
    private Boolean receivedByEmployee = false;

    @Column(name = "employee_signature_url")
    private String employeeSignatureUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

