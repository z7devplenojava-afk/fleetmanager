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
public class WorkPostAssignmentResponse {

    private UUID id;
    private SimpleEmployee employee;
    private SimpleWorkPost workPost;
    private LocalDate assignmentDate;
    private String shift;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private Boolean primaryAssignment;
    private Boolean backupAssignment;
    private String observations;
    private String specialInstructions;
    private UUID assignedById;
    private LocalDateTime assignmentDateTime;
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
}


