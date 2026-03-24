package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "import_job_log", uniqueConstraints = @UniqueConstraint(columnNames = "import_hash"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportJobLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "import_hash", nullable = false, unique = true, length = 64)
    private String importHash;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "total_records")
    private Integer totalRecords = 0;

    @Column(name = "processed_records")
    private Integer processedRecords = 0;

    @Column(name = "failed_records")
    private Integer failedRecords = 0;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ImportStatus status = ImportStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "error_details", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String errorDetails; // JSON string com detalhes dos erros

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imported_by_id")
    private User importedBy;

    @CreationTimestamp
    @Column(name = "imported_at", nullable = false, updatable = false)
    private LocalDateTime importedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "source_type", length = 50)
    private String sourceType; // FILE, API, MANUAL

    @Column(name = "source_info", columnDefinition = "JSONB")
    @JdbcTypeCode(SqlTypes.JSON)
    private String sourceInfo; // JSON string com informaÃ§Ãµes sobre a origem

    public enum ImportStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
}






