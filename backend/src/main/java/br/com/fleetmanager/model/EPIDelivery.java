package br.com.fleetmanager.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.fleetmanager.model.enums.EPIDeliveryReason;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa o controle de entrega de EPIs aos funcionários
 */
@Entity
@Table(name = "epi_deliveries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EPIDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull(message = "Funcionário é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull(message = "EPI é obrigatório")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "epi_id", nullable = false)
    private PersonalProtectiveEquipment epi;

    @NotNull(message = "Data de entrega é obrigatória")
    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @NotNull(message = "Quantidade é obrigatória")
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @NotNull(message = "Motivo da entrega é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_reason", nullable = false)
    private EPIDeliveryReason deliveryReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivered_by_user_id")
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
