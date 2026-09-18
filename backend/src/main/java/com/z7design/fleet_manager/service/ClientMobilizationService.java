package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ClientMobilizationDTO;
import com.z7design.fleet_manager.model.Notification;
import com.z7design.fleet_manager.model.Role;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.NotificationStatus;
import com.z7design.fleet_manager.model.enums.NotificationType;
import com.z7design.fleet_manager.repository.NotificationRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientMobilizationService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final JavaMailSender mailSender;
    private final EvolutionApiService evolutionApiService;
    private final UserCompanyResolver userCompanyResolver;

    @Value("${app.notification.email.from:noreply@secureguard.com}")
    private String fromEmail;

    @Value("${app.notification.email.enabled:true}")
    private boolean emailEnabled;

    @Transactional
    public void triggerMobilization(ClientMobilizationDTO dto) {
        log.info("🚀 [MOBILIZAÇÃO] Iniciando fluxo multi-setorial de mobilização para cliente: {} (CNPJ: {})",
                dto.getClientName(), dto.getCnpj());

        String startDateStr = dto.getOperationStartDate() != null
                ? dto.getOperationStartDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "A definir";

        int posts = dto.getPostsQuantity() != null ? dto.getPostsQuantity() : 0;
        int vehicles = dto.getVehiclesQuantity() != null ? dto.getVehiclesQuantity() : 0;
        int headcount = dto.getHeadcountQuantity() != null ? dto.getHeadcountQuantity() : 0;

        // Setores e suas responsabilidades específicas
        Map<String, String> sectorBriefings = new LinkedHashMap<>();
        sectorBriefings.put("OPERACIONAL", String.format(
                "🚚 *OPERACIONAL - Mobilização Novo Cliente*\n" +
                "Cliente: %s\n" +
                "Data Início: %s\n" +
                "Postos Previstos: %d | Veículos: %d | Efetivo: %d\n" +
                "Ações: Criar postos de trabalho, definir rotas e escalar motoristas/equipe.",
                dto.getClientName(), startDateStr, posts, vehicles, headcount
        ));

        sectorBriefings.put("MANUTENCAO", String.format(
                "🔧 *MANUTENÇÃO - Preparação de Frota*\n" +
                "Cliente: %s | Início: %s\n" +
                "Veículos Alocados: %d unidades\n" +
                "Ações: Realizar check-up preventivo, revisar documentação e liberar veículos para a operação.",
                dto.getClientName(), startDateStr, vehicles
        ));

        sectorBriefings.put("SST", String.format(
                "🦺 *SST / SEGURANÇA - Fichas e Programas*\n" +
                "Cliente: %s | Efetivo Previsto: %d colaboradores\n" +
                "Ações: Dimensionar EPIs, agendar ASOs/exames admissionais e adequar programas PGR/PCMSO.",
                dto.getClientName(), headcount
        ));

        sectorBriefings.put("ALMOXARIFADO", String.format(
                "📦 *ALMOXARIFADO - Suprimentos e Kits*\n" +
                "Cliente: %s | Postos: %d | Efetivo: %d\n" +
                "Ações: Separar kits de uniformes, crachás, ferramentas e insumos operacionais.",
                dto.getClientName(), posts, headcount
        ));

        sectorBriefings.put("FINANCEIRO", String.format(
                "💰 *FINANCEIRO - Faturamento e Contrato*\n" +
                "Cliente: %s | Contrato: %s\n" +
                "Vigência: %s\n" +
                "Ações: Cadastrar centro de custo, configurar plano de faturamento e emissão de cobranças.",
                dto.getClientName(),
                dto.getContractNumber() != null ? dto.getContractNumber() : "Em formalização",
                dto.getContractDuration() != null ? dto.getContractDuration() : "Padrão"
        ));

        // 1. Notificações Internas (Banco + WebSocket)
        if (dto.isNotifyInternal()) {
            enviarNotificacoesInternas(dto, sectorBriefings);
        }

        // 2. Disparo de E-mails Assíncronos
        if (dto.isNotifyEmail() && emailEnabled) {
            enviarEmailsSetoriais(dto, sectorBriefings);
        }

        // 3. Disparo de WhatsApp Assíncrono
        if (dto.isNotifyWhatsapp()) {
            enviarWhatsAppsSetoriais(dto, sectorBriefings);
        }

        log.info("✅ [MOBILIZAÇÃO] Fluxo de mobilização concluído com sucesso para cliente: {}", dto.getClientName());
    }

    private void enviarNotificacoesInternas(ClientMobilizationDTO dto, Map<String, String> briefings) {
        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            if (!user.isActive()) continue;

            String userSector = identifyUserSector(user);
            if (userSector != null && briefings.containsKey(userSector)) {
                String message = briefings.get(userSector);

                Notification notification = Notification.builder()
                        .user(user)
                        .title("🚀 Mobilização: " + dto.getClientName())
                        .message(message)
                        .type(NotificationType.SYSTEM)
                        .status(NotificationStatus.UNREAD)
                        .build();

                try {
                    notificationRepository.save(notification);
                } catch (Exception e) {
                    log.warn("Erro ao salvar notificação interna: {}", e.getMessage());
                }
            }
        }

        // Broadcast WebSocket para atualização imediata no painel
        try {
            Map<String, Object> wsPayload = new HashMap<>();
            wsPayload.put("type", "NEW_CLIENT_MOBILIZATION");
            wsPayload.put("clientName", dto.getClientName());
            wsPayload.put("posts", dto.getPostsQuantity());
            wsPayload.put("vehicles", dto.getVehiclesQuantity());
            wsPayload.put("headcount", dto.getHeadcountQuantity());
            wsPayload.put("startDate", dto.getOperationStartDate());

            messagingTemplate.convertAndSend("/topic/notifications", wsPayload);
            messagingTemplate.convertAndSend("/topic/mobilization", wsPayload);
        } catch (Exception e) {
            log.warn("Erro ao enviar WebSocket de mobilização: {}", e.getMessage());
        }
    }

    @Async
    public void enviarEmailsSetoriais(ClientMobilizationDTO dto, Map<String, String> briefings) {
        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            if (user.getEmail() == null || user.getEmail().isBlank()) continue;

            String sector = identifyUserSector(user);
            if (sector != null && briefings.containsKey(sector)) {
                try {
                    SimpleMailMessage mail = new SimpleMailMessage();
                    mail.setFrom(fromEmail);
                    mail.setTo(user.getEmail());
                    mail.setSubject("🚨 Mobilização de Novo Cliente: " + dto.getClientName() + " (" + sector + ")");
                    mail.setText(briefings.get(sector));

                    mailSender.send(mail);
                    log.info("📧 E-mail de mobilização enviado para {} ({})", user.getEmail(), sector);
                } catch (Exception e) {
                    log.warn("Falha ao enviar e-mail de mobilização para {}: {}", user.getEmail(), e.getMessage());
                }
            }
        }
    }

    @Async
    public void enviarWhatsAppsSetoriais(ClientMobilizationDTO dto, Map<String, String> briefings) {
        if (evolutionApiService == null) return;

        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            String whatsapp = user.getWhatsapp();
            if (whatsapp == null || whatsapp.isBlank()) continue;

            String sector = identifyUserSector(user);
            if (sector != null && briefings.containsKey(sector)) {
                try {
                    String cleanPhone = whatsapp.replaceAll("[^0-9]", "");
                    evolutionApiService.sendTextMessage(cleanPhone, briefings.get(sector));
                    log.info("📲 WhatsApp de mobilização enviado para {} ({})", cleanPhone, sector);
                } catch (Exception e) {
                    log.warn("Falha ao enviar WhatsApp de mobilização para {}: {}", whatsapp, e.getMessage());
                }
            }
        }
    }

    private String identifyUserSector(User user) {
        if (user.getRoles() == null) return null;

        for (Role role : user.getRoles()) {
            if (role == null || role.getName() == null) continue;
            String r = role.getName().toUpperCase();

            if (r.contains("OPERACIONAL")) return "OPERACIONAL";
            if (r.contains("MANUTENCAO") || r.contains("MECANICO")) return "MANUTENCAO";
            if (r.contains("SST") || r.contains("SEGURANCA")) return "SST";
            if (r.contains("ALMOXARIFADO") || r.contains("ESTOQUE")) return "ALMOXARIFADO";
            if (r.contains("FINANCEIRO") || r.contains("CONTABILIDADE")) return "FINANCEIRO";
            if (r.contains("ADMIN") || r.contains("SUPER_ADMIN") || r.contains("DIRETORIA")) return "OPERACIONAL"; // Admin recebe briefing operacional
        }
        return null;
    }
}
