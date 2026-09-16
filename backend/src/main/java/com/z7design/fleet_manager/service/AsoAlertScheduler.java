package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import com.z7design.fleet_manager.model.enums.NotificationType;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.NotificationRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PRD 1.0 - MÓDULO 4 (RF-04.2): Gestão de SST & Exames Ocupacionais.
 * Alerta de vencimento de exames com 30 dias de antecedência — ASO
 * (Exame Clínico, Audiometria, Hemograma, Glicemia, Oftalmologia, ECG,
 * Toxicológico) e CNH com EAR.
 *
 * Mesmo padrão do MaintenanceAlertScheduler: notificação in-app por
 * supervisor/admin da empresa, dedupe por usuário/dia.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AsoAlertScheduler {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Value("${app.aso-alerts.cron:0 45 7 * * ?}")
    private String cron;

    /**
     * Executa diariamente às 07:45. Vencidos e vencendo em até 30 dias.
     */
    @Scheduled(cron = "${app.aso-alerts.cron:0 45 7 * * ?}")
    @Transactional
    public void checkExpiringExams() {
        log.info("Verificação diária de ASO/CNH vencendo (30 dias)");
        try {
            int aso = notifyExpiringAso();
            int cnh = notifyExpiringCnh();
            log.info("Alertas SST: {} ASO, {} CNH", aso, cnh);
        } catch (Exception e) {
            log.error("Erro na verificação de exames: {}", e.getMessage(), e);
        }
    }

    /**
     * Público para execução manual (endpoint admin).
     */
    @Transactional
    public int notifyExpiringAso() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);

        List<Employee> expiring = employeeRepository.findAll().stream()
                .filter(e -> e.getStatus() == com.z7design.fleet_manager.model.enums.EmploymentStatus.ACTIVE)
                .filter(e -> e.getExameMedicoData() != null)
                .filter(e -> {
                    LocalDate asoDate = e.getExameMedicoData();
                    // ASO válido por 1 ano a partir da data do exame (periodicidade padrão)
                    LocalDate expiresAt = asoDate.plusYears(1);
                    return !expiresAt.isBefore(today) && expiresAt.isBefore(limit);
                })
                .toList();

        if (expiring.isEmpty()) {
            return 0;
        }
        return notifySst("🩺 ASO Vencendo em 30 dias", expiring, today, "ASO");
    }

    /**
     * CNH vencendo em 30 dias (condutores).
     */
    @Transactional
    public int notifyExpiringCnh() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);

        List<Employee> expiring = employeeRepository.findAll().stream()
                .filter(e -> e.getStatus() == com.z7design.fleet_manager.model.enums.EmploymentStatus.ACTIVE)
                .filter(e -> e.getCnhExpirationDate() != null)
                .filter(e -> !e.getCnhExpirationDate().isBefore(today)
                        && e.getCnhExpirationDate().isBefore(limit))
                .toList();

        if (expiring.isEmpty()) {
            return 0;
        }
        return notifySst("🚗 CNH Vencendo em 30 dias", expiring, today, "CNH");
    }

    private int notifySst(String title, List<Employee> employees, LocalDate today, String kind) {
        int total = 0;
        // Agrupa por empresa do funcionário (tenant)
        Map<UUID, List<Employee>> byCompany = employees.stream()
                .filter(e -> e.getCompanyId() != null)
                .collect(Collectors.groupingBy(Employee::getCompanyId));

        for (Map.Entry<UUID, List<Employee>> entry : byCompany.entrySet()) {
            UUID companyId = entry.getKey();
            List<Employee> list = entry.getValue();

            List<User> recipients = userRepository.findSupervisors().stream()
                    .filter(User::isActive)
                    .filter(u -> u.getCompanyId() == null || companyId.equals(u.getCompanyId()))
                    .toList();

            for (User user : recipients) {
                try {
                    String fullTitle = title + " — " + today.format(DATE_FMT);
                    if (notificationRepository.existsMaintenanceAlertToday(
                            user.getId(), fullTitle, today.atStartOfDay())) {
                        continue;
                    }
                    Notification notification = Notification.builder()
                            .user(user)
                            .title(fullTitle)
                            .message(buildBody(kind, list))
                            .type(NotificationType.SYSTEM)
                            .status(NotificationStatus.UNREAD)
                            .companyId(companyId)
                            .build();
                    notificationRepository.save(notification);
                    total++;
                } catch (Exception e) {
                    log.error("Erro ao notificar usuário {}: {}", user.getId(), e.getMessage());
                }
            }
        }
        return total;
    }

    private String buildBody(String kind, List<Employee> employees) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%d colaborador(es) com %s vencendo/vencido em até 30 dias:%n%n", employees.size(), kind));
        for (Employee e : employees) {
            LocalDate date = "ASO".equals(kind) ? e.getExameMedicoData().plusYears(1) : e.getCnhExpirationDate();
            sb.append(String.format("• %s — vence em %s%n", e.getName(), date.format(DATE_FMT)));
        }
        return sb.toString();
    }
}
