package com.z7design.fleet_manager.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.EmailAccountDTO;
import com.z7design.fleet_manager.dto.EmailAccountRequest;
import com.z7design.fleet_manager.dto.EmailSendRequest;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.email.EmailAccount;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.repository.email.EmailAccountRepository;
import com.z7design.fleet_manager.repository.email.EmailFolderRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageAttachmentRepository;
import com.z7design.fleet_manager.service.AuthenticationService;
import com.z7design.fleet_manager.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailAccountService {

    private final EmailAccountRepository accountRepository;
    private final EmailFolderRepository folderRepository;
    private final EmailMessageRepository messageRepository;
    private final EmailMessageAttachmentRepository attachmentRepository;
    private final AuthenticationService authenticationService;
    private final ObjectMapper objectMapper;

    @Value("${app.file.storage-path:data/files}")
    private String storagePath;

    // ==================== QUERIES ====================

    public List<EmailAccountDTO> findAll(UUID companyId) {
        List<EmailAccount> accounts = accountRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        return accounts.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public EmailAccount getByIdOrThrow(UUID id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conta de e-mail não encontrada: " + id));
    }

    public EmailAccountDTO getDTO(UUID id) {
        return toDTO(getByIdOrThrow(id));
    }

    // ==================== CRUD ====================

    @Transactional
    public EmailAccountDTO create(EmailAccountRequest request, User currentUser) {
        UUID companyId = resolveCompanyId(currentUser);

        if (!StringUtils.hasText(request.getEmailAddress())) {
            throw new IllegalArgumentException("E-mail é obrigatório");
        }
        if (!StringUtils.hasText(request.getImapHost())) {
            throw new IllegalArgumentException("Servidor IMAP é obrigatório");
        }
        if (!StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Senha é obrigatória");
        }

        // Impede duplicidade por empresa
        accountRepository.findByCompanyIdAndEmailAddressIgnoreCase(companyId, request.getEmailAddress().trim())
                .ifPresent(a -> {
                    throw new IllegalArgumentException("Conta de e-mail já cadastrada: " + a.getEmailAddress());
                });

        EmailAccount account = EmailAccount.builder()
                .companyId(companyId)
                .userId(currentUser != null ? currentUser.getId() : null)
                .emailAddress(request.getEmailAddress().trim().toLowerCase())
                .displayName(StringUtils.hasText(request.getDisplayName()) ? request.getDisplayName() : null)
                .imapHost(request.getImapHost().trim())
                .imapPort(request.getImapPort() != null ? request.getImapPort() : 993)
                .imapSsl(request.getImapSsl() != null ? request.getImapSsl() : true)
                .smtpHost(StringUtils.hasText(request.getSmtpHost()) ? request.getSmtpHost().trim() : null)
                .smtpPort(request.getSmtpPort() != null ? request.getSmtpPort() : 587)
                .smtpSsl(request.getSmtpSsl() != null ? request.getSmtpSsl() : false)
                .username(StringUtils.hasText(request.getUsername()) ? request.getUsername().trim() : null)
                .password(request.getPassword())
                .authType(StringUtils.hasText(request.getAuthType()) ? request.getAuthType() : "PASSWORD")
                .status("ACTIVE")
                .lastSyncStatus("NEVER")
                .build();

        EmailAccount saved = accountRepository.save(account);
        log.info("📧 Conta de e-mail criada: {} (empresa {})", saved.getEmailAddress(), companyId);
        return toDTO(saved);
    }

    @Transactional
    public EmailAccountDTO update(UUID id, EmailAccountRequest request) {
        EmailAccount account = getByIdOrThrow(id);

        if (StringUtils.hasText(request.getEmailAddress())) {
            account.setEmailAddress(request.getEmailAddress().trim().toLowerCase());
        }
        if (request.getDisplayName() != null) {
            account.setDisplayName(request.getDisplayName());
        }
        if (StringUtils.hasText(request.getImapHost())) {
            account.setImapHost(request.getImapHost().trim());
        }
        if (request.getImapPort() != null) {
            account.setImapPort(request.getImapPort());
        }
        if (request.getImapSsl() != null) {
            account.setImapSsl(request.getImapSsl());
        }
        if (request.getSmtpHost() != null) {
            account.setSmtpHost(request.getSmtpHost().trim());
        }
        if (request.getSmtpPort() != null) {
            account.setSmtpPort(request.getSmtpPort());
        }
        if (request.getSmtpSsl() != null) {
            account.setSmtpSsl(request.getSmtpSsl());
        }
        if (request.getUsername() != null) {
            account.setUsername(request.getUsername().trim());
        }
        if (StringUtils.hasText(request.getPassword())) {
            account.setPassword(request.getPassword());
        }
        if (StringUtils.hasText(request.getAuthType())) {
            account.setAuthType(request.getAuthType());
        }

        EmailAccount saved = accountRepository.save(account);
        log.info("📧 Conta de e-mail atualizada: {}", saved.getEmailAddress());
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        EmailAccount account = getByIdOrThrow(id);
        accountRepository.delete(account);
        log.info("🗑️ Conta de e-mail excluída: {}", account.getEmailAddress());
    }

    // ==================== TESTE DE CONEXÃO ====================

    public Map<String, Object> testConnection(UUID accountId) {
        EmailAccount account = getByIdOrThrow(accountId);
        return runConnectionTests(account);
    }

    /**
     * Testa credenciais informadas no formulário SEM persistir a conta.
     */
    public Map<String, Object> testCredentials(EmailAccountRequest request) {
        if (!StringUtils.hasText(request.getEmailAddress()) || !StringUtils.hasText(request.getImapHost())) {
            throw new IllegalArgumentException("E-mail e servidor IMAP são obrigatórios para o teste");
        }
        if (!StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Senha é obrigatória para o teste");
        }
        EmailAccount temp = EmailAccount.builder()
                .emailAddress(request.getEmailAddress().trim().toLowerCase())
                .displayName(request.getDisplayName())
                .imapHost(request.getImapHost().trim())
                .imapPort(request.getImapPort() != null ? request.getImapPort() : 993)
                .imapSsl(request.getImapSsl() != null ? request.getImapSsl() : true)
                .smtpHost(StringUtils.hasText(request.getSmtpHost()) ? request.getSmtpHost().trim() : null)
                .smtpPort(request.getSmtpPort() != null ? request.getSmtpPort() : 587)
                .smtpSsl(request.getSmtpSsl() != null ? request.getSmtpSsl() : false)
                .username(StringUtils.hasText(request.getUsername()) ? request.getUsername().trim() : null)
                .password(request.getPassword())
                .build();
        return runConnectionTests(temp);
    }

    private Map<String, Object> runConnectionTests(EmailAccount account) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accountId", account.getId());
        result.put("email", account.getEmailAddress());

        // Testa IMAP
        Map<String, Object> imap = new LinkedHashMap<>();
        try {
            try (Store store = connectImap(account)) {
                imap.put("ok", true);
                imap.put("message", "Conexão IMAP realizada com sucesso em " + account.getImapHost() + ":" + account.getImapPort());
            }
        } catch (Exception e) {
            imap.put("ok", false);
            imap.put("message", extractFriendlyError(e));
        }
        result.put("imap", imap);

        // Testa SMTP
        Map<String, Object> smtp = new LinkedHashMap<>();
        if (StringUtils.hasText(account.getSmtpHost())) {
            try {
                try (Transport transport = connectSmtp(account)) {
                    smtp.put("ok", true);
                    smtp.put("message", "Conexão SMTP realizada com sucesso em " + account.getSmtpHost() + ":" + account.getSmtpPort());
                }
            } catch (Exception e) {
                smtp.put("ok", false);
                smtp.put("message", extractFriendlyError(e));
            }
        } else {
            smtp.put("ok", null);
            smtp.put("message", "SMTP não configurado");
        }
        result.put("smtp", smtp);
        result.put("success", Boolean.TRUE.equals(imap.get("ok")));
        return result;
    }

    // ==================== ENVIO SMTP ====================

    @Transactional
    public Map<String, Object> sendEmail(UUID accountId, EmailSendRequest request) {
        EmailAccount account = getByIdOrThrow(accountId);

        if (!StringUtils.hasText(request.getTo())) {
            throw new IllegalArgumentException("Destinatário (To) é obrigatório");
        }
        if (!StringUtils.hasText(request.getSubject())) {
            throw new IllegalArgumentException("Assunto é obrigatório");
        }

        // Cria a sessão SMTP e usa a MESMA sessão para a mensagem e o transporte
        Session session = buildSmtpSession(account);
        String protocol = Boolean.TRUE.equals(account.getSmtpSsl()) ? "smtps" : "smtp";
        try (Transport transport = session.getTransport(protocol)) {
            transport.connect(account.getSmtpHost(), account.getSmtpPort(),
                    resolveUsername(account), account.getPassword());

            MimeMessage msg = new MimeMessage(session);
            msg.setFrom(new InternetAddress(account.getEmailAddress(),
                    StringUtils.hasText(account.getDisplayName()) ? account.getDisplayName() : account.getEmailAddress()));
            msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(request.getTo()));
            if (StringUtils.hasText(request.getCc())) {
                msg.setRecipients(Message.RecipientType.CC, InternetAddress.parse(request.getCc()));
            }
            if (StringUtils.hasText(request.getBcc())) {
                msg.setRecipients(Message.RecipientType.BCC, InternetAddress.parse(request.getBcc()));
            }
            msg.setSubject(request.getSubject(), "UTF-8");
            msg.setSentDate(new Date());

            String body = StringUtils.hasText(request.getBodyHtml()) ? request.getBodyHtml() : "";
            List<EmailMessageAttachment> attachments = new ArrayList<>();
            if (request.getAttachmentIds() != null) {
                for (String attId : request.getAttachmentIds()) {
                    attachmentRepository.findById(UUID.fromString(attId)).ifPresent(attachments::add);
                }
            }

            if (attachments.isEmpty()) {
                msg.setContent(body, "text/html; charset=UTF-8");
            } else {
                MimeMultipart multipart = new MimeMultipart();
                MimeBodyPart htmlPart = new MimeBodyPart();
                htmlPart.setContent(body, "text/html; charset=UTF-8");
                multipart.addBodyPart(htmlPart);
                for (EmailMessageAttachment att : attachments) {
                    Path file = resolveAttachmentPath(att);
                    if (file != null && Files.exists(file)) {
                        MimeBodyPart filePart = new MimeBodyPart();
                        filePart.attachFile(file.toFile());
                        multipart.addBodyPart(filePart);
                    }
                }
                msg.setContent(multipart);
            }

            transport.sendMessage(msg, msg.getAllRecipients());
            log.info("📤 E-mail enviado via {} -> {}", account.getEmailAddress(), request.getTo());
            return Map.of("success", true, "message", "E-mail enviado com sucesso");
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail via {}: {}", account.getEmailAddress(), e.getMessage());
            throw new IllegalArgumentException("Erro ao enviar e-mail: " + extractFriendlyError(e));
        }
    }

    // ==================== HELPERS ====================

    private UUID resolveCompanyId(User currentUser) {
        UUID companyId = TenantContext.get();
        if (companyId != null) {
            return companyId;
        }
        if (currentUser != null && currentUser.getCompanyId() != null) {
            return currentUser.getCompanyId();
        }
        throw new IllegalArgumentException("Empresa não identificada para a operação");
    }

    Store connectImap(EmailAccount account) throws Exception {
        Properties props = new Properties();
        String protocol = Boolean.TRUE.equals(account.getImapSsl()) ? "imaps" : "imap";
        props.put("mail.store.protocol", protocol);
        props.put("mail." + protocol + ".host", account.getImapHost());
        props.put("mail." + protocol + ".port", String.valueOf(account.getImapPort()));
        props.put("mail." + protocol + ".ssl.enable", String.valueOf(Boolean.TRUE.equals(account.getImapSsl())));
        props.put("mail." + protocol + ".starttls.enable", String.valueOf(!Boolean.TRUE.equals(account.getImapSsl())));
        props.put("mail." + protocol + ".connectiontimeout", "15000");
        props.put("mail." + protocol + ".timeout", "30000");

        Session session = Session.getInstance(props);
        Store store = session.getStore(protocol);
        String username = resolveUsername(account);
        store.connect(account.getImapHost(), account.getImapPort(), username, account.getPassword());
        return store;
    }

    private Session buildSmtpSession(EmailAccount account) {
        Properties props = new Properties();
        String protocol = Boolean.TRUE.equals(account.getSmtpSsl()) ? "smtps" : "smtp";
        props.put("mail.transport.protocol", protocol);
        props.put("mail." + protocol + ".host", account.getSmtpHost());
        props.put("mail." + protocol + ".port", String.valueOf(account.getSmtpPort()));
        props.put("mail." + protocol + ".auth", "true");
        props.put("mail." + protocol + ".ssl.enable", String.valueOf(Boolean.TRUE.equals(account.getSmtpSsl())));
        props.put("mail." + protocol + ".starttls.enable", String.valueOf(!Boolean.TRUE.equals(account.getSmtpSsl())));
        props.put("mail." + protocol + ".connectiontimeout", "15000");
        props.put("mail." + protocol + ".timeout", "30000");

        String username = resolveUsername(account);
        String password = account.getPassword();
        return Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password == null ? "" : password);
            }
        });
    }

    private Transport connectSmtp(EmailAccount account) throws Exception {
        Session session = buildSmtpSession(account);
        String protocol = Boolean.TRUE.equals(account.getSmtpSsl()) ? "smtps" : "smtp";
        Transport transport = session.getTransport(protocol);
        transport.connect(account.getSmtpHost(), account.getSmtpPort(),
                resolveUsername(account), account.getPassword());
        return transport;
    }

    private String resolveUsername(EmailAccount account) {
        return StringUtils.hasText(account.getUsername()) ? account.getUsername() : account.getEmailAddress();
    }

    public EmailAccountDTO toDTO(EmailAccount account) {
        long unread = messageRepository.countByAccount_IdAndReadFalse(account.getId());
        long total = messageRepository.countByAccount_Id(account.getId());
        long folders = folderRepository.countByAccountId(account.getId());
        return EmailAccountDTO.builder()
                .id(account.getId())
                .emailAddress(account.getEmailAddress())
                .displayName(account.getDisplayName())
                .imapHost(account.getImapHost())
                .imapPort(account.getImapPort())
                .imapSsl(account.getImapSsl())
                .smtpHost(account.getSmtpHost())
                .smtpPort(account.getSmtpPort())
                .smtpSsl(account.getSmtpSsl())
                .username(account.getUsername())
                .authType(account.getAuthType())
                .status(account.getStatus())
                .lastSyncAt(account.getLastSyncAt())
                .lastSyncStatus(account.getLastSyncStatus())
                .lastSyncMessage(account.getLastSyncMessage())
                .lastSyncTotal(account.getLastSyncTotal())
                .createdAt(account.getCreatedAt())
                .unreadCount(unread)
                .totalMessages(total)
                .folderCount(folders)
                .build();
    }

    public Path resolveAttachmentPath(EmailMessageAttachment att) {
        if (!StringUtils.hasText(att.getStoragePath())) {
            return null;
        }
        Path base = Paths.get(storagePath).toAbsolutePath().normalize();
        Path candidate = base.resolve(att.getStoragePath()).normalize();
        if (!candidate.startsWith(base)) {
            return null; // proteção contra path traversal
        }
        return candidate;
    }

    String extractFriendlyError(Exception e) {
        String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        msg = msg.replaceAll("(?i)(username|password).*?(?=\\.|$)", "credenciais inválidas");
        if (e instanceof AuthenticationFailedException) {
            return "Falha de autenticação - verifique usuário e senha";
        }
        if (e instanceof jakarta.mail.MessagingException) {
            String lower = msg.toLowerCase();
            if (lower.contains("connect") || lower.contains("timeout") || lower.contains("refused")) {
                return "Não foi possível conectar ao servidor - verifique host, porta e rede";
            }
        }
        return msg.length() > 300 ? msg.substring(0, 300) : msg;
    }

    public String addressesToJson(List<jakarta.mail.Address> addresses) {
        try {
            List<Map<String, String>> list = new ArrayList<>();
            if (addresses != null) {
                for (jakarta.mail.Address a : addresses) {
                    Map<String, String> entry = new LinkedHashMap<>();
                    if (a instanceof InternetAddress ia) {
                        entry.put("name", ia.getPersonal() != null ? ia.getPersonal() : null);
                        entry.put("address", ia.getAddress());
                    } else {
                        entry.put("name", null);
                        entry.put("address", a.toString());
                    }
                    list.add(entry);
                }
            }
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }
}
