package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.ShiftChangeStatus;
import com.z7design.fleet_manager.model.enums.ShiftTime;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_change_forms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShiftChangeForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate dateOfRequest;

    // Dados do Solicitante
    @Column(nullable = false)
    private String requesterFullName;

    @Column(nullable = false)
    private String requesterSector;

    @Column(nullable = true) // Pode ser nulo se nÃ£o houver folga
    private LocalDate requesterDayOffDate;

    @Column(nullable = false)
    private LocalDate requesterShiftDate;

    // Dados do Colega que AssumirÃ¡ o PlantÃ£o
    @Column(nullable = false)
    private String replacingFullName;

    @Column(nullable = false)
    private String replacingSector;

    @Column(nullable = false)
    private LocalDate replacingShiftDate;

    @Column(nullable = true) // Pode ser nulo se nÃ£o houver folga
    private LocalDate replacingDayOffDate;

    // HorÃ¡rio do PlantÃ£o
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftTime shiftTime;

    // Status da SolicitaÃ§Ã£o (Pendente, Aprovada, Rejeitada)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftChangeStatus status;

    // Aprovado por (nome do aprovador)
    @Column(nullable = true)
    private String approvedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ShiftChangeStatus.PENDING; // Define o status inicial como PENDENTE
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

