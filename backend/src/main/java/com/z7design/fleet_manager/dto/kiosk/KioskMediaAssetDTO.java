package com.z7design.fleet_manager.dto.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskMediaAsset;
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
public class KioskMediaAssetDTO {
    private UUID id;
    private UUID companyId;
    private String name;
    private String mediaType;
    private String mimeType;
    private Long fileSizeBytes;
    private String storageKey;
    private String checksumSha256;
    private Long durationMs;
    private Integer width;
    private Integer height;
    private String thumbnailStorageKey;
    private String processingStatus;
    private String url;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static KioskMediaAssetDTO fromEntity(KioskMediaAsset asset) {
        if (asset == null) return null;
        return KioskMediaAssetDTO.builder()
                .id(asset.getId())
                .companyId(asset.getCompanyId())
                .name(asset.getName())
                .mediaType(asset.getMediaType())
                .mimeType(asset.getMimeType())
                .fileSizeBytes(asset.getFileSizeBytes())
                .storageKey(asset.getStorageKey())
                .checksumSha256(asset.getChecksumSha256())
                .durationMs(asset.getDurationMs())
                .width(asset.getWidth())
                .height(asset.getHeight())
                .thumbnailStorageKey(asset.getThumbnailStorageKey())
                .processingStatus(asset.getProcessingStatus())
                .url("/api/kiosk-media/" + asset.getId() + "/content")
                .thumbnailUrl(asset.getThumbnailStorageKey() != null 
                        ? "/api/kiosk-media/" + asset.getId() + "/thumbnail" 
                        : null)
                .createdAt(asset.getCreatedAt())
                .updatedAt(asset.getUpdatedAt())
                .build();
    }
}

