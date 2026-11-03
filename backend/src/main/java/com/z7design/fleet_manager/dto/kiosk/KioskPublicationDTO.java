package com.z7design.fleet_manager.dto.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskPublication;
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
public class KioskPublicationDTO {
    private UUID id;
    private UUID deviceId;
    private String deviceName;
    private String deviceCode;
    private UUID presentationVersionId;
    private Integer versionNumber;
    private String status;
    private Integer progressPercent;
    private String lastError;
    private LocalDateTime scheduledAt;
    private LocalDateTime createdAt;
    private LocalDateTime downloadedAt;
    private LocalDateTime activatedAt;

    public static KioskPublicationDTO fromEntity(KioskPublication pub) {
        if (pub == null) return null;
        return KioskPublicationDTO.builder()
                .id(pub.getId())
                .deviceId(pub.getDeviceId())
                .deviceName(pub.getDevice() != null ? pub.getDevice().getName() : null)
                .deviceCode(pub.getDevice() != null ? pub.getDevice().getDeviceCode() : null)
                .presentationVersionId(pub.getPresentationVersionId())
                .versionNumber(pub.getPresentationVersion() != null ? pub.getPresentationVersion().getVersionNumber() : null)
                .status(pub.getStatus())
                .progressPercent(pub.getProgressPercent())
                .lastError(pub.getLastError())
                .scheduledAt(pub.getScheduledAt())
                .createdAt(pub.getCreatedAt())
                .downloadedAt(pub.getDownloadedAt())
                .activatedAt(pub.getActivatedAt())
                .build();
    }
}
