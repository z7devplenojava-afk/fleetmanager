package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.TripEvent;
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
public class TripEventDTO {
    private UUID id;
    private UUID tripId;
    private String tripName;
    private TripEvent.TripEventType type;
    private LocalDateTime timestamp;
    private Double latitude;
    private Double longitude;
    private String observations;
    private String driverName;
    private String vehiclePlate;
}
