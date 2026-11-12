package com.z7design.fleet_manager.controller;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import java.util.Optional;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.VacationStatus;
import com.z7design.fleet_manager.service.*;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.dto.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/employee-portal")
@RequiredArgsConstructor
@Slf4j
public class EmployeePortalController {

    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final TimeRecordService timeRecordService;
    private final PayslipService payslipService;
    private final DocumentService documentService;
    private final SSTTrainingService sstTrainingService;
    private final VacationService vacationService;
    private final NotificationService notificationService;
    private final EPIDeliveryFormService epiDeliveryFormService;
    private final EPIDeliveryPdfService epiDeliveryPdfService;
    private final BenefitService benefitService;

    private Employee resolveEmployee(com.z7design.fleet_manager.model.User user) {
        if (user == null || user.getId() == null) return null;
        try {
            Optional<Employee> byUserId = employeeRepository.findByUserId(user.getId());
            if (byUserId.isPresent()) return byUserId.get();

            List<Employee> byUser = employeeRepository.findByUser(user);
            if (!byUser.isEmpty()) return byUser.get(0);

            if (user.getEmail() != null && !user.getEmail().isBlank()) {
                Optional<Employee> byEmail = employeeRepository.findByEmail(user.getEmail().trim());
                if (byEmail.isPresent()) return byEmail.get();
            }

            if (user.getName() != null && !user.getName().isBlank()) {
                Optional<Employee> byName = employeeRepository.findByNameIgnoreCase(user.getName().trim());
                if (byName.isPresent()) return byName.get();
            }

            try {
                return employeeService.findById(user.getId());
            } catch (Exception ignored) {}

            return null;
        } catch (Exception e) {
            log.warn("Nenhum funcionário vinculado ao usuário {}: {}", user.getId(), e.getMessage());
            return null;
        }
    }

    // ========== DADOS DO FUNCIONÁRIO ==========
    
    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<EmployeeProfileDTO> getEmployeeProfile(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(EmployeeProfileDTO.fromEntity(employee));
    }

    // ========== PONTO ELETRÔNICO ==========
    
    @GetMapping("/time-records/current-month")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<TimeRecordDTO>> getCurrentMonthTimeRecords(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        YearMonth currentMonth = YearMonth.now();
        LocalDate startDate = currentMonth.atDay(1);
        LocalDate endDate = currentMonth.atEndOfMonth();
        
        List<TimeRecord> records = timeRecordService.getRecordsByPeriod(employee.getId(), startDate, endDate);
        List<TimeRecordDTO> dtos = records.stream()
                .map(TimeRecordDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/time-records/punch")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<TimeRecordDTO> registerPunch(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                      @RequestBody PunchRequestDTO request) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.badRequest().build();
        }
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
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<TimeBalanceDTO> getTimeBalance(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(null);
        }
        TimeBalanceDTO balance = timeRecordService.calculateBalance(employee.getId());
        return ResponseEntity.ok(balance);
    }

    // ========== HOLERITES ==========
    
    @GetMapping("/payslips")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<PayslipDTO>> getPayslips(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                       @RequestParam(defaultValue = "12") int months) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        LocalDate startDate = LocalDate.now().minusMonths(months);
        
        List<Payslip> payslips = payslipService.findByEmployeeIdAndDateRange(employee.getId(), startDate, LocalDate.now());
        List<PayslipDTO> dtos = payslips.stream()
                .map(PayslipDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/payslips/{payslipId}/download")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<byte[]> downloadPayslip(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                 @PathVariable UUID payslipId) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.notFound().build();
        }
        
        Payslip payslip = payslipService.getPayslipById(payslipId);
        if (payslip == null) {
            return ResponseEntity.notFound().build();
        }
        
