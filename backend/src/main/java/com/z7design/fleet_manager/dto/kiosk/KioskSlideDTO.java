package com.z7design.fleet_manager.dto.kiosk;

import com.z7design.fleet_manager.model.kiosk.KioskSlide;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KioskSlideDTO {
    private UUID id;
    private UUID presentationId;
    private String name;
    private Integer position;
    private Long durationMs;
    private String transitionType;
    private String interactionMode;
    private String backgroundType;
    private UUID backgroundMediaId;
    private String backgroundMediaUrl;
    @Builder.Default
    private List<KioskSlideElementDTO> elements = new ArrayList<>();

    public static KioskSlideDTO fromEntity(KioskSlide slide) {
        if (slide == null) return null;
        return KioskSlideDTO.builder()
                .id(slide.getId())
                .presentationId(slide.getPresentationId())
                .name(slide.getName())
                .position(slide.getPosition())
                .durationMs(slide.getDurationMs())
                .transitionType(slide.getTransitionType())
                .interactionMode(slide.getInteractionMode())
                .backgroundType(slide.getBackgroundType())
                .backgroundMediaId(slide.getBackgroundMediaId())
                .backgroundMediaUrl(slide.getBackgroundMediaId() != null 
                        ? "/api/kiosk-media/" + slide.getBackgroundMediaId() + "/content" 
                        : null)
                .elements(slide.getElements() != null 
                        ? slide.getElements().stream().map(KioskSlideElementDTO::fromEntity).toList() 
                        : List.of())
                .build();
    }
}

