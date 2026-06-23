package com.z7design.fleet_manager.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDashboardDTO {
    private EmployeeProfileDTO profile;
    private TimeBalanceDTO timeBalance;
    private VacationBalanceDTO vacationBalance;
    private List<PayslipDTO> recentPayslips;
    private List<TrainingDTO> expiringTrainings;
    private List<DocumentDTO> pendingDocuments;
    private List<NotificationDTO> unreadNotifications;
    private Integer pendingVacationRequests;
    private Integer pendingDocumentsCount;
    private Integer expiringTrainingsCount;
    private Boolean hasTimePunchToday;
    private String lastTimePunch;
}
