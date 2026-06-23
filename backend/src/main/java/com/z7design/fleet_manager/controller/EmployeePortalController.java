package com.z7design.fleet_manager.controller;

/*
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.service.*;
import com.z7design.fleet_manager.dto.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/employee-portal")
@RequiredArgsConstructor
@Slf4j
public class EmployeePortalController {

    private final EmployeeService employeeService;
    private final TimeRecordService timeRecordService;
    private final PayslipService payslipService;
    private final DocumentService documentService;
    private final TrainingService trainingService;
    private final VacationService vacationService;
    private final NotificationService notificationService;

    // ========== DADOS DO FUNCIONÁRIO ==========
    
    @GetMapping("/profile")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<EmployeeProfileDTO> getEmployeeProfile(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        return ResponseEntity.ok(EmployeeProfileDTO.fromEntity(employee));
    }

    // ========== PONTO ELETRÔNICO ==========
    
    @GetMapping("/time-records/current-month")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<TimeRecordDTO>> getCurrentMonthTimeRecords(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        YearMonth currentMonth = YearMonth.now();
        LocalDate startDate = currentMonth.atDay(1);
        LocalDate endDate = currentMonth.atEndOfMonth();
        
        List<TimeRecord> records = timeRecordService.findByEmployeeAndDateRange(employee.getId(), startDate, endDate);
        List<TimeRecordDTO> dtos = records.stream()
                .map(TimeRecordDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/time-records/punch")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<TimeRecordDTO> registerPunch(@AuthenticationPrincipal User user,
                                                      @RequestBody PunchRequestDTO request) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        TimeRecord timeRecord = timeRecordService.registerPunch(
            employee.getId(),
            request.getPunchType(),
            request.getLatitude(),
            request.getLongitude(),
            request.getPhotoBase64()
        );
        
        return ResponseEntity.ok(TimeRecordDTO.fromEntity(timeRecord));
    }

    @GetMapping("/time-records/balance")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<TimeBalanceDTO> getTimeBalance(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        TimeBalanceDTO balance = timeRecordService.calculateBalance(employee.getId());
        return ResponseEntity.ok(balance);
    }

    // ========== HOLERITES ==========
    
    @GetMapping("/payslips")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<PayslipDTO>> getPayslips(@AuthenticationPrincipal User user,
                                                       @RequestParam(defaultValue = "12") int months) {
        Employee employee = employeeService.findByUserId(user.getId());
        LocalDate startDate = LocalDate.now().minusMonths(months);
        
        List<Payslip> payslips = payslipService.findByEmployeeAndDateRange(employee.getId(), startDate, LocalDate.now());
        List<PayslipDTO> dtos = payslips.stream()
                .map(PayslipDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/payslips/{payslipId}/download")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<byte[]> downloadPayslip(@AuthenticationPrincipal User user,
                                                 @PathVariable UUID payslipId) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        // Verificar se o holerite pertence ao funcionário
        Payslip payslip = payslipService.findById(payslipId);
        if (!payslip.getEmployee().getId().equals(employee.getId())) {
            return ResponseEntity.forbidden().build();
        }
        
        byte[] pdfContent = payslipService.generatePDF(payslipId);
        
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=holerite_" + 
                        payslip.getReferenceMonth() + ".pdf")
                .body(pdfContent);
    }

    // ========== DOCUMENTOS ==========
    
    @GetMapping("/documents")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<DocumentDTO>> getEmployeeDocuments(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        List<Document> documents = documentService.findByEmployee(employee.getId());
        List<DocumentDTO> dtos = documents.stream()
                .map(DocumentDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/documents/{documentId}/download")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<byte[]> downloadDocument(@AuthenticationPrincipal User user,
                                                   @PathVariable UUID documentId) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        // Verificar se o documento pertence ao funcionário
        Document document = documentService.findById(documentId);
        if (!document.getEmployee().getId().equals(employee.getId())) {
            return ResponseEntity.forbidden().build();
        }
        
        byte[] fileContent = documentService.downloadFile(documentId);
        
        return ResponseEntity.ok()
                .header("Content-Type", document.getFileType())
                .header("Content-Disposition", "attachment; filename=" + document.getFileName())
                .body(fileContent);
    }

    @PostMapping("/documents")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<DocumentDTO> uploadDocument(@AuthenticationPrincipal User user,
                                                     @ModelAttribute DocumentUploadDTO request) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        Document document = documentService.uploadEmployeeDocument(
            employee.getId(),
            request.getDocumentType(),
            request.getFile(),
            request.getExpirationDate(),
            request.getDescription()
        );
        
        return ResponseEntity.ok(DocumentDTO.fromEntity(document));
    }

    // ========== TREINAMENTOS ==========
    
    @GetMapping("/trainings")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<TrainingDTO>> getEmployeeTrainings(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        List<TrainingParticipation> participations = trainingService.findByEmployee(employee.getId());
        List<TrainingDTO> dtos = participations.stream()
                .map(tp -> TrainingDTO.fromParticipation(tp))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/trainings/expiring")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<TrainingDTO>> getExpiringTrainings(@AuthenticationPrincipal User user,
                                                                  @RequestParam(defaultValue = "90") int days) {
        Employee employee = employeeService.findByUserId(user.getId());
        LocalDate cutoffDate = LocalDate.now().plusDays(days);
        
        List<TrainingParticipation> expiring = trainingService.findExpiringByEmployee(employee.getId(), cutoffDate);
        List<TrainingDTO> dtos = expiring.stream()
                .map(tp -> TrainingDTO.fromParticipation(tp))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/trainings/{trainingId}/confirm-participation")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> confirmTrainingParticipation(@AuthenticationPrincipal User user,
                                                             @PathVariable UUID trainingId,
                                                             @RequestBody TrainingConfirmationDTO confirmation) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        trainingService.confirmParticipation(
            employee.getId(),
            trainingId,
            confirmation.getConfirmed(),
            confirmation.getObservations()
        );
        
        return ResponseEntity.ok().build();
    }

    // ========== SOLICITAÇÃO DE FÉRIAS ==========
    
    @GetMapping("/vacations")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<VacationDTO>> getEmployeeVacations(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        List<Vacation> vacations = vacationService.findByEmployee(employee.getId());
        List<VacationDTO> dtos = vacations.stream()
                .map(VacationDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/vacations/balance")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<VacationBalanceDTO> getVacationBalance(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        VacationBalanceDTO balance = vacationService.calculateBalance(employee.getId());
        return ResponseEntity.ok(balance);
    }

    @PostMapping("/vacations/request")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<VacationDTO> requestVacation(@AuthenticationPrincipal User user,
                                                        @RequestBody VacationRequestDTO request) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        Vacation vacation = vacationService.createRequest(
            employee.getId(),
            request.getStartDate(),
            request.getEndDate(),
            request.getVacationType(),
            request.getObservations()
        );
        
        return ResponseEntity.ok(VacationDTO.fromEntity(vacation));
    }

    @PutMapping("/vacations/{vacationId}/cancel")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> cancelVacationRequest(@AuthenticationPrincipal User user,
                                                      @PathVariable UUID vacationId) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        // Verificar se a solicitação pertence ao funcionário e pode ser cancelada
        Vacation vacation = vacationService.findById(vacationId);
        if (!vacation.getEmployee().getId().equals(employee.getId()) || 
            !vacation.getStatus().equals(VacationStatus.PENDING)) {
            return ResponseEntity.badRequest().build();
        }
        
        vacationService.cancelRequest(vacationId);
        return ResponseEntity.ok().build();
    }

    // ========== NOTIFICAÇÕES ==========
    
    @GetMapping("/notifications")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<NotificationDTO>> getNotifications(@AuthenticationPrincipal User user,
                                                                @RequestParam(defaultValue = "false") boolean unreadOnly) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        List<Notification> notifications = notificationService.findByEmployee(employee.getId(), unreadOnly);
        List<NotificationDTO> dtos = notifications.stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/notifications/{notificationId}/read")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> markNotificationAsRead(@AuthenticationPrincipal User user,
                                                     @PathVariable UUID notificationId) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        // Verificar se a notificação pertence ao funcionário
        Notification notification = notificationService.findById(notificationId);
        if (!notification.getEmployee().getId().equals(employee.getId())) {
            return ResponseEntity.forbidden().build();
        }
        
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/notifications/mark-all-read")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> markAllNotificationsAsRead(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        notificationService.markAllAsRead(employee.getId());
        return ResponseEntity.ok().build();
    }

    // ========== DASHBOARD ==========
    
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<EmployeeDashboardDTO> getDashboard(@AuthenticationPrincipal User user) {
        Employee employee = employeeService.findByUserId(user.getId());
        
        EmployeeDashboardDTO dashboard = EmployeeDashboardDTO.builder()
                .profile(EmployeeProfileDTO.fromEntity(employee))
                .timeBalance(timeRecordService.calculateBalance(employee.getId()))
                .vacationBalance(vacationService.calculateBalance(employee.getId()))
                .recentPayslips(payslipService.findRecentByEmployee(employee.getId(), 3).stream()
                        .map(PayslipDTO::fromEntity)
                        .collect(Collectors.toList()))
                .expiringTrainings(trainingService.findExpiringByEmployee(employee.getId(), 
                        LocalDate.now().plusDays(30)).stream()
                        .map(tp -> TrainingDTO.fromParticipation(tp))
                        .collect(Collectors.toList()))
                .pendingDocuments(documentService.findPendingByEmployee(employee.getId()).stream()
                        .map(DocumentDTO::fromEntity)
                        .collect(Collectors.toList()))
                .unreadNotifications(notificationService.findByEmployee(employee.getId(), true).stream()
                        .map(NotificationDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
        
        return ResponseEntity.ok(dashboard);
    }
}
*/
