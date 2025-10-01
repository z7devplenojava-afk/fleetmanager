package br.com.fleetmanager.service;

import br.com.fleetmanager.model.Invoice;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.ExpenseStatus;
import br.com.fleetmanager.repository.InvoiceRepository;
import br.com.fleetmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final JavaMailSender mailSender;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

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
    public void create(br.com.fleetmanager.model.Notification notification) {
        // Implementação básica - salvar no repositório se existir
        log.info("Criando notificação: {}", notification);
    }
    
    public void markAsRead(UUID id) {
        log.info("Marcando notificação como lida: {}", id);
    }
    
    public void markAsUnread(UUID id) {
        log.info("Marcando notificação como não lida: {}", id);
    }
    
    public void delete(UUID id) {
        log.info("Excluindo notificação: {}", id);
    }
    
    public br.com.fleetmanager.model.Notification findById(UUID id) {
        log.info("Buscando notificação por ID: {}", id);
        return null; // Implementar quando tiver o repositório
    }
    
    public List<br.com.fleetmanager.model.Notification> findByUserId(UUID userId) {
        log.info("Buscando notificações por usuário: {}", userId);
        return List.of(); // Implementar quando tiver o repositório
    }
    
    public List<br.com.fleetmanager.model.Notification> findByUserIdAndStatus(UUID userId, br.com.fleetmanager.model.enums.NotificationStatus status) {
        log.info("Buscando notificações por usuário e status: {} - {}", userId, status);
        return List.of(); // Implementar quando tiver o repositório
    }
    
    public List<br.com.fleetmanager.model.Notification> findByUserIdAndType(UUID userId, br.com.fleetmanager.model.enums.NotificationType type) {
        log.info("Buscando notificações por usuário e tipo: {} - {}", userId, type);
        return List.of(); // Implementar quando tiver o repositório
    }
    
    public List<br.com.fleetmanager.model.Notification> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        log.info("Buscando notificações por período: {} - {}", start, end);
        return List.of(); // Implementar quando tiver o repositório
    }
    
    public void sendNotification(br.com.fleetmanager.model.Message message) {
        log.info("Enviando notificação para mensagem: {}", message);
    }
    
    public void sendChatTypingNotification(String channel, Object event) {
        log.info("Enviando notificação de digitação: {} - {}", channel, event);
    }
} 