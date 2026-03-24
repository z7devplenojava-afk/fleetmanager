package com.z7design.fleet_manager.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class WorkedHoursReportDTO {
    private String employeeName;
    private String period;
    private List<DailyWorkedHoursDTO> days;
    private String totalHours;
    private String totalExtraHours;
}