        byte[] pdfContent = payslipService.generatePayslipPdf(payslipId);
        
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=holerite_" + 
                        payslip.getMonth() + "_" + payslip.getYear() + ".pdf")
                .body(pdfContent);
    }

    // ========== DOCUMENTOS ==========
    
    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<DocumentDTO>> getEmployeeDocuments(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        
        List<Document> documents = documentService.findByEmployeeId(employee.getId());
        List<DocumentDTO> dtos = documents.stream()
                .map(DocumentDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/documents/{documentId}/download")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<byte[]> downloadDocument(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                   @PathVariable UUID documentId) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        
        Document document = documentService.findById(documentId);
        if (document.getEmployee() != null && !document.getEmployee().getId().equals(employee.getId())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok()
                .header("Content-Type", "application/octet-stream")
                .header("Content-Disposition", "attachment; filename=" + 
                        (document.getFileName() != null ? document.getFileName() : "documento"))
                .body(documentService.downloadFile(documentId));
    }

    // ========== TREINAMENTOS ==========
    
    @GetMapping("/trainings")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<TrainingDTO>> getEmployeeTrainings(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        
        List<TrainingParticipation> participations = sstTrainingService.getParticipationsByEmployee(employee.getId());
        List<TrainingDTO> dtos = participations.stream()
                .map(tp -> TrainingDTO.fromParticipation(tp))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/trainings/expiring")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<TrainingDTO>> getExpiringTrainings(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                                  @RequestParam(defaultValue = "90") int days) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        LocalDate cutoffDate = LocalDate.now().plusDays(days);
        
        List<TrainingParticipation> expiring = sstTrainingService.findExpiringByEmployee(employee.getId(), cutoffDate);
        List<TrainingDTO> dtos = expiring.stream()
                .map(tp -> TrainingDTO.fromParticipation(tp))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/trainings/{trainingId}/confirm-participation")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<Void> confirmTrainingParticipation(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                             @PathVariable UUID trainingId,
                                                             @RequestBody TrainingConfirmationDTO confirmation) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.badRequest().build();
        }
        
        sstTrainingService.completeTraining(trainingId, LocalDate.now(), null);
        
        return ResponseEntity.ok().build();
    }

    // ========== SOLICITAÇÃO DE FÉRIAS ==========
    
    @GetMapping("/vacations")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<VacationDTO>> getEmployeeVacations(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        
        List<Vacation> vacations = vacationService.findByEmployeeId(employee.getId());
        List<VacationDTO> dtos = vacations.stream()
                .map(VacationDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/vacations/balance")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<VacationBalanceDTO> getVacationBalance(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(null);
        }
        VacationBalanceDTO balance = vacationService.calculateBalance(employee.getId());
        return ResponseEntity.ok(balance);
    }

    @PostMapping("/vacations/request")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<VacationDTO> requestVacation(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                        @RequestBody VacationRequestDTO request) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.badRequest().build();
        }

        // Regra de Negócio: Somente é permitido solicitar férias com mais de 12 meses de empresa baseado na data de admissão
        LocalDate hireDate = employee.getHireDate();
        if (hireDate == null || hireDate.plusMonths(12).isAfter(LocalDate.now())) {
            LocalDate elegivelEm = hireDate != null ? hireDate.plusMonths(12) : null;
            String msg = elegivelEm != null 
                ? "Solicitação não permitida. Você deve ter no mínimo 12 meses de empresa (admitido em: " 
                  + hireDate + "). Elegível a partir de: " + elegivelEm 
                : "Solicitação não permitida. Data de admissão não configurada ou período aquisitivo incompleto.";
            return ResponseEntity.badRequest().header("X-Error-Message", msg).build();
        }
        
        Vacation vacation = new Vacation();
        vacation.setEmployee(employee);
        vacation.setStartDate(request.getStartDate());
        vacation.setEndDate(request.getEndDate());
        vacation.setVacationType(request.getVacationType());
        vacation.setStatus(VacationStatus.PENDING);
        // Calculate days taken
        long days = java.time.temporal.ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
        vacation.setDaysTaken((int) days);
        vacation.setRemainingDays(Math.max(1, 30 - (int) days));
        
        Vacation created = vacationService.create(vacation);
        
        return ResponseEntity.ok(VacationDTO.fromEntity(created));
    }

    @PutMapping("/vacations/{vacationId}/cancel")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<Void> cancelVacationRequest(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                      @PathVariable UUID vacationId) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Vacation vacation = vacationService.findById(vacationId);
        if (!vacation.getEmployee().getId().equals(employee.getId()) || 
            !vacation.getStatus().equals(VacationStatus.PENDING)) {
            return ResponseEntity.badRequest().build();
        }
        
        vacationService.cancelVacation(vacationId);
        return ResponseEntity.ok().build();
    }

    // ========== NOTIFICAÇÕES ==========
    
    @GetMapping("/notifications")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<NotificationDTO>> getNotifications(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                                @RequestParam(defaultValue = "false") boolean unreadOnly) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        
        List<Notification> notifications = notificationService.findByEmployee(employee.getId(), unreadOnly);
        List<NotificationDTO> dtos = notifications.stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/notifications/{notificationId}/read")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<Void> markNotificationAsRead(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user,
                                                     @PathVariable UUID notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/notifications/mark-all-read")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<Void> markAllNotificationsAsRead(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok().build();
        }
        notificationService.markAllAsRead(employee.getId());
        return ResponseEntity.ok().build();
    }

    // ========== DASHBOARD ==========
    
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<Map<String, Object>> getDashboard(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        Map<String, Object> dashboard = new java.util.HashMap<>();
        
        if (employee == null) {
            dashboard.put("profile", null);
            dashboard.put("timeBalance", null);
            dashboard.put("vacationBalance", null);
            dashboard.put("recentPayslips", Collections.emptyList());
            dashboard.put("expiringTrainings", Collections.emptyList());
            dashboard.put("pendingDocuments", Collections.emptyList());
            dashboard.put("unreadNotifications", Collections.emptyList());
            dashboard.put("hasTimePunchToday", false);
            dashboard.put("lastTimePunch", null);
            return ResponseEntity.ok(dashboard);
        }
        
        // Verificar se há registro de ponto hoje
        List<TimeRecord> todayRecords = timeRecordService.getTodayRecords(employee.getId());
        boolean hasTimePunchToday = !todayRecords.isEmpty();
        
        // Último registro de ponto
        TimeRecord lastRecord = todayRecords.isEmpty() ? null : todayRecords.get(0);
        
        // Saldo de horas
        TimeBalanceDTO timeBalance = null;
        try {
            timeBalance = timeRecordService.calculateBalance(employee.getId());
        } catch (Exception e) {
            log.warn("Erro ao calcular saldo de horas para funcionário {}: {}", employee.getName(), e.getMessage());
        }
        
        // Saldo de férias
        VacationBalanceDTO vacationBalance = null;
        try {
            vacationBalance = vacationService.calculateBalance(employee.getId());
        } catch (Exception e) {
            log.warn("Erro ao calcular saldo de férias para funcionário {}: {}", employee.getName(), e.getMessage());
        }
        
        // Holerites recentes (últimos 3 meses)
        List<Payslip> recentPayslips = payslipService.findByEmployeeIdAndDateRange(
                employee.getId(), LocalDate.now().minusMonths(3), LocalDate.now());
        List<PayslipDTO> payslipDtos = recentPayslips.stream()
                .map(PayslipDTO::fromEntity)
                .collect(Collectors.toList());
        
        // Treinamentos a vencer (próximos 30 dias)
        List<TrainingParticipation> expiringTrainings = sstTrainingService.findExpiringByEmployee(
                employee.getId(), LocalDate.now().plusDays(30));
        List<TrainingDTO> trainingDtos = expiringTrainings.stream()
                .map(tp -> TrainingDTO.fromParticipation(tp))
                .collect(Collectors.toList());
        
        // Documentos pendentes
        List<Document> pendingDocs = documentService.findPendingDocumentsByEmployeeId(employee.getId());
        List<DocumentDTO> docDtos = pendingDocs.stream()
                .map(DocumentDTO::fromEntity)
                .collect(Collectors.toList());
        
        // Notificações não lidas
        List<Notification> unreadNotifications = notificationService.findByEmployee(employee.getId(), true);
        List<NotificationDTO> notifDtos = unreadNotifications.stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
        
        // Profile
        EmployeeProfileDTO profile = EmployeeProfileDTO.fromEntity(employee);
        
        dashboard.put("profile", profile);
        dashboard.put("timeBalance", timeBalance);
        dashboard.put("vacationBalance", vacationBalance);
        dashboard.put("recentPayslips", payslipDtos);
        dashboard.put("expiringTrainings", trainingDtos);
        dashboard.put("pendingDocuments", docDtos);
        dashboard.put("unreadNotifications", notifDtos);
        dashboard.put("hasTimePunchToday", hasTimePunchToday);
        dashboard.put("lastTimePunch", lastRecord != null ? TimeRecordDTO.fromEntity(lastRecord) : null);
        
        return ResponseEntity.ok(dashboard);
    }

    // ========== FICHAS DE EPI DO FUNCIONÁRIO ==========

    @GetMapping("/epi-forms")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<EPIDeliveryFormDTO>> getEmployeeEpiForms(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        try {
            List<EPIDeliveryFormDTO> forms = epiDeliveryFormService.findByEmployeeId(employee.getId());
            return ResponseEntity.ok(forms != null ? forms : Collections.emptyList());
        } catch (Exception e) {
            log.warn("Erro ao buscar fichas de EPI do funcionário {}: {}", employee.getName(), e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/epi-forms/{id}/pdf")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<byte[]> downloadEmployeeEpiPdf(
            @PathVariable UUID id,
            @RequestParam(value = "orientation", defaultValue = "portrait") String orientation,
            @AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.status(403).build();
        }
        try {
            com.z7design.fleet_manager.model.EPIDeliveryForm form = epiDeliveryFormService.findByIdEntity(id);
            if (form == null || (form.getEmployee() != null && !form.getEmployee().getId().equals(employee.getId()))) {
                // Bloqueia se o formulário pertencer a outro funcionário
                return ResponseEntity.status(403).build();
            }
            boolean landscape = "landscape".equalsIgnoreCase(orientation) || "paisagem".equalsIgnoreCase(orientation);
            byte[] pdf = epiDeliveryPdfService.generateEPIDeliveryPdfFromForm(form, landscape);
            String fileName = "ficha-epi-" + id + ".pdf";
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .body(pdf);
        } catch (Exception e) {
            log.error("Erro ao gerar PDF da ficha de EPI para o funcionário: {}", e.getMessage(), e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== BENEFÍCIOS DO FUNCIONÁRIO ==========

    @GetMapping("/benefits")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'COLABORADOR')")
    public ResponseEntity<List<Benefit>> getEmployeeBenefits(@AuthenticationPrincipal com.z7design.fleet_manager.model.User user) {
        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        try {
            List<Benefit> benefits = benefitService.findByEmployeeId(employee.getId());
            if (benefits == null || benefits.isEmpty()) {
                if (employee.getPosition() != null) {
                    benefits = benefitService.findByPositionId(employee.getPosition().getId());
                }
            }
            if (benefits == null || benefits.isEmpty()) {
                benefits = benefitService.findActiveBenefits();
            }
            return ResponseEntity.ok(benefits != null ? benefits : Collections.emptyList());
        } catch (Exception e) {
            log.warn("Erro ao buscar benefícios do funcionário {}: {}", employee.getName(), e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
}
