package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.GarageDTO;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import com.z7design.fleet_manager.model.enums.NotificationType;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Verifica a ocupação das garagens e emite alertas de lotação:
 * <ul>
 *   <li>🚨 100% — "Garagem lotada": notifica o responsável da garagem e administradores;</li>
 *   <li>⚠️ >= 90% — "Garagem próxima da lotação": notifica o responsável.</li>
 * </ul>
 * Cada garagem é re-notificada a cada 6 horas enquanto permanecer lotada/atención
 * (o debounce é feito pelo horário da última emissão em memória).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GarageOccupancyAlertScheduler {

    private final GarageService garageService;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    /** Debounce em memória: garageId -> epoch ms do último alerta emitido. */
    private final java.util.concurrent.ConcurrentHashMap<UUID, Long> lastAlertAt = new java.util.concurrent.ConcurrentHashMap<>();

    /** Intervalo mínimo entre alertas repetidos da mesma garagem (6h). */
    private static final long DEBOUNCE_MS = 6 * 60 * 60 * 1000L;

    @Scheduled(fixedDelayString = "PT30M", initialDelayString = "PT3M")
    public void checkOccupancy() {
        try {
            List<GarageDTO> garages = garageService.listAllForAlerting();
            long now = System.currentTimeMillis();
            for (GarageDTO garage : garages) {
                boolean full = Boolean.TRUE.equals(garage.getAtCapacity());
                boolean near = Boolean.TRUE.equals(garage.getNearCapacity()) && !full;
                if (!full && !near) continue;

                Long last = lastAlertAt.get(garage.getId());
                if (last != null && now - last < DEBOUNCE_MS) continue;
                lastAlertAt.put(garage.getId(), now);

                if (full) {
                    sendAlert(garage, true);
                } else {
                    sendAlert(garage, false);
                }
            }
        } catch (Exception e) {
            log.error("Erro ao verificar ocupação das garagens: {}", e.getMessage());
        }
    }

    private void sendAlert(GarageDTO garage, boolean full) {
        String title = full
                ? "🚨 Garagem lotada — " + garage.getName()
                : "⚠️ Garagem próxima da lotação — " + garage.getName();
        String message = full
                ? String.format("A garagem %s está lotada (%d/%d vagas). Novas alocações/mobilizações exigem remanejamento.",
                        garage.getName(), garage.getVehicleCount(), garage.getCapacity())
                : String.format("A garagem %s atingiu %s%% da capacidade (%d/%d vagas).",
                        garage.getName(), garage.getOccupancyRate(), garage.getVehicleCount(), garage.getCapacity());
        log.warn("Alerta de ocupação: {}", message);

        // 1) Responsável da garagem (via colaborador vinculado a usuário)
        notifyResponsible(garage, title, message);

        // 2) Administradores da empresa (sempre para garagem lotada)
        if (full) {
            try {
                List<User> admins = userRepository.findSystemMessageSenderCandidates();
                for (User admin : admins) {
                    createNotification(admin, title, message, garage.getCompanyId());
                }
            } catch (Exception e) {
                log.warn("Falha ao notificar admins sobre lotação da garagem {}: {}", garage.getId(), e.getMessage());
            }
        }
    }

    private void notifyResponsible(GarageDTO garage, String title, String message) {
        try {
            if (garage.getResponsibleEmployeeId() == null) return;
            Employee employee = employeeRepository.findById(garage.getResponsibleEmployeeId()).orElse(null);
            if (employee != null && employee.getUser() != null) {
                createNotification(employee.getUser(), title, message, garage.getCompanyId());
            }
        } catch (Exception e) {
            log.warn("Falha ao notificar responsável da garagem {}: {}", garage.getId(), e.getMessage());
        }
    }

    private void createNotification(User target, String title, String message, UUID companyId) {
        try {
            Notification notification = Notification.builder()
                    .user(target)
                    .title(title)
                    .message(message)
                    .type(NotificationType.SYSTEM)
                    .status(NotificationStatus.UNREAD)
                    .companyId(companyId)
                    .build();
            notificationService.create(notification);
        } catch (Exception e) {
            log.warn("Falha ao criar notificação de lotação para {}: {}", target.getId(), e.getMessage());
        }
    }
}
