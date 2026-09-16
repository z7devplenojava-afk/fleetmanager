package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRD 1.0 - MÓDULO 3: folha consumida de um bloco de Parte Diária.
 * Garante o Nº de controle sequencial do talão exigido pelo RF-05.1.
 */
@Entity
@Table(name = "daily_log_book_entries",
        uniqueConstraints = @UniqueConstraint(name = "uq_book_entry", columnNames = {"book_id", "sequential_number"}))
@Data
@EqualsAndHashCode(of = "id")
public class DailyLogBookEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private DailyLogBook book;

    /** Nº de controle sequencial da folha dentro do bloco. */
    @Column(name = "sequential_number", nullable = false)
    private Integer sequentialNumber;

    /** Parte Diária lançada com esta folha. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_log_id")
    private DailyLog dailyLog;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "used_by", length = 255)
    private String usedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
