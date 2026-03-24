package com.z7design.fleet_manager.dto.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientTimelineEventDTO {
    private String id;
    private String type; // BOARDING, DEBOARDING, START_ROUTE, STOP_ROUTE, ALERT, MESSAGE
    private String title;
    private String description;
    private LocalDateTime timestamp;
    private String vehiclePlate;
    private String employeeName;
    private String icon; // Material Icon name
    private String status; // SUCCESS, WARNING, DANGER, INFO
}
