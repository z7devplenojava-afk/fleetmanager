package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationCoverageResponse {

    private UUID id;
    private SimpleEmployee employee;
    private SimpleEmployee substituteEmployee;
    private LocalDate startDate;
    private LocalDate endDate;
    private SimpleWorkPost location;
    private String shift;
    private String status;
    private String observations;
    private Boolean isConfirmed;
    private UUID confirmedById;
    private LocalDateTime confirmationDate;
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


























