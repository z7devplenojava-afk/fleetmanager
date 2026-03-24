package com.z7design.fleet_manager.dto;

import com.z7design.fleet_manager.model.enums.JourneyType;
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
public class DriverJourneyDTO {
    private UUID id;
    private UUID driverId;
    private String driverName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private JourneyType type;
    private String source;
    private String notes;
    private Long durationMinutes;
}
