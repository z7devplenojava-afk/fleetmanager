package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.Route;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DTO para tráfego seguro de Rotas para o frontend,
 * evitando erros de LazyInitializationException e proxies Hibernate.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteDTO {
    private UUID id;
    private UUID companyId;
    private String code;
    private String name;
    private String description;
    private String color;
    private String status;
    private Integer capacity;

    private SimpleRef unit;
    private SimpleRef location;
    private SimpleRef client;

    private Long estimatedDuration;
    private boolean checkpointsRequired;
    private boolean geofenceEnabled;
    private Integer defaultRadiusMeters;

    private String originCep;
    private String originAddress;
    private String destinationCep;
    private String destinationAddress;

    private String shift;
    private String executionTime;
    private Double distanceKm;

    private LocalTime scheduledStartTime;
    private LocalTime scheduledEndTime;

    private Double garageLatitude;
    private Double garageLongitude;
    private String garageName;

    private List<BoardingPointDTO> points;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleRef {
        private UUID id;
        private String name;
    }

    public static RouteDTO fromEntity(Route r) {
        if (r == null) return null;

        SimpleRef unitRef = null;
        try {
            if (r.getUnit() != null) {
                unitRef = new SimpleRef(r.getUnit().getId(), r.getUnit().getName());
            }
        } catch (Exception ignored) {}

        SimpleRef locRef = null;
        try {
            if (r.getLocation() != null) {
                locRef = new SimpleRef(r.getLocation().getId(), r.getLocation().getName());
            }
        } catch (Exception ignored) {}

        SimpleRef clientRef = null;
        try {
            if (r.getClient() != null) {
                clientRef = new SimpleRef(r.getClient().getId(), r.getClient().getName());
            }
        } catch (Exception ignored) {}

        List<BoardingPointDTO> pointsList = new ArrayList<>();
        try {
            if (r.getPoints() != null) {
                pointsList = r.getPoints().stream()
                        .map(BoardingPointDTO::fromEntity)
                        .collect(Collectors.toList());
            }
        } catch (Exception ignored) {}

        Long durationSeconds = null;
        if (r.getEstimatedDuration() != null) {
            durationSeconds = r.getEstimatedDuration().getSeconds();
        }

        return RouteDTO.builder()
                .id(r.getId())
                .companyId(r.getCompanyId())
                .code(r.getCode())
                .name(r.getName())
                .description(r.getDescription())
                .color(r.getColor())
                .status(r.getStatus())
                .capacity(r.getCapacity())
                .unit(unitRef)
                .location(locRef)
                .client(clientRef)
                .estimatedDuration(durationSeconds)
                .checkpointsRequired(r.isCheckpointsRequired())
                .geofenceEnabled(r.isGeofenceEnabled())
                .defaultRadiusMeters(r.getDefaultRadiusMeters())
                .originCep(r.getOriginCep())
                .originAddress(r.getOriginAddress())
                .destinationCep(r.getDestinationCep())
                .destinationAddress(r.getDestinationAddress())
                .shift(r.getShift())
                .executionTime(r.getExecutionTime())
                .distanceKm(r.getDistanceKm())
                .scheduledStartTime(r.getScheduledStartTime())
                .scheduledEndTime(r.getScheduledEndTime())
                .garageLatitude(r.getGarageLatitude())
                .garageLongitude(r.getGarageLongitude())
                .garageName(r.getGarageName())
                .points(pointsList)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}

