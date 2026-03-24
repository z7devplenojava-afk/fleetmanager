package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkPostAssignmentRequest {
    
    private UUID employeeId;
    private UUID workPostId;
    private LocalDate assignmentDate;
    private String shiftType; // DAY, NIGHT, MIXED, etc.
    private LocalTime startTime;
    private LocalTime endTime;
    private String observations;
    private String specialInstructions;
    private Boolean isPrimaryAssignment;
    private Boolean isBackupAssignment;
}


























