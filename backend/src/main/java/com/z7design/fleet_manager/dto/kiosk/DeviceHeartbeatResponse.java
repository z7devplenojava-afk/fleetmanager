package com.z7design.fleet_manager.dto.kiosk;

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
public class DeviceHeartbeatResponse {
    private String status;
    private UUID desiredVersionId;
    private boolean syncNeeded;
    private LocalDateTime serverTime;
}
