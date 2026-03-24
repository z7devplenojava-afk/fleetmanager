package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.repository.InvoiceRepository;
import com.z7design.fleet_manager.repository.NotificationRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class NotificationService {
    
    private final JavaMailSender mailSender;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.notification.email.from:noreply@secureguard.com}")
    private String fromEmail;

    @Value("${app.notification.email.enabled:true}")
    private boolean emailEnabled;

    // Executar todos os dias Ã s 08:00
    @Scheduled(cron = "0 0 8 * * ?")
    public void enviarAlertasVencimento() {
        if (!emailEnabled) {
            log.info("NotificaÃ§Ãµes por email estÃ£o desabilitadas");
            return;
        }

        log.info("Iniciando verificaÃ§Ã£o de alertas de vencimento");

        try {
            // Contas vencendo em 7 dias
            LocalDate hoje = LocalDate.now();
            LocalDate emSeteDias = hoje.plusDays(7);
            List<Invoice> contasVencendoEmBreve = invoiceRepository.findInvoicesDueSoon(hoje, emSeteDias);
            
            // Contas vencidas
            List<Invoice> contasVencidas = invoiceRepository.findOverdueInvoices(hoje);

            if (!contasVencendoEmBreve.isEmpty() || !contasVencidas.isEmpty()) {
                enviarEmailAlerta(contasVencendoEmBreve, contasVencidas);
            }

            log.info("VerificaÃ§Ã£o de alertas concluÃ­da. {} vencendo em breve, {} vencidas", 
                    contasVencendoEmBreve.size(), contasVencidas.size());
            
        } catch (Exception e) {
            log.error("Erro ao enviar alertas de vencimento", e);
        }
    }

    @Async
    public void enviarEmailAlerta(List<Invoice> contasVencendoEmBreve, List<Invoice> contasVencidas) {
        // Buscar usuÃ¡rios com permissÃ£o financeira
        List<User> usuariosFinanceiro = buscarUsuariosComPermissaoFinanceira();

        for (User usuario : usuariosFinanceiro) {
            if (usuario.getEmail() != null && !usuario.getEmail().isEmpty()) {
                try {
                    enviarEmailIndividual(usuario, contasVencendoEmBreve, contasVencidas);
                } catch (Exception e) {
                    log.error("Erro ao enviar email para {}: {}", usuario.getEmail(), e.getMessage());
                }
            }
        }
    }

    private void enviarEmailIndividual(User usuario, List<Invoice> contasVencendoEmBreve, List<Invoice> contasVencidas) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(usuario.getEmail());
        message.setSubject("ðŸš¨ Alerta: Contas a Pagar - " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        
        StringBuilder conteudo = new StringBuilder();
        conteudo.append("OlÃ¡ ").append(usuario.getName()).append(",\n\n");
        conteudo.append("Segue o relatÃ³rio de alertas de contas a pagar:\n\n");

        // Contas vencidas
        if (!contasVencidas.isEmpty()) {
            BigDecimal valorTotalVencidas = contasVencidas.stream()
                .map(Invoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            conteudo.append("ðŸ”´ CONTAS VENCIDAS (").append(contasVencidas.size()).append("):\n");
            conteudo.append("Valor Total: R$ ").append(formatarMoeda(valorTotalVencidas)).append("\n\n");

            for (Invoice conta : contasVencidas.stream().limit(10).collect(Collectors.toList())) {
                conteudo.append("â€¢ ").append(conta.getDescription())
                    .append(" - R$ ").append(formatarMoeda(conta.getAmount()))
                    .append(" (Venc: ").append(conta.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .append(")\n");
            }

            if (contasVencidas.size() > 10) {
                conteudo.append("... e mais ").append(contasVencidas.size() - 10).append(" contas.\n");
            }
            conteudo.append("\n");
        }

        // Contas vencendo em breve
        if (!contasVencendoEmBreve.isEmpty()) {
            BigDecimal valorTotalVencendoEmBreve = contasVencendoEmBreve.stream()
                .map(Invoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            conteudo.append("ðŸŸ¡ CONTAS VENCENDO EM 7 DIAS (").append(contasVencendoEmBreve.size()).append("):\n");
            conteudo.append("Valor Total: R$ ").append(formatarMoeda(valorTotalVencendoEmBreve)).append("\n\n");

            for (Invoice conta : contasVencendoEmBreve.stream().limit(10).collect(Collectors.toList())) {
                conteudo.append("â€¢ ").append(conta.getDescription())
                    .append(" - R$ ").append(formatarMoeda(conta.getAmount()))
                    .append(" (Venc: ").append(conta.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .append(")\n");
            }

            if (contasVencendoEmBreve.size() > 10) {
                conteudo.append("... e mais ").append(contasVencendoEmBreve.size() - 10).append(" contas.\n");
            }
            conteudo.append("\n");
        }

        conteudo.append("ðŸ“Š Acesse o sistema para mais detalhes e para efetuar os pagamentos.\n\n");
        conteudo.append("---\n");
        conteudo.append("Sistema SecureGuard - GestÃ£o Financeira\n");
        conteudo.append("Este Ã© um email automÃ¡tico, nÃ£o responda.");

        message.setText(conteudo.toString());

        mailSender.send(message);
        log.info("Email de alerta enviado para: {}", usuario.getEmail());
    }

    @Async
    public void enviarNotificacaoContaCriada(Invoice conta, User usuarioCriador) {
        if (!emailEnabled) return;

        try {
            List<User> usuariosFinanceiro = buscarUsuariosComPermissaoFinanceira();
            
            for (User usuario : usuariosFinanceiro) {
                if (usuario.getEmail() != null && !usuario.equals(usuarioCriador)) {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom(fromEmail);
                    message.setTo(usuario.getEmail());
                    message.setSubject("ðŸ“ Nova Conta a Pagar Cadastrada");
                    
                    StringBuilder conteudo = new StringBuilder();
                    conteudo.append("OlÃ¡ ").append(usuario.getName()).append(",\n\n");
                    conteudo.append("Uma nova conta a pagar foi cadastrada no sistema:\n\n");
                    conteudo.append("DescriÃ§Ã£o: ").append(conta.getDescription()).append("\n");
                    conteudo.append("Valor: R$ ").append(formatarMoeda(conta.getAmount())).append("\n");
                    conteudo.append("Vencimento: ").append(conta.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("\n");
                    conteudo.append("Fornecedor: ").append(conta.getSupplier() != null ? conta.getSupplier().getName() : "NÃ£o informado").append("\n");
                    conteudo.append("Criado por: ").append(usuarioCriador.getName()).append("\n\n");
                    conteudo.append("Acesse o sistema para mais detalhes.\n\n");
                    conteudo.append("---\n");
                    conteudo.append("Sistema SecureGuard - GestÃ£o Financeira");

                    message.setText(conteudo.toString());
                    mailSender.send(message);
                }
            }
        } catch (Exception e) {
            log.error("Erro ao enviar notificaÃ§Ã£o de conta criada", e);
        }
    }

    private String formatarMoeda(BigDecimal valor) {
        return String.format("%,.2f", valor).replace(",", "X").replace(".", ",").replace("X", ".");
    }

    // MÃ©todo para envio manual de alertas (pode ser chamado via endpoint)
    public void enviarAlertasManual() {
        enviarAlertasVencimento();
    }

    private List<User> buscarUsuariosComPermissaoFinanceira() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRoles().stream()
                        .anyMatch(role -> role.getName().contains("FINANCE") || 
                                        role.getName().contains("ADMIN") ||
                                        role.getName().contains("SUPER_ADMIN")))
                .collect(Collectors.toList());
    }
    
    // MÃ©todos para NotificationController
    @Transactional
    public com.z7design.fleet_manager.model.Notification create(com.z7design.fleet_manager.model.Notification notification) {
        log.info("Criando notificaÃ§Ã£o: {}", notification);
        try {
            return notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificaÃ§Ã£o", e);
            throw new RuntimeException("Erro ao criar notificaÃ§Ã£o: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void markAsRead(UUID id) {
        log.info("Marcando notificaÃ§Ã£o como lida: {}", id);
        try {
            com.z7design.fleet_manager.model.Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("NotificaÃ§Ã£o nÃ£o encontrada"));
            notification.setStatus(com.z7design.fleet_manager.model.enums.NotificationStatus.READ);
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Erro ao marcar notificaÃ§Ã£o como lida", e);
            throw new RuntimeException("Erro ao marcar notificaÃ§Ã£o como lida: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void markAsUnread(UUID id) {
        log.info("Marcando notificaÃ§Ã£o como nÃ£o lida: {}", id);
        try {
            com.z7design.fleet_manager.model.Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("NotificaÃ§Ã£o nÃ£o encontrada"));
            notification.setStatus(com.z7design.fleet_manager.model.enums.NotificationStatus.UNREAD);
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Erro ao marcar notificaÃ§Ã£o como nÃ£o lida", e);
            throw new RuntimeException("Erro ao marcar notificaÃ§Ã£o como nÃ£o lida: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void delete(UUID id) {
        log.info("Excluindo notificaÃ§Ã£o: {}", id);
        try {
            if (!notificationRepository.existsById(id)) {
                throw new RuntimeException("NotificaÃ§Ã£o nÃ£o encontrada");
            }
            notificationRepository.deleteById(id);
        } catch (Exception e) {
            log.error("Erro ao excluir notificaÃ§Ã£o", e);
            throw new RuntimeException("Erro ao excluir notificaÃ§Ã£o: " + e.getMessage(), e);
        }
    }
    
    public com.z7design.fleet_manager.model.Notification findById(UUID id) {
        log.info("Buscando notificaÃ§Ã£o por ID: {}", id);
        try {
            return notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("NotificaÃ§Ã£o nÃ£o encontrada"));
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ã£o por ID", e);
            throw new RuntimeException("Erro ao buscar notificaÃ§Ã£o: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findByUserId(UUID userId) {
        log.info("Buscando notificaÃ§Ãµes por usuÃ¡rio: {}", userId);
        try {
            return notificationRepository.findByUserId(userId);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por usuÃ¡rio", e);
            throw new RuntimeException("Erro ao buscar notificaÃ§Ãµes: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findByUserIdAndStatus(UUID userId, com.z7design.fleet_manager.model.enums.NotificationStatus status) {
        log.info("Buscando notificaÃ§Ãµes por usuÃ¡rio e status: {} - {}", userId, status);
        try {
            return notificationRepository.findByUserIdAndStatus(userId, status);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por usuÃ¡rio e status", e);
            throw new RuntimeException("Erro ao buscar notificaÃ§Ãµes: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findByUserIdAndType(UUID userId, com.z7design.fleet_manager.model.enums.NotificationType type) {
        log.info("Buscando notificaÃ§Ãµes por usuÃ¡rio e tipo: {} - {}", userId, type);
        try {
            return notificationRepository.findByUserIdAndType(userId, type);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por usuÃ¡rio e tipo", e);
            throw new RuntimeException("Erro ao buscar notificaÃ§Ãµes: " + e.getMessage(), e);
        }
    }

    public List<com.z7design.fleet_manager.model.Notification> findByUserIdOrderByCreatedAtDesc(UUID userId) {
        log.info("Buscando notificaÃ§Ãµes por usuÃ¡rio (ordenado): {}", userId);
        try {
            return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por usuÃ¡rio", e);
            throw new RuntimeException("Erro ao buscar notificaÃ§Ãµes: " + e.getMessage(), e);
        }
    }

    public List<com.z7design.fleet_manager.model.Notification> findByUserIdAndTypeOrderByCreatedAtDesc(
            UUID userId,
            com.z7design.fleet_manager.model.enums.NotificationType type) {
        log.info("Buscando notificaÃ§Ãµes por usuÃ¡rio e tipo (ordenado): {} - {}", userId, type);
        try {
            return notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por usuÃ¡rio e tipo", e);
            throw new RuntimeException("Erro ao buscar notificaÃ§Ãµes: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        log.info("Buscando notificaÃ§Ãµes por perÃ­odo: {} - {}", start, end);
        try {
            return notificationRepository.findByCreatedAtBetween(start, end);
        } catch (Exception e) {
            log.error("Erro ao buscar notificaÃ§Ãµes por perÃ­odo", e);
            throw new RuntimeException("Erro ao buscar notificaÃ§Ãµes: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findAll() {
        log.info("Buscando todas as notificaÃ§Ãµes");
        try {
            return notificationRepository.findAllWithRelationships();
        } catch (Exception e) {
            log.error("Erro ao buscar todas as notificaÃ§Ãµes", e);
            throw new RuntimeException("Erro ao buscar notificaÃ§Ãµes: " + e.getMessage(), e);
        }
    }
    
    public void sendNotification(com.z7design.fleet_manager.model.Message message) {
        log.info("Enviando notificaÃ§Ã£o para mensagem: {}", message);
        
        try {
            // Publicar notificaÃ§Ã£o via WebSocket para todos os destinatÃ¡rios
            if (message.getRecipients() != null && !message.getRecipients().isEmpty()) {
                for (User recipient : message.getRecipients()) {
                    if (recipient.getUsername() != null) {
                        String destination = "/user/" + recipient.getUsername() + "/queue/notifications";
                        messagingTemplate.convertAndSend(destination, message);
                        log.info("NotificaÃ§Ã£o publicada via WebSocket para usuÃ¡rio: {} (destino: {})", recipient.getUsername(), destination);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro ao publicar notificaÃ§Ã£o via WebSocket: {}", e.getMessage(), e);
            // NÃ£o lanÃ§ar exceÃ§Ã£o para nÃ£o quebrar o fluxo
        }
    }
    
    public void sendChatTypingNotification(String recipientId, Object event) {
        log.info("Enviando notificaÃ§Ã£o de digitaÃ§Ã£o: {} - {}", recipientId, event);
        
        try {
            // Publicar evento de digitaÃ§Ã£o via WebSocket
            if (recipientId != null) {
                User recipient = userRepository.findById(UUID.fromString(recipientId)).orElse(null);
                if (recipient != null && recipient.getUsername() != null) {
                    String destination = "/user/" + recipient.getUsername() + "/queue/typing";
                    messagingTemplate.convertAndSend(destination, event);
                    log.debug("Evento de digitaÃ§Ã£o publicado via WebSocket para usuÃ¡rio: {} (destino: {})", recipient.getUsername(), destination);
                }
            }
        } catch (Exception e) {
            log.error("Erro ao publicar evento de digitaÃ§Ã£o via WebSocket: {}", e.getMessage(), e);
            // NÃ£o lanÃ§ar exceÃ§Ã£o para nÃ£o quebrar o fluxo
        }
    }
} 
