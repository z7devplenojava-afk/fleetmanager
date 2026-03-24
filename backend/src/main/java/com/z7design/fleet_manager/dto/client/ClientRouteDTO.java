package com.z7design.fleet_manager.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientRouteDTO {
    private String id;
    private String name;
    private String status; // ACTIVE, SCHEDULED, COMPLETED, DELAYED
    private String vehiclePlate;
    private String driverName;
    private String driverPhotoUrl;
    private Double progress; // 0-100
    private LocalDateTime startTime;
    private LocalDateTime estimatedEndTime;
    private Integer passengersOnBoard;
    private Integer totalSeats;
    private String currentLocation;
    private List<String> nextStops;
}
