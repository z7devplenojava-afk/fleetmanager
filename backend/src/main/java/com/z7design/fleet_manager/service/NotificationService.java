package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Invoice;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.enums.ExpenseStatus;
import com.z7design.fleet_manager.repository.InvoiceRepository;
import com.z7design.fleet_manager.repository.NotificationRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
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
    private final EmployeeRepository employeeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.notification.email.from:noreply@secureguard.com}")
    private String fromEmail;

    @Value("${app.notification.email.enabled:true}")
    private boolean emailEnabled;

    // Executar todos os dias às 08:00
    @Scheduled(cron = "0 0 8 * * ?")
    public void enviarAlertasVencimento() {
        if (!emailEnabled) {
            log.info("Notificações por email estão desabilitadas");
            return;
        }

        log.info("Iniciando verificação de alertas de vencimento");

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

            log.info("Verificação de alertas concluída. {} vencendo em breve, {} vencidas", 
                    contasVencendoEmBreve.size(), contasVencidas.size());
            
        } catch (Exception e) {
            log.error("Erro ao enviar alertas de vencimento", e);
        }
    }

    @Async
    public void enviarEmailAlerta(List<Invoice> contasVencendoEmBreve, List<Invoice> contasVencidas) {
        // Buscar usuários com permissão financeira
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
        message.setSubject("🚨 Alerta: Contas a Pagar - " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        
        StringBuilder conteudo = new StringBuilder();
        conteudo.append("Olá ").append(usuario.getName()).append(",\n\n");
        conteudo.append("Segue o relatório de alertas de contas a pagar:\n\n");

        // Contas vencidas
        if (!contasVencidas.isEmpty()) {
            BigDecimal valorTotalVencidas = contasVencidas.stream()
                .map(Invoice::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            conteudo.append("🔴 CONTAS VENCIDAS (").append(contasVencidas.size()).append("):\n");
            conteudo.append("Valor Total: R$ ").append(formatarMoeda(valorTotalVencidas)).append("\n\n");

            for (Invoice conta : contasVencidas.stream().limit(10).collect(Collectors.toList())) {
                conteudo.append("• ").append(conta.getDescription())
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

            conteudo.append("🟡 CONTAS VENCENDO EM 7 DIAS (").append(contasVencendoEmBreve.size()).append("):\n");
            conteudo.append("Valor Total: R$ ").append(formatarMoeda(valorTotalVencendoEmBreve)).append("\n\n");

            for (Invoice conta : contasVencendoEmBreve.stream().limit(10).collect(Collectors.toList())) {
                conteudo.append("• ").append(conta.getDescription())
                    .append(" - R$ ").append(formatarMoeda(conta.getAmount()))
                    .append(" (Venc: ").append(conta.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .append(")\n");
            }

            if (contasVencendoEmBreve.size() > 10) {
                conteudo.append("... e mais ").append(contasVencendoEmBreve.size() - 10).append(" contas.\n");
            }
            conteudo.append("\n");
        }

        conteudo.append("📊 Acesse o sistema para mais detalhes e para efetuar os pagamentos.\n\n");
        conteudo.append("---\n");
        conteudo.append("Sistema SecureGuard - Gestão Financeira\n");
        conteudo.append("Este é um email automático, não responda.");

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
                    message.setSubject("📝 Nova Conta a Pagar Cadastrada");
                    
                    StringBuilder conteudo = new StringBuilder();
                    conteudo.append("Olá ").append(usuario.getName()).append(",\n\n");
                    conteudo.append("Uma nova conta a pagar foi cadastrada no sistema:\n\n");
                    conteudo.append("Descrição: ").append(conta.getDescription()).append("\n");
                    conteudo.append("Valor: R$ ").append(formatarMoeda(conta.getAmount())).append("\n");
                    conteudo.append("Vencimento: ").append(conta.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("\n");
                    conteudo.append("Fornecedor: ").append(conta.getSupplier() != null ? conta.getSupplier().getName() : "Não informado").append("\n");
                    conteudo.append("Criado por: ").append(usuarioCriador.getName()).append("\n\n");
                    conteudo.append("Acesse o sistema para mais detalhes.\n\n");
                    conteudo.append("---\n");
                    conteudo.append("Sistema SecureGuard - Gestão Financeira");

                    message.setText(conteudo.toString());
                    mailSender.send(message);
                }
            }
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de conta criada", e);
        }
    }

    private String formatarMoeda(BigDecimal valor) {
        return String.format("%,.2f", valor).replace(",", "X").replace(".", ",").replace("X", ".");
    }

    // Método para envio manual de alertas (pode ser chamado via endpoint)
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
    
    // Métodos para NotificationController
    @Transactional
    public com.z7design.fleet_manager.model.Notification create(com.z7design.fleet_manager.model.Notification notification) {
        log.info("Criando notificação: {}", notification);
        try {
            return notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Erro ao criar notificação", e);
            throw new RuntimeException("Erro ao criar notificação: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void markAsRead(UUID id) {
        log.info("Marcando notificação como lida: {}", id);
        try {
            com.z7design.fleet_manager.model.Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notificação não encontrada"));
            notification.setStatus(com.z7design.fleet_manager.model.enums.NotificationStatus.READ);
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Erro ao marcar notificação como lida", e);
            throw new RuntimeException("Erro ao marcar notificação como lida: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void markAsUnread(UUID id) {
        log.info("Marcando notificação como não lida: {}", id);
        try {
            com.z7design.fleet_manager.model.Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notificação não encontrada"));
            notification.setStatus(com.z7design.fleet_manager.model.enums.NotificationStatus.UNREAD);
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Erro ao marcar notificação como não lida", e);
            throw new RuntimeException("Erro ao marcar notificação como não lida: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void delete(UUID id) {
        log.info("Excluindo notificação: {}", id);
        try {
            if (!notificationRepository.existsById(id)) {
                throw new RuntimeException("Notificação não encontrada");
            }
            notificationRepository.deleteById(id);
        } catch (Exception e) {
            log.error("Erro ao excluir notificação", e);
            throw new RuntimeException("Erro ao excluir notificação: " + e.getMessage(), e);
        }
    }
    
    public com.z7design.fleet_manager.model.Notification findById(UUID id) {
        log.info("Buscando notificação por ID: {}", id);
        try {
            return notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notificação não encontrada"));
        } catch (Exception e) {
            log.error("Erro ao buscar notificação por ID", e);
            throw new RuntimeException("Erro ao buscar notificação: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findByUserId(UUID userId) {
        log.info("Buscando notificações por usuário: {}", userId);
        try {
            return notificationRepository.findByUserId(userId);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por usuário", e);
            throw new RuntimeException("Erro ao buscar notificações: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findByUserIdAndStatus(UUID userId, com.z7design.fleet_manager.model.enums.NotificationStatus status) {
        log.info("Buscando notificações por usuário e status: {} - {}", userId, status);
        try {
            return notificationRepository.findByUserIdAndStatus(userId, status);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por usuário e status", e);
            throw new RuntimeException("Erro ao buscar notificações: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findByUserIdAndType(UUID userId, com.z7design.fleet_manager.model.enums.NotificationType type) {
        log.info("Buscando notificações por usuário e tipo: {} - {}", userId, type);
        try {
            return notificationRepository.findByUserIdAndType(userId, type);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por usuário e tipo", e);
            throw new RuntimeException("Erro ao buscar notificações: " + e.getMessage(), e);
        }
    }
 
    public List<com.z7design.fleet_manager.model.Notification> findByUserIdOrderByCreatedAtDesc(UUID userId) {
        log.info("Buscando notificações por usuário (ordenado): {}", userId);
        try {
            return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por usuário", e);
            throw new RuntimeException("Erro ao buscar notificações: " + e.getMessage(), e);
        }
    }
 
    public List<com.z7design.fleet_manager.model.Notification> findByUserIdAndTypeOrderByCreatedAtDesc(
            UUID userId,
            com.z7design.fleet_manager.model.enums.NotificationType type) {
        log.info("Buscando notificações por usuário e tipo (ordenado): {} - {}", userId, type);
        try {
            return notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por usuário e tipo", e);
            throw new RuntimeException("Erro ao buscar notificações: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        log.info("Buscando notificações por período: {} - {}", start, end);
        try {
            return notificationRepository.findByCreatedAtBetween(start, end);
        } catch (Exception e) {
            log.error("Erro ao buscar notificações por período", e);
            throw new RuntimeException("Erro ao buscar notificações: " + e.getMessage(), e);
        }
    }
    
    public List<com.z7design.fleet_manager.model.Notification> findAll() {
        log.info("Buscando todas as notificações");
        try {
            return notificationRepository.findAllWithRelationships();
        } catch (Exception e) {
            log.error("Erro ao buscar todas as notificações", e);
            throw new RuntimeException("Erro ao buscar notificações: " + e.getMessage(), e);
        }
    }
    
    public void sendNotification(com.z7design.fleet_manager.model.Message message) {
        log.info("Enviando notificação para mensagem: {}", message);
        
        try {
            // Publicar notificação via WebSocket para todos os destinatários
            if (message.getRecipients() != null && !message.getRecipients().isEmpty()) {
                for (User recipient : message.getRecipients()) {
                    if (recipient.getUsername() != null) {
                        String destination = "/user/" + recipient.getUsername() + "/queue/notifications";
                        messagingTemplate.convertAndSend(destination, message);
                        log.info("Notificação publicada via WebSocket para usuário: {} (destino: {})", recipient.getUsername(), destination);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro ao publicar notificação via WebSocket: {}", e.getMessage(), e);
            // Não lançar exceção para não quebrar o fluxo
        }
    }
    
    public void sendChatTypingNotification(String recipientId, Object event) {
        log.info("Enviando notificação de digitação: {} - {}", recipientId, event);
        
        try {
            // Publicar evento de digitação via WebSocket
            if (recipientId != null) {
                User recipient = userRepository.findById(UUID.fromString(recipientId)).orElse(null);
                if (recipient != null && recipient.getUsername() != null) {
                    String destination = "/user/" + recipient.getUsername() + "/queue/typing";
                    messagingTemplate.convertAndSend(destination, event);
                    log.debug("Evento de digitação publicado via WebSocket para usuário: {} (destino: {})", recipient.getUsername(), destination);
                }
            }
        } catch (Exception e) {
            log.error("Erro ao publicar evento de digitação via WebSocket: {}", e.getMessage(), e);
            // Não lançar exceção para não quebrar o fluxo
        }
    }

    public List<com.z7design.fleet_manager.model.Notification> findByEmployee(UUID employeeId, boolean unreadOnly) {
        log.info("Buscando notificações do funcionário: {} (somente não lidas: {})", employeeId, unreadOnly);
        try {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            if (employee == null || employee.getUser() == null) {
                return java.util.Collections.emptyList();
            }
            User employeeUser = employee.getUser();
            if (unreadOnly) {
                return findByUserIdAndStatus(employeeUser.getId(), com.z7design.fleet_manager.model.enums.NotificationStatus.UNREAD);
            } else {
                return findByUserId(employeeUser.getId());
            }
        } catch (Exception e) {
            log.error("Erro ao buscar notificações do funcionário", e);
            return java.util.Collections.emptyList();
        }
    }

    @Transactional
    public void markAllAsRead(UUID employeeId) {
        log.info("Marcando todas as notificações do funcionário {} como lidas", employeeId);
        try {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            if (employee == null || employee.getUser() == null) {
                return;
            }
            User employeeUser = employee.getUser();
            List<com.z7design.fleet_manager.model.Notification> unread = notificationRepository.findByUserIdAndStatus(
                    employeeUser.getId(), com.z7design.fleet_manager.model.enums.NotificationStatus.UNREAD);
            for (com.z7design.fleet_manager.model.Notification notification : unread) {
                notification.setStatus(com.z7design.fleet_manager.model.enums.NotificationStatus.READ);
                notification.setReadAt(java.time.LocalDateTime.now());
                notificationRepository.save(notification);
            }
        } catch (Exception e) {
            log.error("Erro ao marcar todas as notificações como lidas", e);
            throw new RuntimeException("Erro ao marcar todas as notificações como lidas: " + e.getMessage(), e);
        }
    }
}
