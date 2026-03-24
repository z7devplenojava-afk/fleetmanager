package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.email.EmailQueue;
import com.z7design.fleet_manager.model.enums.EmailStatus;
import com.z7design.fleet_manager.repository.email.EmailQueueRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;

@Component
@Slf4j
public class EmailDispatchWorker {

    @Autowired
    private EmailQueueRepository emailQueueRepository;

    @Autowired
    private com.z7design.fleet_manager.repository.email.EmailAttachmentRepository emailAttachmentRepository;

    @Scheduled(fixedDelay = 15000) // Roda a cada 15 segundos
    public void processEmailQueue() {
        // Busca lote de 10 emails pendentes
        List<EmailQueue> pendingEmails = emailQueueRepository.findPendingEmails(
                Arrays.asList(EmailStatus.PENDING, EmailStatus.RETRY),
                LocalDateTime.now(),
                PageRequest.of(0, 10));

        if (pendingEmails.isEmpty()) {
            return;
        }

        log.info("Found {} pending emails to process", pendingEmails.size());

        for (EmailQueue email : pendingEmails) {
            processSingleEmail(email);
        }
    }

    private void processSingleEmail(EmailQueue email) {
        try {
            log.info("Processing email ID: {} | Recipient: {}", email.getId(), email.getRecipientTo());

            // 1. Obter a configuração do e-mail
            if (email.getEmailConfig() == null) {
                throw new IllegalStateException("Email configuration missing for queue item " + email.getId());
            }

            // 2. Criar o Sender dinamicamente
            JavaMailSender mailSender = createMailSender(email.getEmailConfig());

            // 3. Criar a mensagem Mime
            MimeMessage message = mailSender.createMimeMessage();
            // true = multipart (attachments)
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(email.getEmailConfig().getSenderEmail(), email.getEmailConfig().getSenderName());
            helper.setTo(email.getRecipientTo().split(";"));

            if (email.getRecipientCc() != null && !email.getRecipientCc().isEmpty()) {
                helper.setCc(email.getRecipientCc().split(";"));
            }

            if (email.getRecipientBcc() != null && !email.getRecipientBcc().isEmpty()) {
                helper.setBcc(email.getRecipientBcc().split(";"));
            }

            helper.setSubject(email.getSubject());
            helper.setText(email.getBodyHtml(), true); // true = HTML

            // 3.5 Adicionar Anexos
            List<com.z7design.fleet_manager.model.email.EmailAttachment> attachments = emailAttachmentRepository
                    .findByEmailQueue(email);
            if (attachments != null && !attachments.isEmpty()) {
                for (com.z7design.fleet_manager.model.email.EmailAttachment att : attachments) {
                    if ("LOCAL".equals(att.getStorageType()) && att.getStoragePath() != null) {
                        java.io.File file = new java.io.File(att.getStoragePath());
                        if (file.exists()) {
                            helper.addAttachment(att.getFileName(), file);
                            log.info("Attached file: {}", att.getFileName());
                        } else {
                            log.warn("Attachment file not found at path: {}", att.getStoragePath());
                        }
                    }
                }
            }

            // 4. Enviar
            mailSender.send(message);

            // 5. Sucesso
            email.setStatus(EmailStatus.SENT);
            email.setSentAt(LocalDateTime.now());
            emailQueueRepository.save(email);

            log.info("Email sent successfully: {}", email.getId());

        } catch (Exception e) {
            log.error("Failed to send email ID: {}", email.getId(), e);

            // Lógica de Retry
            int currentRetries = email.getRetryCount() != null ? email.getRetryCount() : 0;

            if (currentRetries < email.getMaxRetries()) {
                email.setStatus(EmailStatus.RETRY);
                email.setRetryCount(currentRetries + 1);

                // Exponential backoff: 2^retry * 1 minuto
                long minutesToWait = (long) Math.pow(2, email.getRetryCount());
                email.setScheduledAt(LocalDateTime.now().plusMinutes(minutesToWait));
                email.setLastError(e.getMessage());
            } else {
                email.setStatus(EmailStatus.FAILED);
                email.setLastError("Max retries reached. Last error: " + e.getMessage());
            }

            emailQueueRepository.save(email);
        }
    }

    private JavaMailSender createMailSender(com.z7design.fleet_manager.model.email.EmailConfig config) {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(config.getSmtpHost());
        mailSender.setPort(config.getSmtpPort());

        if (config.getSmtpUsername() != null && !config.getSmtpUsername().isEmpty()) {
            mailSender.setUsername(config.getSmtpUsername());
            mailSender.setPassword(config.getSmtpPassword());
        }

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");

        // Configs genéricas ou via JSON properties
        if (config.getProperties() != null) {
            if (Boolean.TRUE.equals(config.getProperties().get("auth"))) {
                props.put("mail.smtp.auth", "true");
            }
            if (Boolean.TRUE.equals(config.getProperties().get("starttls"))) {
                props.put("mail.smtp.starttls.enable", "true");
            }
            if (config.getProperties().containsKey("timeout")) {
                props.put("mail.smtp.connectiontimeout", config.getProperties().get("timeout").toString());
                props.put("mail.smtp.timeout", config.getProperties().get("timeout").toString());
                props.put("mail.smtp.writetimeout", config.getProperties().get("timeout").toString());
            } else {
                props.put("mail.smtp.connectiontimeout", "10000");
                props.put("mail.smtp.timeout", "10000");
                props.put("mail.smtp.writetimeout", "10000");
            }
        } else {
            // Defaults seguros
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.connectiontimeout", "5000");
            props.put("mail.smtp.timeout", "5000");
        }

        return mailSender;
    }
}
