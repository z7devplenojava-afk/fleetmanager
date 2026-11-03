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
public class UpdateKioskDeviceRequest {

    private String name;

    private String description;

    private UUID clientId;

    private String platform;

    private Integer resolutionWidth;

    private Integer resolutionHeight;

    private String orientation;

    private String status;

    private UUID desiredPresentationVersionId;
}
