package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.DeletionJob;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeletionJobDTO {
    private UUID id;
    private String status;
    private Integer totalFiles;
    private Integer processedFiles;
    private Integer deletedCount;
    private Integer failedCount;
    private String errorMessage;
    private Long processingTimeMs;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<String> fileNames;
    private Integer progressPercentage;
    private Boolean isFinished;

    public static DeletionJobDTO fromEntity(DeletionJob job) {
        if (job == null) {
            return null;
        }
        
        // Parse fileNames JSON se necessÃ¡rio
        List<String> fileNamesList = null;
        if (job.getFileNames() != null && !job.getFileNames().isEmpty()) {
            try {
                // Usar Jackson para parsear JSON
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                fileNamesList = mapper.readValue(job.getFileNames(), 
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (Exception e) {
                // Se falhar, usar lista vazia
                fileNamesList = java.util.Collections.emptyList();
            }
        }
        
        return DeletionJobDTO.builder()
            .id(job.getId())
            .status(job.getStatus() != null ? job.getStatus().name() : null)
            .totalFiles(job.getTotalFiles())
            .processedFiles(job.getProcessedFiles())
            .deletedCount(job.getDeletedCount())
            .failedCount(job.getFailedCount())
            .errorMessage(job.getErrorMessage())
            .processingTimeMs(job.getProcessingTimeMs())
            .createdAt(job.getCreatedAt())
            .updatedAt(job.getUpdatedAt())
            .startedAt(job.getStartedAt())
            .completedAt(job.getCompletedAt())
            .fileNames(fileNamesList)
            .progressPercentage(job.getProgressPercentage())
            .isFinished(job.isFinished())
            .build();
    }
}


