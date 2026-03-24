package com.z7design.fleet_manager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTimeRecordRequest {

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    @NotNull(message = "Record type is required")
    private String type; // ENTRY, BREAK_START, BREAK_END, EXIT

    private Double latitude;

    private Double longitude;

    private String deviceInfo;
}
