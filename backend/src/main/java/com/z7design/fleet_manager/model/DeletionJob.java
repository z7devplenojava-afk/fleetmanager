package com.z7design.fleet_manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "deletion_jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeletionJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @Column(name = "total_files", nullable = false)
    private Integer totalFiles;

    @Column(name = "processed_files", nullable = false)
    private Integer processedFiles;

    @Column(name = "deleted_count", nullable = false)
    private Integer deletedCount;

    @Column(name = "failed_count", nullable = false)
    private Integer failedCount;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    // Armazenar lista de arquivos como JSON (simplificado)
    @Column(name = "file_names", columnDefinition = "TEXT")
    private String fileNames; // JSON array de nomes de arquivos

    public enum JobStatus {
        PENDING("Pendente"),
        PROCESSING("Processando"),
        COMPLETED("ConcluÃ­do"),
        FAILED("Falhou"),
        CANCELLED("Cancelado");

        private final String description;

        JobStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    // MÃ©todos auxiliares
    public int getProgressPercentage() {
        if (totalFiles == null || totalFiles == 0) {
            return 0;
        }
        return (int) Math.round((processedFiles.doubleValue() / totalFiles.doubleValue()) * 100);
    }

    public boolean isFinished() {
        return status == JobStatus.COMPLETED || 
               status == JobStatus.FAILED || 
               status == JobStatus.CANCELLED;
    }
}


