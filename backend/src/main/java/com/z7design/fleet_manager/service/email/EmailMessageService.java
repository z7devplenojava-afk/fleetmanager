package com.z7design.fleet_manager.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.EmailAddressDTO;
import com.z7design.fleet_manager.dto.EmailAttachmentDTO;
import com.z7design.fleet_manager.dto.EmailMessageDTO;
import com.z7design.fleet_manager.model.email.EmailMessage;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.repository.email.EmailFolderRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageAttachmentRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailMessageService {

    private final EmailMessageRepository messageRepository;
    private final EmailMessageAttachmentRepository attachmentRepository;
    private final EmailFolderRepository folderRepository;
    private final EmailAccountService emailAccountService;
    private final ObjectMapper objectMapper;

    // ==================== LISTAGEM ====================

    public Page<EmailMessageDTO> listByFolder(UUID folderId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "date"));
        Page<EmailMessage> result = messageRepository.findByFolder_IdOrderByDateDesc(folderId, pageable);
        return toDTOPage(result);
    }

    public Page<EmailMessageDTO> listByAccount(UUID accountId, UUID folderId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "date"));
        Page<EmailMessage> result = messageRepository.findByAccountAndOptionalFolder(accountId, folderId, pageable);
        return toDTOPage(result);
    }

    public Page<EmailMessageDTO> search(UUID accountId, String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(Math.max(size, 1), 100));
        if (!StringUtils.hasText(query)) {
            return listByAccount(accountId, null, page, size);
        }
        long total = messageRepository.countSearch(accountId, query.trim());
        List<EmailMessage> results = messageRepository.search(accountId, query.trim(), pageable);
        List<EmailMessageDTO> dto = results.stream().map(this::toSummaryDTO).collect(Collectors.toList());
        return new PageImpl<>(dto, pageable, total);
    }

    // ==================== LEITURA ====================

    public EmailMessageDTO getMessage(UUID id) {
        EmailMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada"));
        return toFullDTO(message);
    }

    @Transactional
    public EmailMessageDTO getMessageAndMarkRead(UUID id) {
        EmailMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada"));
        if (!Boolean.TRUE.equals(message.getRead())) {
            messageRepository.updateReadStatus(id, true);
            message.setRead(true);
        }
        return toFullDTO(message);
    }

    // ==================== AÇÕES ====================

    @Transactional
    public EmailMessageDTO markRead(UUID id, boolean read) {
        messageRepository.updateReadStatus(id, read);
        return toFullDTO(messageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada")));
    }

    @Transactional
    public EmailMessageDTO toggleFlag(UUID id) {
        EmailMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mensagem não encontrada"));
        boolean newFlag = !Boolean.TRUE.equals(message.getFlagged());
        messageRepository.updateFlaggedStatus(id, newFlag);
        message.setFlagged(newFlag);
        return toFullDTO(message);
    }

    @Transactional
    public void deleteMessage(UUID id) {
        messageRepository.deleteById(id);
    }

    // ==================== ANEXOS ====================

    public EmailMessageAttachment getAttachment(UUID attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Anexo não encontrado"));
    }

    public byte[] readAttachmentBytes(EmailMessageAttachment att) {
        Path file = emailAccountService.resolveAttachmentPath(att);
        if (file == null || !Files.exists(file)) {
            throw new IllegalArgumentException("Arquivo do anexo não encontrado em disco");
        }
        try {
            return Files.readAllBytes(file);
        } catch (Exception e) {
            throw new IllegalArgumentException("Erro ao ler anexo: " + e.getMessage());
        }
    }

    // ==================== DTO HELPERS ====================

    private Page<EmailMessageDTO> toDTOPage(Page<EmailMessage> page) {
        List<EmailMessageDTO> dto = page.getContent().stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(dto, page.getPageable(), page.getTotalElements());
    }

    private EmailMessageDTO toSummaryDTO(EmailMessage m) {
        return EmailMessageDTO.builder()
                .id(m.getId())
                .accountId(m.getAccount() != null ? m.getAccount().getId() : null)
                .folderId(m.getFolder() != null ? m.getFolder().getId() : null)
                .uid(m.getUid())
                .messageIdHeader(m.getMessageIdHeader())
                .inReplyTo(m.getInReplyTo())
                .subject(m.getSubject())
                .from(parseAddresses(m.getFromAddress()))
                .to(parseAddresses(m.getToAddress()))
                .date(m.getDate())
                .read(m.getRead())
                .flagged(m.getFlagged())
                .answered(m.getAnswered())
                .hasAttachments(m.getHasAttachments())
                .sizeBytes(m.getSizeBytes())
                .attachments(null)
                .build();
    }

    private EmailMessageDTO toFullDTO(EmailMessage m) {
        EmailMessageDTO dto = toSummaryDTO(m);
        dto.setBodyText(m.getBodyText());
        dto.setBodyHtml(m.getBodyHtml());
        dto.setCc(parseAddresses(m.getCcAddress()));

        List<EmailMessageAttachment> attachments = attachmentRepository.findByMessage_IdOrderByCreatedAtAsc(m.getId());
        List<EmailAttachmentDTO> attDTO = attachments.stream().map(a -> EmailAttachmentDTO.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .contentType(a.getContentType())
                .sizeBytes(a.getSizeBytes())
                .inline(a.getInline())
                .contentId(a.getContentId())
                .downloadUrl("/api/email/attachments/" + a.getId() + "/download")
                .build()).collect(Collectors.toList());
        dto.setAttachments(attDTO);
        return dto;
    }

    private List<EmailAddressDTO> parseAddresses(String json) {
        if (!StringUtils.hasText(json)) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, EmailAddressDTO.class));
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
