package com.z7design.fleet_manager.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vehicle_rental_expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleRentalExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "work_post_id")
    private UUID workPostId;

    @Column(name = "work_post_name")
    private String workPostName;

    @Column(name = "contract_number", length = 100)
    private String contractNumber;

    @Column(name = "expense_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expenseDate;

    @Column(name = "category", nullable = false, length = 80)
    private String category;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "responsibility", nullable = false, length = 50)
    private String responsibility;

    @Column(name = "reimbursement_status", nullable = false, length = 50)
    private String reimbursementStatus;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "company_id")
    private UUID companyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

