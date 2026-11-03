package com.z7design.fleet_manager.dto.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskPresentation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KioskPresentationDTO {
    private UUID id;
    private UUID companyId;
    private String name;
    private String description;
    private String status;
    private UUID homeSlideId;
    private Integer idleTimeoutSeconds;
    private Integer slidesCount;
    @Builder.Default
    private List<KioskSlideDTO> slides = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static KioskPresentationDTO fromEntity(KioskPresentation pres, boolean includeSlides) {
        if (pres == null) return null;
        int count = pres.getSlides() != null ? pres.getSlides().size() : 0;
        List<KioskSlideDTO> slideDTOs = List.of();
        if (includeSlides && pres.getSlides() != null) {
            slideDTOs = pres.getSlides().stream().map(KioskSlideDTO::fromEntity).toList();
        }

        return KioskPresentationDTO.builder()
                .id(pres.getId())
                .companyId(pres.getCompanyId())
                .name(pres.getName())
                .description(pres.getDescription())
                .status(pres.getStatus())
                .homeSlideId(pres.getHomeSlideId())
                .idleTimeoutSeconds(pres.getIdleTimeoutSeconds())
                .slidesCount(count)
                .slides(slideDTOs)
                .createdAt(pres.getCreatedAt())
                .updatedAt(pres.getUpdatedAt())
                .build();
    }
}
