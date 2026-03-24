package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.RoutePoint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO para pontos de rota (embarque/desembarque) exposto como {@code /api/boarding-points}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardingPointDTO {

    private UUID id;
    private UUID routeId;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer order;
    private String type;
    private Integer radiusMeters;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BoardingPointDTO fromEntity(RoutePoint p) {
        if (p == null) {
            return null;
        }
        UUID routeId = p.getRoute() != null ? p.getRoute().getId() : null;
        return BoardingPointDTO.builder()
                .id(p.getId())
                .routeId(routeId)
                .name(p.getName())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .order(p.getOrder())
                .type(p.getType() != null ? p.getType().name() : null)
                .radiusMeters(p.getRadiusMeters())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
