package com.z7design.fleet_manager.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacationBalanceDTO {
    private Integer totalDays;
    private Integer usedDays;
    private Integer availableDays;
    private Integer daysInProgress;
    private LocalDate nextAcquisitionDate;
    private Integer daysToNextAcquisition;
    private Double proportionalDays;
    private String period;
    private LocalDate lastVacationDate;
    private LocalDate nextVacationLimitDate;
}
