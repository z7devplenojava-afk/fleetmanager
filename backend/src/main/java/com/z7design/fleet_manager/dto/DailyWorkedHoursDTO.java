package com.z7design.fleet_manager.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class DailyWorkedHoursDTO {
    private LocalDate date;
    private String entry;
    private String exitLunch;
    private String returnLunch;
    private String exit;
    private String totalWorked;
    private String status; // NORMAL, EXTRA, ABSENCE
}
