package com.z7design.fleet_manager.dto;

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
public class TimeRecordResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDateTime recordedAt;
    private String type;
    private String origin;
    private Double latitude;
    private Double longitude;
    private String deviceInfo;
    private Boolean isManual;
}
