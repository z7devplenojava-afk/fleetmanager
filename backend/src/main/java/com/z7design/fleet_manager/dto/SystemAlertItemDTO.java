package com.z7design.fleet_manager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemAlertItemDTO {
    private String id;
    @Builder.Default
    private String module = "FROTA"; // FINANCEIRO | RH | FROTA | EMPRESA
    private String entityType; // VEHICLE | DRIVER | COMPANY | FINANCIAL | EMPLOYEE
    private String category; // PREVENTIVE | VEHICLE_DOCUMENT | DRIVER_DOCUMENT | TIRE_CHANGE | OIL_CHANGE | COMPANY_DOCUMENT
    private String categoryLabel;
    private String priority; // CRITICAL | HIGH | MEDIUM | LOW
    private Integer priorityRank; // 1..4
    private String subjectTitle;
    private String subjectSubtitle;
    private LocalDate dueDate;
    private Long daysRemaining;
    private Integer kmRemaining;
    private String statusText;
    private String routeTo;
}

