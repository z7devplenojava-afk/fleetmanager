package com.z7design.fleet_manager.dto.kiosk;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.model.kiosk.KioskSlideElement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KioskSlideElementDTO {
    private UUID id;
    private UUID slideId;
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

    private static final ObjectMapper mapper = new ObjectMapper();

    public static KioskSlideElementDTO fromEntity(KioskSlideElement el) {
        if (el == null) return null;
        return KioskSlideElementDTO.builder()
                .id(el.getId())
                .slideId(el.getSlideId())
                .elementType(el.getElementType())
                .content(parseJson(el.getContentJson()))
                .x(el.getX())
                .y(el.getY())
                .width(el.getWidth())
                .height(el.getHeight())
                .zIndex(el.getZIndex())
                .style(parseJson(el.getStyleJson()))
                .action(parseJson(el.getActionJson()))
                .build();
    }

    private static Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return mapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }
}
