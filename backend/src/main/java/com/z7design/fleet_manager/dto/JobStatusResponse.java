package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobStatusResponse {
    private UUID jobId;
    private String status;
    private String message;
    private Integer progressPercentage;
    private Integer totalPages;
    private Integer processedPages;
    private String errorMessage;
}


