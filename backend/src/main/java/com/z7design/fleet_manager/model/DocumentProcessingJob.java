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
@Table(name = "document_processing_jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentProcessingJob {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;
    
    @Column(name = "file_path", length = 500)
    private String filePath;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "total_pages")
    @Builder.Default
    private Integer totalPages = 0;
    
    @Column(name = "processed_pages")
    @Builder.Default
    private Integer processedPages = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private JobStatus status = JobStatus.QUEUED;
    
    @Column(name = "progress_percentage")
    @Builder.Default
    private Integer progressPercentage = 0;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
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
    
    @Column(name = "document_type", length = 20)
    private String documentType; // "HOLERITE" ou "COMPROVANTE"
    
    public enum JobStatus {
        QUEUED,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
    
    public void updateProgress() {
        if (totalPages > 0) {
            this.progressPercentage = (int) ((processedPages * 100.0) / totalPages);
        }
    }
}


