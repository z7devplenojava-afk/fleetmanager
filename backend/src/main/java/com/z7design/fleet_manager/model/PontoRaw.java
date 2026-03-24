package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ponto_raw", 
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"employee_id", "timestamp", "tipo"},
           name = "unique_employee_timestamp_type"
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PontoRaw {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "tipo", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private BatidaTipo tipo;

    @Column(name = "import_hash", nullable = false, length = 64)
    private String importHash;

    @Column(name = "import_job_id")
    private UUID importJobId;

    @Column(name = "raw_data", columnDefinition = "JSONB")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private String rawData; // JSON string com dados originais do REP

    @Column(name = "processed", nullable = false)
    private Boolean processed = false;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum BatidaTipo {
        ENTRADA,
        SAIDA
    }
}






