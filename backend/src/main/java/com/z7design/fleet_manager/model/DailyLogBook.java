package com.z7design.fleet_manager.model;

import com.z7design.fleet_manager.model.enums.DailyLogBookStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 3 (RF-03.5): bloco de Parte Diária com numeração sequencial
 * distribuído aos motoristas. Cada folha consumida gera um registro em
 * {@link DailyLogBookEntry} garantindo rastreabilidade talão → apontamento.
 */
@Entity
@Table(name = "daily_log_books")
@Data
@EqualsAndHashCode(of = "id")
public class DailyLogBook {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "book_number", nullable = false, unique = true, length = 50)
    private String bookNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "vehicle_plate", length = 20)
    private String vehiclePlate;

    @Column(name = "first_number", nullable = false)
    private Integer firstNumber;

    @Column(name = "last_number", nullable = false)
    private Integer lastNumber;

    @Column(name = "current_number", nullable = false)
    private Integer currentNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_driver_id")
    private Employee assignedDriver;

    @Column(name = "assigned_driver_name", length = 255)
    private String assignedDriverName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_client_id")
    private Client assignedClient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_work_post_id")
    private WorkPost assignedWorkPost;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "issued_by", length = 255)
    private String issuedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private DailyLogBookStatus status = DailyLogBookStatus.ACTIVE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DailyLogBookEntry> entries = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Total de folhas do bloco. */
    public int getTotalSheets() {
        return Math.max(0, (lastNumber != null ? lastNumber : 0) - (firstNumber != null ? firstNumber : 0) + 1);
    }

    /** Folhas restantes (não consumidas). */
    public int getRemainingSheets() {
        if (lastNumber == null || currentNumber == null) {
            return 0;
        }
        return Math.max(0, lastNumber - currentNumber + 1);
    }

    /** Indica se o bloco ainda possui folhas disponíveis. */
    public boolean hasSheetsAvailable() {
        return status == DailyLogBookStatus.ACTIVE && getRemainingSheets() > 0;
    }
}
