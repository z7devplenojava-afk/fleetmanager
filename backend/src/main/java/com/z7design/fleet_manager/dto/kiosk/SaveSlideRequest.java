package com.z7design.fleet_manager.dto.kiosk;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveSlideRequest {
    private UUID id;
    private String name;
    private Integer position;
    private Long durationMs;
    @Builder.Default
    private String transitionType = "FADE";
    @Builder.Default
    private String interactionMode = "AUTOMATIC";
    @Builder.Default
    private String backgroundType = "COLOR";
    private UUID backgroundMediaId;
    private List<SlideElementInput> elements;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlideElementInput {
        private UUID id;
        private String elementType;
        private Map<String, Object> content;
        private Double x;
        private Double y;
        private Double width;
        private Double height;
        @JsonProperty("zIndex")
        private Integer zIndex;
        private Map<String, Object> style;
        private Map<String, Object> action;
    }
}
