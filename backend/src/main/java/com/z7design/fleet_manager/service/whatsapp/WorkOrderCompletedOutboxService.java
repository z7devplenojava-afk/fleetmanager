package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.event.WorkOrderCompletedEvent;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.WhatsAppOutbox;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import com.z7design.fleet_manager.model.enums.NotificationType;
import com.z7design.fleet_manager.model.enums.WhatsAppOutboxKind;
import com.z7design.fleet_manager.model.enums.WhatsAppOutboxStatus;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.WhatsAppOutboxRepository;
import com.z7design.fleet_manager.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Cria as linhas da outbox quando uma OS e concluida.
 *
 * <p>Roda em transacao propria depois do commit da OS. Se algo falhar aqui,
 * a OS continua concluida; a equipe e avisada por notificacao interna quando
 * o contato do motorista nao pode ser resolvido.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkOrderCompletedOutboxService {

    private static final String EVENT_TYPE = "WORK_ORDER_COMPLETED";

    private final FleetWorkOrderRepository workOrderRepository;
    private final WhatsAppOutboxRepository outboxRepository;
    private final DriverContactResolver contactResolver;
    private final WorkOrderNotificationMessageFactory messageFactory;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DriverRepository driverRepository;

    @Value("${whatsapp.outbox.max-attempts:5}")
    private int maxAttempts;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enqueueForCompletedWorkOrder(WorkOrderCompletedEvent event) {
        if (event == null || event.workOrderId() == null) {
            return;
        }

        FleetWorkOrder order = workOrderRepository.findActiveById(event.workOrderId()).orElse(null);
        if (order == null) {
            log.warn("OS {} nao encontrada ao enfileirar aviso de conclusao", event.workOrderId());
            return;
        }

        UUID companyId = resolveCompanyId(order, event.companyId());
        if (companyId == null) {
            log.error("OS {} sem companyId; aviso de conclusao nao enfileirado (risco de cruzamento de tenant)",
                    order.getId());
            return;
        }

        if (event.companyId() != null && order.getCompanyId() != null
                && !event.companyId().equals(order.getCompanyId())) {
            log.error("OS {} pertence a empresa {}, mas o evento veio da empresa {}. Envio cancelado.",
                    order.getId(), order.getCompanyId(), event.companyId());
            return;
        }

        Optional<DriverContact> contactOpt = contactResolver.resolve(order);
        if (contactOpt.isEmpty()) {
            notifyContactNotFound(order, companyId);
            return;
        }

        DriverContact contact = contactOpt.get();
        String text = messageFactory.buildDriverMessage(order, contact);
        String caption = messageFactory.buildDocumentCaption(order);
        String filename = messageFactory.buildDocumentFilename(order);

        enqueue(order, companyId, contact, WhatsAppOutboxKind.TEXT, text, null);
        enqueue(order, companyId, contact, WhatsAppOutboxKind.DOCUMENT, caption, filename);
    }

    private void enqueue(
            FleetWorkOrder order,
            UUID companyId,
            DriverContact contact,
            WhatsAppOutboxKind kind,
            String messageText,
            String documentFilename) {

        String dedupeKey = EVENT_TYPE + ":" + order.getId() + ":" + contact.phone() + ":" + kind.name();
        if (dedupeKey.length() > 255) {
            dedupeKey = dedupeKey.substring(0, 255);
        }

        if (outboxRepository.existsByDedupeKey(dedupeKey)) {
            log.debug("Mensagem {} da OS {} ja existe na outbox", kind, order.getId());
            return;
        }

        WhatsAppOutbox outbox = WhatsAppOutbox.builder()
                .companyId(companyId)
                .workOrderId(order.getId())
                .eventType(EVENT_TYPE)
                .kind(kind)
                .recipientPhone(contact.phone())
                .recipientName(contact.name())
                .messageText(messageText)
                .documentFilename(documentFilename)
                .status(WhatsAppOutboxStatus.PENDING)
                .attempts(0)
                .maxAttempts(maxAttempts)
                .nextAttemptAt(LocalDateTime.now())
                .dedupeKey(dedupeKey)
                .build();

        outboxRepository.save(outbox);
        log.info("Mensagem {} da OS {} enfileirada para {} ({})",
                kind, order.getId(), contact.name(), maskPhone(contact.phone()));
    }

    private UUID resolveCompanyId(FleetWorkOrder order, UUID eventCompanyId) {
        if (order.getCompanyId() != null) {
            return order.getCompanyId();
        }
        if (order.getVehicle() != null && order.getVehicle().getCompanyId() != null) {
            return order.getVehicle().getCompanyId();
        }
        return eventCompanyId;
    }

    private void notifyContactNotFound(FleetWorkOrder order, UUID companyId) {
        try {
            User user = findUserForNotification(order);
            if (user == null) {
                log.warn("OS {} concluida sem motorista identificavel e sem usuario para notificacao interna",
                        order.getId());
                return;
            }

            String message = "Nao foi possivel identificar um WhatsApp valido do motorista para a "
                    + osLabel(order) + " (veiculo " + safePlate(order) + "). "
                    + "Revise o cadastro do motorista no veiculo ou na OS.";

            Notification notification = Notification.builder()
                    .user(user)
                    .title(truncate(osLabel(order) + " sem aviso ao motorista", 100))
                    .message(truncate(message, 1000))
                    .type(NotificationType.SYSTEM)
                    .status(NotificationStatus.UNREAD)
                    .companyId(companyId)
                    .build();

            notificationService.create(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificacao interna de OS sem motorista: {}", e.getMessage(), e);
        }
    }

    private User findUserForNotification(FleetWorkOrder order) {
        User requester = findUserById(order.getRequesterId());
        if (requester != null) {
            return requester;
        }
        return findUserById(order.getResponsibleId());
    }

    private User findUserById(UUID id) {
        if (id == null) {
            return null;
        }

        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            return user;
        }
        Employee employee = employeeRepository.findById(id).orElse(null);
        if (employee != null && employee.getUser() != null) {
            return employee.getUser();
        }
        Driver driver = driverRepository.findById(id).orElse(null);
        if (driver != null && driver.getUser() != null) {
            return driver.getUser();
        }
        return null;
    }

    private String safeOsNumber(FleetWorkOrder order) {
        return order.getOsNumber() != null ? order.getOsNumber() : order.getId().toString().substring(0, 8);
    }

    private String osLabel(FleetWorkOrder order) {
        String raw = safeOsNumber(order);
        return raw.toUpperCase(java.util.Locale.ROOT).startsWith("OS") ? raw : "OS " + raw;
    }

    private String safePlate(FleetWorkOrder order) {
        return order.getVehicle() != null && order.getVehicle().getPlate() != null
                ? order.getVehicle().getPlate()
                : "sem placa";
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + "...";
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return "****" + phone.substring(phone.length() - 4);
    }
}
