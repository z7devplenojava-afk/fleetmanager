package com.z7design.fleet_manager.service.email;

import com.z7design.fleet_manager.model.email.EmailConfig;
import com.z7design.fleet_manager.model.email.EmailQueue;
import com.z7design.fleet_manager.repository.email.EmailQueueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class EmailQueueService {

    @Autowired
    private EmailQueueRepository emailQueueRepository;

    @Autowired
    private EmailConfigService emailConfigService;

    @Transactional
    public EmailQueue enqueue(String recipientTo, String subject, String bodyHtml, EmailConfig config) {
        EmailQueue queue = new EmailQueue();
        queue.setRecipientTo(recipientTo);
        queue.setSubject(subject);
        queue.setBodyHtml(bodyHtml);
        queue.setEmailConfig(config);
        queue.setScheduledAt(LocalDateTime.now());

        return emailQueueRepository.save(queue);
    }

    /**
     * Enqueue usando um template e variáveis de substituição simples.
     */
    @Transactional
    public EmailQueue enqueueTemplate(String recipientTo, String subjectTemplate, String bodyTemplate,
            Map<String, String> variables, EmailConfig config) {
        String finalSubject = replaceVariables(subjectTemplate, variables);
        String finalBody = replaceVariables(bodyTemplate, variables);

        return enqueue(recipientTo, finalSubject, finalBody, config);
    }

    @Autowired
    private com.z7design.fleet_manager.repository.email.EmailAttachmentRepository emailAttachmentRepository;

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    @lombok.Builder
    public static class AttachmentDto {
        private String fileName;
        private String contentType;
        private String storagePath;
        private Long size;
    }

    @Transactional
    public EmailQueue enqueueWithAttachments(String recipientTo, String subject, String bodyHtml, EmailConfig config,
            java.util.List<AttachmentDto> attachments) {
        EmailQueue queue = enqueue(recipientTo, subject, bodyHtml, config);

        if (attachments != null && !attachments.isEmpty()) {
            for (AttachmentDto att : attachments) {
                com.z7design.fleet_manager.model.email.EmailAttachment attachmentEntity = new com.z7design.fleet_manager.model.email.EmailAttachment();
                attachmentEntity.setEmailQueue(queue);
                attachmentEntity.setFileName(att.getFileName());
                attachmentEntity.setContentType(att.getContentType());
                attachmentEntity.setStoragePath(att.getStoragePath());
                attachmentEntity.setFileSizeBytes(att.getSize());
                attachmentEntity.setStorageType("LOCAL");

                emailAttachmentRepository.save(attachmentEntity);
            }
        }

        return queue;
    }

    private String replaceVariables(String template, Map<String, String> variables) {
        if (template == null)
            return "";
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            result = result.replace(placeholder, entry.getValue());
        }
        return result;
    }
}
