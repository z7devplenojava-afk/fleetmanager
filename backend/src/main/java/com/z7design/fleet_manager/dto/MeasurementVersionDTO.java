package com.z7design.fleet_manager.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MeasurementVersionDTO {
    private UUID id;
    private UUID bulletinId;
    private Integer versionNumber;
    private String snapshotJson;
    private String justification;
    private String createdBy;
    private LocalDateTime createdAt;
}
