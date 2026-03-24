package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.UnificationJob;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnificationJobDTO {
    private UUID id;
    private String status;
    private Integer month;
    private Integer year;
    private Boolean forceUnification;
    private Integer totalDocuments;
    private Integer processedDocuments;
    private Integer successCount;
    private Integer failureCount;
    private String errorMessage;
    private Long processingTimeMs;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer progressPercentage;
    private Boolean isFinished;

    public static UnificationJobDTO fromEntity(UnificationJob job) {
        if (job == null) {
            return null;
        }
        
        return UnificationJobDTO.builder()
                .id(job.getId())
                .status(job.getStatus() != null ? job.getStatus().name() : null)
                .month(job.getMonth())
                .year(job.getYear())
                .forceUnification(job.getForceUnification())
                .totalDocuments(job.getTotalDocuments())
                .processedDocuments(job.getProcessedDocuments())
                .successCount(job.getSuccessCount())
                .failureCount(job.getFailureCount())
                .errorMessage(job.getErrorMessage())
                .processingTimeMs(job.getProcessingTimeMs())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .progressPercentage(job.getProgressPercentage())
                .isFinished(job.isFinished())
                .build();
    }
}


