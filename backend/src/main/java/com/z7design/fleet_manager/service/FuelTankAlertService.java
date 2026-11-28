package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.FuelTank;
import com.z7design.fleet_manager.model.FuelTankAlertLog;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.FuelTankAlertLogRepository;
import com.z7design.fleet_manager.repository.FuelTankRepository;
import com.z7design.fleet_manager.service.whatsapp.WhatsAppGateway;
import com.z7design.fleet_manager.service.whatsapp.WhatsAppSendResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FuelTankAlertService {

    private static final BigDecimal THRESHOLD_5000 = BigDecimal.valueOf(5000);
    private static final BigDecimal THRESHOLD_3000 = BigDecimal.valueOf(3000);
    private static final BigDecimal THRESHOLD_2000 = BigDecimal.valueOf(2000);

    private final FuelTankRepository fuelTankRepository;
    private final FuelTankAlertLogRepository fuelTankAlertLogRepository;
    private final EmployeeRepository employeeRepository;
    private final WhatsAppGateway whatsAppGateway;

    /**
     * Verifica o nível atual do tanque e dispara alerta no sistema e WhatsApp se atingir 5.000, 3.000 ou 2.000 L.
     * O alerta é disparado uma única vez por patamar atingido (reseta quando houver reabastecimento).
     */
    @Transactional
    public void checkAndTriggerTankAlert(FuelTank tank) {
        if (tank == null || tank.getCurrentLevel() == null) {
            return;
        }

        BigDecimal level = tank.getCurrentLevel();
        BigDecimal targetThreshold = null;

        if (level.compareTo(THRESHOLD_2000) <= 0) {
            targetThreshold = THRESHOLD_2000;
        } else if (level.compareTo(THRESHOLD_3000) <= 0) {
            targetThreshold = THRESHOLD_3000;
        } else if (level.compareTo(THRESHOLD_5000) <= 0) {
            targetThreshold = THRESHOLD_5000;
        }

        if (targetThreshold == null) {
            log.debug("Tanque {} ({}) com nível {}L - acima dos patamares de alerta.", tank.getName(), tank.getId(), level);
            return;
        }

        BigDecimal lastThreshold = tank.getLastAlertThreshold();
        // Se já alertou neste patamar ou patamar mais baixo, não dispara repetido
        if (lastThreshold != null && lastThreshold.compareTo(targetThreshold) <= 0) {
            log.debug("Alerta de nível {}L já disparado anteriormente para o tanque {} (last={})", targetThreshold, tank.getName(), lastThreshold);
            return;
        }

        log.warn("🚨 [ALERTA DE TANQUE] Tanque '{}' atingiu patamar de {}L! Nível atual: {}L",
                tank.getName(), targetThreshold, level);

        UUID companyId = tank.getCompanyId();
        List<Employee> leaders = findRecipients(companyId);

        String garageName = tank.getGarage() != null ? tank.getGarage().getName() : "Garagem";
        String fuelTypeName = tank.getFuelType() != null ? tank.getFuelType().name() : "Diesel";

        String message = String.format("""
                ⚠️ *ALERTA DE NÍVEL DE COMBUSTÍVEL — FLUXBUS* ⛽

                *Garagem:* %s
                *Tanque:* %s
                *Combustível:* %s
                *Capacidade:* %s L
                *Nível Atual:* *%s L*

                🔔 *Atenção:* O combustível atingiu o patamar de alerta de *%s Litros*.
                Destinatários notificados: Gestor de Manutenção, Encarregado de Manutenção e Almoxarifado.
                Solicitamos providenciar o reabastecimento.
                """,
                garageName,
                tank.getName(),
                fuelTypeName,
                tank.getCapacity() != null ? tank.getCapacity().toPlainString() : "N/I",
                level.toPlainString(),
                targetThreshold.toPlainString()
        );

        List<String> recipientsSummary = new ArrayList<>();
        int sentCount = 0;
        int failedCount = 0;

        for (Employee emp : leaders) {
            String phone = resolvePhoneNumber(emp);
            String empInfo = emp.getName() + " (" + (emp.getPosition() != null ? emp.getPosition().getName() : "Liderança") + ")";

            if (phone != null && !phone.isBlank()) {
                try {
                    WhatsAppSendResult res = whatsAppGateway.sendText(companyId, phone, message);
                    if (res != null && res.success()) {
                        sentCount++;
                        recipientsSummary.add(empInfo + " [WhatsApp OK: " + phone + "]");
                    } else {
                        failedCount++;
                        recipientsSummary.add(empInfo + " [WhatsApp Falhou: " + (res != null ? res.errorMessage() : "Erro desconhecido") + "]");
                    }
                } catch (Exception ex) {
                    failedCount++;
                    log.error("Erro ao enviar WhatsApp para {}: {}", emp.getName(), ex.getMessage());
                    recipientsSummary.add(empInfo + " [Erro: " + ex.getMessage() + "]");
                }
            } else {
                recipientsSummary.add(empInfo + " [Sem Telefone Cadastrado]");
            }
        }

        String overallStatus = sentCount > 0 ? "SENT" : (recipientsSummary.isEmpty() ? "NO_RECIPIENTS" : "NO_PHONE_OR_FAILED");

        // Registrar no histórico de envio
        FuelTankAlertLog alertLog = FuelTankAlertLog.builder()
                .companyId(companyId != null ? companyId : UUID.randomUUID())
                .fuelTank(tank)
                .thresholdLevel(targetThreshold)
                .currentLevel(level)
                .alertDate(LocalDateTime.now())
                .recipients(String.join("; ", recipientsSummary))
                .whatsappStatus(overallStatus)
                .message(message)
                .build();

        fuelTankAlertLogRepository.save(alertLog);

        // Atualizar lastAlertThreshold do tanque
        tank.setLastAlertThreshold(targetThreshold);
        fuelTankRepository.save(tank);

        log.info("✅ Alerta de tanque registrado com sucesso. Enviados: {}, Falhas: {}, Total Alvos: {}",
                sentCount, failedCount, leaders.size());
    }

    /**
     * Quando houver descarga ou reabastecimento do tanque, reseta os patamares para permitir novos alertas.
     */
    @Transactional
    public void onTankRefill(FuelTank tank) {
        if (tank == null || tank.getCurrentLevel() == null) {
            return;
        }
        BigDecimal level = tank.getCurrentLevel();
        BigDecimal last = tank.getLastAlertThreshold();

        if (last != null) {
            if (level.compareTo(THRESHOLD_5000) > 0) {
                tank.setLastAlertThreshold(null);
                fuelTankRepository.save(tank);
                log.info("Nível do tanque {} subiu para {}L (acima de 5000L). Patamar de alerta resetado.", tank.getName(), level);
            } else if (level.compareTo(THRESHOLD_3000) > 0 && last.compareTo(THRESHOLD_3000) <= 0) {
                tank.setLastAlertThreshold(THRESHOLD_5000);
                fuelTankRepository.save(tank);
                log.info("Nível do tanque {} subiu para {}L. Patamar resetado para 5000L.", tank.getName(), level);
            } else if (level.compareTo(THRESHOLD_2000) > 0 && last.compareTo(THRESHOLD_2000) <= 0) {
                tank.setLastAlertThreshold(THRESHOLD_3000);
                fuelTankRepository.save(tank);
                log.info("Nível do tanque {} subiu para {}L. Patamar resetado para 3000L.", tank.getName(), level);
            }
        }
    }

    private List<Employee> findRecipients(UUID companyId) {
        if (companyId == null) {
            return Collections.emptyList();
        }
        List<Employee> leaders = employeeRepository.findMaintenanceAndAlmoxarifadoLeaders(companyId);
        if (leaders != null && !leaders.isEmpty()) {
            return leaders;
        }

        // Fallback: buscar todos ativos e filtrar por strings relevantes
        List<Employee> active = employeeRepository.findByCompanyId(companyId);
        if (active == null) {
            return Collections.emptyList();
        }

        return active.stream().filter(emp -> {
            String pos = emp.getPosition() != null && emp.getPosition().getName() != null
                    ? emp.getPosition().getName().toUpperCase()
                    : "";
            return pos.contains("GESTOR") && pos.contains("MANUTEN")
                    || pos.contains("GERENTE") && pos.contains("MANUTEN")
                    || pos.contains("ENCARREGADO") && pos.contains("MANUTEN")
                    || pos.contains("ALMOXARIF");
        }).collect(Collectors.toList());
    }

    private String resolvePhoneNumber(Employee emp) {
        if (emp.getTelefoneContato() != null && !emp.getTelefoneContato().trim().isEmpty()) {
            return emp.getTelefoneContato().trim();
        }
        if (emp.getPhone() != null && !emp.getPhone().trim().isEmpty()) {
            return emp.getPhone().trim();
        }
        if (emp.getUser() != null && emp.getUser().getPhone() != null && !emp.getUser().getPhone().trim().isEmpty()) {
            return emp.getUser().getPhone().trim();
        }
        return null;
    }
}
