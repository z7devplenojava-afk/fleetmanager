package com.z7design.fleet_manager.dto.kiosk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceHeartbeatRequest {
    private String playerVersion;
    private UUID activeVersionId;
    private Long freeStorageBytes;
    private Long totalStorageBytes;
    private Double cpuLoadPercent;
    private Double memoryUsagePercent;
    private String currentSlideId;
}
