package com.z7design.fleet_manager.dto.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskDevice;
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
public class KioskDeviceDTO {
    private UUID id;
    private UUID companyId;
    private String companyName;
    private UUID clientId;
    private String clientName;
    private String name;
    private String description;
    private String deviceCode;
    private String platform;
    private String platformVersion;
    private String playerVersion;
    private Integer resolutionWidth;
    private Integer resolutionHeight;
    private String orientation;
    private String status;
    private LocalDateTime lastHeartbeatAt;
    private UUID activePresentationVersionId;
    private UUID desiredPresentationVersionId;
    private LocalDateTime pairedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static KioskDeviceDTO fromEntity(KioskDevice device) {
        if (device == null) return null;
        return KioskDeviceDTO.builder()
                .id(device.getId())
                .companyId(device.getCompanyId())
                .companyName(device.getCompany() != null ? device.getCompany().getName() : null)
                .clientId(device.getClientId())
                .clientName(device.getClient() != null ? device.getClient().getName() : null)
                .name(device.getName())
                .description(device.getDescription())
                .deviceCode(device.getDeviceCode())
                .platform(device.getPlatform())
                .platformVersion(device.getPlatformVersion())
                .playerVersion(device.getPlayerVersion())
                .resolutionWidth(device.getResolutionWidth())
                .resolutionHeight(device.getResolutionHeight())
                .orientation(device.getOrientation())
                .status(device.getStatus())
                .lastHeartbeatAt(device.getLastHeartbeatAt())
                .activePresentationVersionId(device.getActivePresentationVersionId())
                .desiredPresentationVersionId(device.getDesiredPresentationVersionId())
                .pairedAt(device.getPairedAt())
                .createdAt(device.getCreatedAt())
                .updatedAt(device.getUpdatedAt())
                .build();
    }
}
