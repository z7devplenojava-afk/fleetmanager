package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecificActivityResponse {

    private UUID id;
    private SimpleEmployee employee;
    private String activityType;
    private LocalDate activityDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private SimpleWorkPost location;
    private String description;
    private String observations;
    private String status;
    private Boolean isCompleted;
    private String completionNotes;
    private SimpleUser assignedBy;
    private SimpleUser supervisedBy;
    private LocalDateTime completionDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleEmployee {
        private UUID id;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleWorkPost {
        private UUID id;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleUser {
        private UUID id;
        private String name;
    }
}


























