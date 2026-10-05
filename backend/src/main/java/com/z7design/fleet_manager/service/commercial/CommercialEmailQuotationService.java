package com.z7design.fleet_manager.service.commercial;

import com.z7design.fleet_manager.dto.EmailAccountRequest;
import com.z7design.fleet_manager.dto.commercial.CommercialAttachmentDTO;
import com.z7design.fleet_manager.dto.commercial.CommercialEmailConfigDTO;
import com.z7design.fleet_manager.dto.commercial.CommercialQuotationDTO;
import com.z7design.fleet_manager.model.commercial.CommercialEmailQuotation;
import com.z7design.fleet_manager.model.commercial.CommercialQuotationAttachment;
import com.z7design.fleet_manager.model.email.EmailAccount;
import com.z7design.fleet_manager.model.email.EmailMessage;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.repository.commercial.CommercialEmailQuotationRepository;
import com.z7design.fleet_manager.repository.commercial.CommercialQuotationAttachmentRepository;
import com.z7design.fleet_manager.repository.email.EmailAccountRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageAttachmentRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageRepository;
import com.z7design.fleet_manager.service.email.EmailAccountService;
import com.z7design.fleet_manager.service.email.ImapSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommercialEmailQuotationService {

    private final CommercialEmailQuotationRepository quotationRepository;
    private final CommercialQuotationAttachmentRepository attachmentRepository;
    private final EmailAccountRepository emailAccountRepository;
    private final EmailMessageRepository emailMessageRepository;
    private final EmailMessageAttachmentRepository emailMessageAttachmentRepository;
    private final EmailAccountService emailAccountService;
    private final ImapSyncService imapSyncService;
    private final QuotationHeuristicParser quotationHeuristicParser;
    private final AttachmentSecurityValidator attachmentSecurityValidator;

    @Value("${app.file.storage-path:data/files}")
    private String storageBasePath;

    private static final String DEFAULT_COMMERCIAL_EMAIL = "comercialvss@viacaosaosilvestre.com.br";
    private static final String DEFAULT_COMMERCIAL_PASS = "Comerci@l2026";
    private static final String DEFAULT_HOST = "mail.viacaosaosilvestre.com.br";

    /**
     * Obtém ou inicializa a configuração de e-mail comercial corporativo da empresa.
     */
    @Transactional
    public CommercialEmailConfigDTO getConfig(UUID companyId) {
        EmailAccount account = findCommercialAccount(companyId);
        if (account == null) {
            // Inicializar com as credenciais oficiais da Viação São Silvestre
            account = EmailAccount.builder()
                    .companyId(companyId)
                    .emailAddress(DEFAULT_COMMERCIAL_EMAIL)
                    .displayName("Comercial Viação São Silvestre")
                    .imapHost(DEFAULT_HOST)
                    .imapPort(993)
                    .imapSsl(true)
                    .smtpHost(DEFAULT_HOST)
                    .smtpPort(465)
                    .smtpSsl(true)
                    .username(DEFAULT_COMMERCIAL_EMAIL)
                    .password(DEFAULT_COMMERCIAL_PASS)
                    .authType("PASSWORD")
                    .status("ACTIVE")
                    .build();
            account = emailAccountRepository.save(account);
            log.info("📧 Conta comercial padrão inicializada para companyId={}", companyId);
        }

        return toConfigDTO(account);
    }

    /**
     * Atualiza as credenciais ou configurações de conexão do e-mail comercial.
     */
    @Transactional
    public CommercialEmailConfigDTO saveConfig(UUID companyId, CommercialEmailConfigDTO dto) {
        EmailAccount account = findCommercialAccount(companyId);
        if (account == null) {
            account = new EmailAccount();
            account.setCompanyId(companyId);
        }

        account.setEmailAddress(StringUtils.hasText(dto.getEmailAddress()) ? dto.getEmailAddress().trim().toLowerCase() : DEFAULT_COMMERCIAL_EMAIL);
        account.setDisplayName(StringUtils.hasText(dto.getDisplayName()) ? dto.getDisplayName().trim() : "Comercial Viação São Silvestre");
        account.setImapHost(StringUtils.hasText(dto.getImapHost()) ? dto.getImapHost().trim() : DEFAULT_HOST);
        account.setImapPort(dto.getImapPort() != null ? dto.getImapPort() : 993);
        account.setImapSsl(dto.getImapSsl() != null ? dto.getImapSsl() : true);
        account.setSmtpHost(StringUtils.hasText(dto.getSmtpHost()) ? dto.getSmtpHost().trim() : DEFAULT_HOST);
        account.setSmtpPort(dto.getSmtpPort() != null ? dto.getSmtpPort() : 465);
        account.setSmtpSsl(dto.getSmtpSsl() != null ? dto.getSmtpSsl() : true);
        account.setUsername(StringUtils.hasText(dto.getUsername()) ? dto.getUsername().trim() : account.getEmailAddress());

        if (StringUtils.hasText(dto.getPassword())) {
            account.setPassword(dto.getPassword().trim());
        }

        account.setStatus("ACTIVE");
        EmailAccount saved = emailAccountRepository.save(account);
        log.info("✅ Configuração de e-mail comercial salva com sucesso para {}", saved.getEmailAddress());
        return toConfigDTO(saved);
    }

    /**
     * Testa a conexão IMAP/SMTP com as credenciais informadas.
     */
    public Map<String, Object> testConnection(CommercialEmailConfigDTO dto) {
        EmailAccountRequest req = new EmailAccountRequest();
        req.setEmailAddress(dto.getEmailAddress() != null ? dto.getEmailAddress() : DEFAULT_COMMERCIAL_EMAIL);
        req.setDisplayName(dto.getDisplayName());
        req.setImapHost(dto.getImapHost() != null ? dto.getImapHost() : DEFAULT_HOST);
        req.setImapPort(dto.getImapPort() != null ? dto.getImapPort() : 993);
        req.setImapSsl(dto.getImapSsl() != null ? dto.getImapSsl() : true);
        req.setSmtpHost(dto.getSmtpHost() != null ? dto.getSmtpHost() : DEFAULT_HOST);
        req.setSmtpPort(dto.getSmtpPort() != null ? dto.getSmtpPort() : 465);
        req.setSmtpSsl(dto.getSmtpSsl() != null ? dto.getSmtpSsl() : true);
        req.setUsername(dto.getUsername() != null ? dto.getUsername() : req.getEmailAddress());
        req.setPassword(dto.getPassword() != null ? dto.getPassword() : DEFAULT_COMMERCIAL_PASS);

        return emailAccountService.testCredentials(req);
    }

    /**
     * Sincroniza e-mails da conta comercial via IMAP, analisa e extrai solicitações de cotação e valida anexos.
     */
    @Transactional
    public Map<String, Object> syncCommercialQuotations(UUID companyId) {
        EmailAccount account = findCommercialAccount(companyId);
        if (account == null) {
            getConfig(companyId);
            account = findCommercialAccount(companyId);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("account", account.getEmailAddress());
        response.put("startedAt", LocalDateTime.now().toString());

        // 1. Sincroniza mensagens do servidor IMAP da São Silvestre
        int syncedMessages = 0;
        try {
            Map<String, Object> syncRes = imapSyncService.syncAccount(account.getId(), false);
            response.put("imapSync", syncRes);
        } catch (Exception e) {
            log.warn("⚠️ Aviso na sincronização direta IMAP: {}", e.getMessage());
            response.put("imapWarning", e.getMessage());
        }

        // 2. Busca mensagens da conta no banco de dados para avaliação de cotações
        List<EmailMessage> messages = emailMessageRepository.findByAccount_IdOrderByDateDesc(account.getId());
        int quotationsFound = 0;
        int newQuotationsCreated = 0;
        int attachmentsScanned = 0;

        for (EmailMessage msg : messages) {
            // Verificar se já foi indexado
            Optional<CommercialEmailQuotation> existingOpt = quotationRepository.findByEmailMessageId(msg.getId());

            // Avaliar se tem solicitação de cotação
            boolean hasAtt = Boolean.TRUE.equals(msg.getHasAttachments());
            QuotationHeuristicParser.ParseResult analysis = quotationHeuristicParser.analyze(
                    msg.getSubject(),
                    msg.getBodyText(),
                    msg.getFromAddress(),
                    msg.getSenderAddress(),
                    hasAtt
            );

            if (analysis.isQuotation()) {
                quotationsFound++;
                CommercialEmailQuotation quot;

                if (existingOpt.isPresent()) {
                    quot = existingOpt.get();
                } else {
                    quot = CommercialEmailQuotation.builder()
                            .companyId(companyId)
                            .emailMessageId(msg.getId())
                            .senderEmail(cleanAddress(msg.getFromAddress()))
                            .senderName(cleanSenderName(msg.getFromAddress()))
                            .clientName(analysis.getInferredClientName())
                            .subject(msg.getSubject())
                            .bodyText(msg.getBodyText())
                            .bodyHtml(msg.getBodyHtml())
                            .receivedAt(msg.getDate() != null ? msg.getDate() : msg.getCreatedAt())
                            .status("PENDING")
                            .confidenceScore(analysis.getConfidenceScore())
                            .detectionKeywords(String.join(", ", analysis.getMatchedKeywords()))
                            .extractedOrigin(analysis.getOrigin())
                            .extractedDestination(analysis.getDestination())
                            .extractedTripDate(analysis.getTripDate())
                            .extractedReturnDate(analysis.getReturnDate())
                            .extractedPassengers(analysis.getPassengers())
                            .extractedVehicleType(analysis.getVehicleType())
                            .build();

                    quot = quotationRepository.save(quot);
                    newQuotationsCreated++;
                }

                // 3. Processar e validar anexos de segurança (antivírus / integridade)
                List<EmailMessageAttachment> msgAttachments = emailMessageAttachmentRepository.findByMessage_IdOrderByCreatedAtAsc(msg.getId());
                for (EmailMessageAttachment att : msgAttachments) {
                    boolean alreadyImported = quot.getAttachments().stream()
                            .anyMatch(a -> a.getFileName().equalsIgnoreCase(att.getFileName()) && Objects.equals(a.getFileSize(), att.getSizeBytes()));

                    if (!alreadyImported) {
                        Path physicalPath = resolveAttachmentPath(att.getStoragePath());
                        AttachmentSecurityValidator.SecurityCheckResult sec = attachmentSecurityValidator.validateFile(physicalPath, att.getFileName());

                        CommercialQuotationAttachment quotationAttachment = CommercialQuotationAttachment.builder()
                                .quotation(quot)
                                .companyId(companyId)
                                .fileName(att.getFileName())
                                .contentType(att.getContentType())
                                .fileSize(att.getSizeBytes())
                                .filePath(att.getStoragePath())
                                .securityStatus(sec.getStatus())
                                .securityDetails(sec.getDetails())
                                .fileHash(sec.getFileHash())
                                .isManualUpload(false)
                                .build();

                        attachmentRepository.save(quotationAttachment);
                        attachmentsScanned++;
                    }
                }
            }
        }

        response.put("quotationsFound", quotationsFound);
        response.put("newQuotationsCreated", newQuotationsCreated);
        response.put("attachmentsScanned", attachmentsScanned);
        response.put("finishedAt", LocalDateTime.now().toString());

        log.info("🏁 Sincronização comercial concluída: {} cotações encontradas, {} novas criadas, {} anexos validados",
                quotationsFound, newQuotationsCreated, attachmentsScanned);

        return response;
    }

    /**
     * Lista cotações identificadas com suporte a busca textual e filtros de status.
     */
    public Page<CommercialQuotationDTO> listQuotations(UUID companyId, String status, String query, Pageable pageable) {
        Page<CommercialEmailQuotation> page;
        if (StringUtils.hasText(query)) {
            page = quotationRepository.searchQuotations(companyId, query.trim(), pageable);
        } else if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
            page = quotationRepository.findByCompanyIdAndStatusOrderByReceivedAtDesc(companyId, status.toUpperCase(), pageable);
        } else {
            page = quotationRepository.findByCompanyIdOrderByReceivedAtDesc(companyId, pageable);
        }

        return page.map(this::toQuotationDTO);
    }

    /**
     * Obtém detalhes completos de uma cotação por ID.
     */
    @Transactional(readOnly = true)
    public CommercialQuotationDTO getQuotationById(UUID id) {
        CommercialEmailQuotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cotação não encontrada: " + id));
        return toQuotationDTO(quotation);
    }

    /**
     * Atualiza status e anotações da cotação.
     */
    @Transactional
    public CommercialQuotationDTO updateStatus(UUID id, String status, String notes, UUID proposalId) {
        CommercialEmailQuotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cotação não encontrada: " + id));

        if (StringUtils.hasText(status)) {
            quotation.setStatus(status.toUpperCase());
        }
        if (notes != null) {
            quotation.setNotes(notes);
        }
        if (proposalId != null) {
            quotation.setProposalId(proposalId);
            quotation.setStatus("PROPOSAL_GENERATED");
        }

        CommercialEmailQuotation saved = quotationRepository.save(quotation);
        return toQuotationDTO(saved);
    }

    /**
     * Upload manual de anexo complementar para uma cotação (.pdf, .xlsx, .xls, .csv).
     */
    @Transactional
    public CommercialAttachmentDTO addManualAttachment(UUID quotationId, MultipartFile file, UUID companyId) {
        CommercialEmailQuotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new IllegalArgumentException("Cotação não encontrada: " + quotationId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio não permitido");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "documento.pdf";

        try {
            // Salvar no diretório de cotações
            String subDir = "quotations/" + quotationId;
            Path uploadDir = Paths.get(storageBasePath, subDir);
            Files.createDirectories(uploadDir);

            String storedFileName = UUID.randomUUID() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path targetPath = uploadDir.resolve(storedFileName);

            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            // Validação de segurança estrita / antivírus
            AttachmentSecurityValidator.SecurityCheckResult sec = attachmentSecurityValidator.validateFile(targetPath, originalFilename);

            if ("BLOCKED".equals(sec.getStatus())) {
                Files.deleteIfExists(targetPath);
                throw new SecurityException("Arquivo rejeitado pela segurança: " + sec.getDetails());
            }

            CommercialQuotationAttachment attachment = CommercialQuotationAttachment.builder()
                    .quotation(quotation)
                    .companyId(companyId)
                    .fileName(originalFilename)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .filePath(subDir + "/" + storedFileName)
                    .securityStatus(sec.getStatus())
                    .securityDetails(sec.getDetails())
                    .fileHash(sec.getFileHash())
                    .isManualUpload(true)
                    .build();

            CommercialQuotationAttachment saved = attachmentRepository.save(attachment);
            return toAttachmentDTO(saved);

        } catch (Exception e) {
            log.error("Erro ao salvar anexo manual da cotação {}: {}", quotationId, e.getMessage());
            throw new RuntimeException("Falha ao salvar anexo: " + e.getMessage());
        }
    }

    /**
     * Localiza o caminho em disco de um anexo para download seguro.
     */
    public Path getAttachmentPath(UUID attachmentId) {
        CommercialQuotationAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Anexo não encontrado: " + attachmentId));

        if ("BLOCKED".equalsIgnoreCase(att.getSecurityStatus())) {
            throw new SecurityException("Download bloqueado: arquivo classificado como perigoso");
        }

        Path path = resolveAttachmentPath(att.getFilePath());
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("Arquivo físico não encontrado no servidor");
        }
        return path;
    }

    // ==================== MAPPERS & UTILS ====================

    private EmailAccount findCommercialAccount(UUID companyId) {
        if (companyId != null) {
            List<EmailAccount> accounts = emailAccountRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
            for (EmailAccount acc : accounts) {
                if (DEFAULT_COMMERCIAL_EMAIL.equalsIgnoreCase(acc.getEmailAddress()) ||
                    (acc.getEmailAddress() != null && acc.getEmailAddress().toLowerCase().contains("comercial"))) {
                    return acc;
                }
            }
            if (!accounts.isEmpty()) {
                return accounts.get(0);
            }
        }
        return emailAccountRepository.findByEmailAddressIgnoreCase(DEFAULT_COMMERCIAL_EMAIL).orElse(null);
    }

    private CommercialEmailConfigDTO toConfigDTO(EmailAccount acc) {
        return CommercialEmailConfigDTO.builder()
                .id(acc.getId())
                .companyId(acc.getCompanyId())
                .emailAddress(acc.getEmailAddress())
                .displayName(acc.getDisplayName())
                .imapHost(acc.getImapHost())
                .imapPort(acc.getImapPort())
                .imapSsl(acc.getImapSsl())
                .smtpHost(acc.getSmtpHost())
                .smtpPort(acc.getSmtpPort())
                .smtpSsl(acc.getSmtpSsl())
                .username(acc.getUsername())
                .password(acc.getPassword())
                .status(acc.getStatus())
                .lastSyncAt(acc.getLastSyncAt())
                .lastSyncStatus(acc.getLastSyncStatus())
                .lastSyncMessage(acc.getLastSyncMessage())
                .lastSyncTotal(acc.getLastSyncTotal())
                .build();
    }

    private CommercialQuotationDTO toQuotationDTO(CommercialEmailQuotation q) {
        List<CommercialAttachmentDTO> attDTOs = q.getAttachments() != null ?
                q.getAttachments().stream().map(this::toAttachmentDTO).collect(Collectors.toList()) :
                new ArrayList<>();

        return CommercialQuotationDTO.builder()
                .id(q.getId())
                .companyId(q.getCompanyId())
                .emailMessageId(q.getEmailMessageId())
                .senderEmail(q.getSenderEmail())
                .senderName(q.getSenderName())
                .clientName(q.getClientName())
                .subject(q.getSubject())
                .bodyText(q.getBodyText())
                .bodyHtml(q.getBodyHtml())
                .receivedAt(q.getReceivedAt())
                .status(q.getStatus())
                .confidenceScore(q.getConfidenceScore())
                .detectionKeywords(q.getDetectionKeywords())
                .extractedOrigin(q.getExtractedOrigin())
                .extractedDestination(q.getExtractedDestination())
                .extractedTripDate(q.getExtractedTripDate())
                .extractedReturnDate(q.getExtractedReturnDate())
                .extractedPassengers(q.getExtractedPassengers())
                .extractedVehicleType(q.getExtractedVehicleType())
                .notes(q.getNotes())
                .proposalId(q.getProposalId())
                .attachments(attDTOs)
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .build();
    }

    private CommercialAttachmentDTO toAttachmentDTO(CommercialQuotationAttachment a) {
        return CommercialAttachmentDTO.builder()
                .id(a.getId())
                .quotationId(a.getQuotation() != null ? a.getQuotation().getId() : null)
                .fileName(a.getFileName())
                .contentType(a.getContentType())
                .fileSize(a.getFileSize())
                .filePath(a.getFilePath())
                .securityStatus(a.getSecurityStatus())
                .securityDetails(a.getSecurityDetails())
                .fileHash(a.getFileHash())
                .isManualUpload(a.getIsManualUpload())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private Path resolveAttachmentPath(String relativePath) {
        if (!StringUtils.hasText(relativePath)) return null;
        return Paths.get(storageBasePath, relativePath);
    }

    private String cleanAddress(String raw) {
        if (!StringUtils.hasText(raw)) return "";
        if (raw.contains("<") && raw.contains(">")) {
            return raw.substring(raw.indexOf("<") + 1, raw.indexOf(">")).trim();
        }
        return raw.trim();
    }

    private String cleanSenderName(String raw) {
        if (!StringUtils.hasText(raw)) return "";
        if (raw.contains("<")) {
            return raw.substring(0, raw.indexOf("<")).replaceAll("[\"']", "").trim();
        }
        return raw.trim();
    }
}
