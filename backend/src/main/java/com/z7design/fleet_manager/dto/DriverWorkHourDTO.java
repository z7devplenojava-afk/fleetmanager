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
public class DriverWorkHourDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeDocument;
    private LocalDate referenceDate;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer totalMinutes;
    private Integer waitMinutes;
    private Integer nightMinutes;
    private Integer nightReducedMinutes;
    private Integer overtimeMinutes;
    private Integer contractDailyMinutes;

    // 4 Pegadas
    private LocalDateTime pegada1Start;
    private LocalDateTime pegada1End;
    private LocalDateTime pegada2Start;
    private LocalDateTime pegada2End;
    private LocalDateTime pegada3Start;
    private LocalDateTime pegada3End;
    private LocalDateTime pegada4Start;
    private LocalDateTime pegada4End;

    private String source; // PONTO, PARTE_DIARIA, HIBRIDO, MANUAL
    private UUID companyId;
    private String notes;
    private Boolean isClosed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
