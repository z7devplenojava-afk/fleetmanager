package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Veículo vinculado a uma fatura de locação.
 * A fatura de locação lista apenas veículos, sem motorista/mão de obra.
 */
@Entity
@Table(name = "rental_invoice_vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalInvoiceVehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rental_invoice_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "items" })
    private RentalInvoice rentalInvoice;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(nullable = false, length = 20)
    private String plate;

    @Column(length = 200)
    private String model;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
}
