package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitControlReportDTO {
    private UUID id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String filters;
    private UUID workPostId;
    private String workPostName;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalVisits;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}













