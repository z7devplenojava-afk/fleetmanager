package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.OverdueMaintenanceAlertDTO;
import com.z7design.fleet_manager.model.Message;
import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import com.z7design.fleet_manager.model.enums.MessageStatus;
import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import com.z7design.fleet_manager.model.enums.NotificationType;
import com.z7design.fleet_manager.repository.MessageRepository;
import com.z7design.fleet_manager.repository.NotificationRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
 * Verifica diariamente os planos de manutenção preventiva VENCIDOS e PRÓXIMOS
 * DO VENCIMENTO (≤ 7 dias / ≤ 500 km) e notifica os supervisores/administradores
 * da empresa responsável — notificação in-app (Notification), mensagem no sino
 * (Message/NOTIFICATION) e e-mail opcional (apenas para vencidos).
 *
 * Mesmo padrão do PaymentAlertScheduler.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceAlertScheduler {

    /** Kinds de alerta emitidos pelo scheduler */
    private enum AlertKind {
        /** Plano vencido — prioridade alta, entra no e-mail */
        OVERDUE("🔧 Manutenção Preventiva Vencida — ", "🚨 ", MessagePriority.HIGH, true,
                "Vencida", "vencido", "está vencido", "estão vencidos"),
        /** Plano próximo do vencimento (≤ 7 dias / ≤ 500 km) — prioridade normal, sem e-mail */
        UPCOMING("🔧 Manutenção Preventiva Próxima — ", "⏰ ", MessagePriority.NORMAL, false,
                "Próxima", "próximo do vencimento", "está próximo do vencimento", "estão próximos do vencimento");

        final String titlePrefix;
        final String emailSubjectPrefix;
        final MessagePriority bellPriority;
        final boolean sendEmail;
        final String shortLabel;
        final String singularSuffix;
        final String singularVerb;
        final String pluralVerb;

        AlertKind(String titlePrefix, String emailSubjectPrefix, MessagePriority bellPriority,
                  boolean sendEmail, String shortLabel, String singularSuffix,
                  String singularVerb, String pluralVerb) {
            this.titlePrefix = titlePrefix;
            this.emailSubjectPrefix = emailSubjectPrefix;
            this.bellPriority = bellPriority;
            this.sendEmail = sendEmail;
            this.shortLabel = shortLabel;
            this.singularSuffix = singularSuffix;
            this.singularVerb = singularVerb;
            this.pluralVerb = pluralVerb;
        }
    }

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final MaintenancePlanService maintenancePlanService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final MessageRepository messageRepository;
    private final JavaMailSender mailSender;

    @Value("${app.maintenance-alerts.email-enabled:false}")
    private boolean emailEnabled;

    @Value("${app.notification.email.from:noreply@secureguard.com}")
    private String fromEmail;

    /**
     * Executa todos os dias às 07:30 (antes dos demais alertas do dia):
     * primeiro os vencidos (críticos), depois os próximos do vencimento.
     */
    @Scheduled(cron = "${app.maintenance-alerts.cron:0 30 7 * * ?}")
    @Transactional
    public void checkOverdueMaintenancePlans() {
        log.info("Iniciando verificação diária de planos de manutenção preventiva (vencidos e próximos)");
        try {
            int overdue = notifyOverdueMaintenance();
            int upcoming = notifyUpcomingMaintenance();
            log.info("Verificação de manutenção preventiva concluída: {} alerta(s) de vencidos, {} de próximos",
                    overdue, upcoming);
        } catch (Exception e) {
            log.error("Erro durante verificação de manutenção preventiva: {}", e.getMessage(), e);
        }
    }

    /**
     * Notifica planos VENCIDOS. Público para execução manual (endpoint de admin).
     */
    @Transactional
    public int notifyOverdueMaintenance() {
        return notifyKind(AlertKind.OVERDUE,
                maintenancePlanService.findOverduePlansGroupedByCompany());
    }

    /**
     * Notifica planos PRÓXIMOS DO VENCIMENTO. Público para execução manual.
     */
    @Transactional
    public int notifyUpcomingMaintenance() {
        return notifyKind(AlertKind.UPCOMING,
                maintenancePlanService.findUpcomingPlansGroupedByCompany());
    }

    private int notifyKind(AlertKind kind, Map<UUID, List<OverdueMaintenanceAlertDTO>> plansByCompany) {
        if (plansByCompany.isEmpty()) {
            log.info("Nenhum plano de manutenção preventiva {} encontrado", kind.singularSuffix);
            return 0;
        }

        int totalNotifications = 0;
        LocalDate today = LocalDate.now();
        User systemSender = resolveSystemSender();

        for (Map.Entry<UUID, List<OverdueMaintenanceAlertDTO>> entry : plansByCompany.entrySet()) {
            UUID companyId = entry.getKey();
            List<OverdueMaintenanceAlertDTO> plans = entry.getValue();

            List<User> recipients = findCompanySupervisors(companyId);
            if (recipients.isEmpty()) {
                log.warn("Empresa {} possui {} plano(s) {}(s), mas nenhum supervisor/admin ativo para notificar",
                        companyId, plans.size(), kind.singularSuffix.toLowerCase());
                continue;
            }

            for (User user : recipients) {
                try {
                    boolean created = createNotificationIfNotDuplicate(kind, user, companyId, plans, today);
                    if (created) {
                        totalNotifications++;
                        createBellMessage(kind, user, systemSender, plans, today);
                        if (kind.sendEmail && emailEnabled
                                && user.getEmail() != null && !user.getEmail().isBlank()) {
                            sendEmailDigest(kind, user, plans);
                        }
                    }
                } catch (Exception e) {
                    log.error("Erro ao notificar usuário {} sobre manutenção {}: {}",
                            user.getId(), kind.singularSuffix.toLowerCase(), e.getMessage(), e);
                }
            }
        }

        log.info("Alertas de manutenção preventiva {}: {} empresa(s), {} notificação(ões) criada(s)",
                kind.singularSuffix.toLowerCase(), plansByCompany.size(), totalNotifications);
        return totalNotifications;
    }

    /**
     * Supervisores e administradores ativos da empresa (usuários globais,
     * sem company_id, também recebem — ex: SUPER_ADMIN).
     */
    private List<User> findCompanySupervisors(UUID companyId) {
        return userRepository.findSupervisors().stream()
                .filter(User::isActive)
                .filter(u -> u.getCompanyId() == null || companyId.equals(u.getCompanyId()))
                .collect(Collectors.toList());
    }

    private boolean createNotificationIfNotDuplicate(AlertKind kind, User user, UUID companyId,
                                                     List<OverdueMaintenanceAlertDTO> plans,
                                                     LocalDate today) {
        String title = kind.titlePrefix + today.format(DATE_FMT);

        // Dedupe: 1 notificação por usuário/dia/kind
        if (notificationRepository.existsMaintenanceAlertToday(user.getId(), title, today.atStartOfDay())) {
            log.debug("Usuário {} já possui alerta de manutenção hoje — ignorando", user.getId());
            return false;
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(buildBody(kind, plans))
                .type(NotificationType.SYSTEM)
                .status(NotificationStatus.UNREAD)
                .companyId(companyId)
                .build();

        notificationRepository.save(notification);
        return true;
    }

    /** Corpo comum entre Notification, Message e e-mail. */
    private String buildBody(AlertKind kind, List<OverdueMaintenanceAlertDTO> plans) {
        StringBuilder body = new StringBuilder();
        body.append(plans.size())
                .append(plans.size() == 1
                        ? " plano de manutenção preventiva " + kind.singularVerb + ":\n"
                        : " planos de manutenção preventiva " + kind.pluralVerb + ":\n");

        for (OverdueMaintenanceAlertDTO alert : plans.stream().limit(10).collect(Collectors.toList())) {
            body.append("• ")
                    .append(alert.getPlate())
                    .append(" — ").append(alert.getTaskName())
                    .append(" (").append(alert.getMessage()).append(")\n");
        }
        if (plans.size() > 10) {
            body.append("… e mais ").append(plans.size() - 10).append(" plano(s).\n");
        }
        body.append("\nAcesse o módulo de Manutenção para criar as Ordens de Serviço.");
        return body.toString();
    }

    /**
     * Remetente das mensagens do sino: primeiro admin ativo (mais antigo).
     * Message.sender é NOT NULL no banco; sem admin, sem mensagem (Notification já cobre).
     */
    private User resolveSystemSender() {
        List<User> candidates = userRepository.findSystemMessageSenderCandidates();
        return candidates.isEmpty() ? null : candidates.get(0);
    }

    /**
     * Mensagem exibida no sino de notificações (MessageItem renderiza
     * message.sender.name, por isso exige remetente válido).
     */
    private void createBellMessage(AlertKind kind, User recipient, User systemSender,
                                   List<OverdueMaintenanceAlertDTO> plans, LocalDate today) {
        if (systemSender == null) {
            log.warn("Nenhum admin ativo para usar como remetente do alerta de manutenção — mensagem do sino não criada");
            return;
        }

        String title = kind.titlePrefix + today.format(DATE_FMT);
        if (messageRepository.existsMaintenanceAlertToday(recipient.getId(), title, today.atStartOfDay())) {
            return;
        }

        Message message = new Message();
        message.setTitle(title);
        message.setContent(buildBody(kind, plans));
        message.setType(MessageType.NOTIFICATION);
        message.setPriority(kind.bellPriority);
        message.setStatus(MessageStatus.UNREAD);
        message.setSender(systemSender);
        message.setRecipients(java.util.Set.of(recipient));
        message.setSendEmail(false);
        message.setSendNotification(false);

        messageRepository.save(message);
    }

    private void sendEmailDigest(AlertKind kind, User user, List<OverdueMaintenanceAlertDTO> plans) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject(kind.emailSubjectPrefix + kind.titlePrefix
                    + LocalDate.now().format(DATE_FMT));

            StringBuilder content = new StringBuilder();
            content.append("Olá ").append(user.getName()).append(",\n\n");
            content.append("Os seguintes planos de manutenção preventiva estão ")
                    .append(kind.singularSuffix.toLowerCase()).append(":\n\n");
            for (OverdueMaintenanceAlertDTO alert : plans) {
                content.append("• ").append(alert.getVehicleBrand()).append(" ")
                        .append(alert.getVehicleModel()).append(" — Placa ")
                        .append(alert.getPlate()).append("\n  ")
                        .append(alert.getTaskName()).append(": ")
                        .append(alert.getMessage()).append("\n");
            }
            content.append("\nEste é um alerta automático do módulo de Frota.\n");

            message.setText(content.toString());
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail de manutenção para {}: {}",
                    user.getEmail(), e.getMessage(), e);
        }
    }
}
