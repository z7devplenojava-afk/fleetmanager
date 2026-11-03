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
public class PairDeviceResponse {
    private String deviceToken;
    private UUID deviceId;
    private String deviceCode;
    private String name;
    private UUID companyId;
    private String companyName;
    private UUID clientId;
    private String clientName;
    private String orientation;
    private Integer resolutionWidth;
    private Integer resolutionHeight;
    private String wsTopic;
}

