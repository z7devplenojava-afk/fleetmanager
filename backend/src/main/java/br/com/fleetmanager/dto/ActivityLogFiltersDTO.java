package br.com.fleetmanager.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ActivityLogFiltersDTO {
    private String username;
    private String action;
    private String module;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
}
