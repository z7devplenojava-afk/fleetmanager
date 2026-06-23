package com.z7design.fleet_manager.dto;

import java.time.Duration;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeBalanceDTO {
    private Duration totalWorked;
    private Duration totalExpected;
    private Duration balance;
    private int overtimeHours;
    private int absentDays;
    private int lateArrivals;
    private int earlyDepartures;
    private String currentMonth;
    private Double overtimeValue;
    private Double totalOvertimeValue;
}
