package com.z7design.fleet_manager.service.email;

import com.z7design.fleet_manager.model.email.EmailAccount;
import com.z7design.fleet_manager.model.email.EmailFolder;
import com.z7design.fleet_manager.model.email.EmailMessage;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.repository.email.EmailAccountRepository;
import com.z7design.fleet_manager.repository.email.EmailFolderRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageAttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeUtility;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImapSyncService {

    private static final Pattern SYSTEM_FOLDER = Pattern.compile(
            "(?i)(\\[gmail\\]/|inbox|sent|drafts|trash|spam|archive|junk|outbox|deleted|enviados|rascunhos|lixeira|lixo eletrônico)");

    private final EmailAccountRepository accountRepository;
    private final EmailFolderRepository folderRepository;
    private final EmailMessageRepository messageRepository;
    private final EmailMessageAttachmentRepository attachmentRepository;
    private final EmailAccountService emailAccountService;

    @Value("${app.file.storage-path:data/files}")
    private String storagePath;

    @Value("${app.email.sync-batch-size:50}")
    private int syncBatchSize;

    @Value("${app.email.sync-max-messages:2000}")
    private int syncMaxMessages;

    /**
     * Sincroniza pastas e mensagens de uma conta.
     */
    @Transactional
    public Map<String, Object> syncAccount(UUID accountId, boolean fullSync) {
        EmailAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Conta de e-mail não encontrada"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accountId", account.getId());
        result.put("email", account.getEmailAddress());
        result.put("startedAt", LocalDateTime.now().toString());

        int foldersSynced = 0;
        int messagesSynced = 0;
        int messagesSkipped = 0;

        try (Store store = emailAccountService.connectImap(account)) {
            Folder defaultFolder = store.getDefaultFolder();
            if (defaultFolder == null) {
                throw new IllegalStateException("Servidor IMAP não expôs pasta raiz");
            }

            Folder[] folders = defaultFolder.list("*");
            if (folders == null) {
                folders = new Folder[0];
            }

            for (Folder remoteFolder : folders) {
                try {
                    SyncResult sr = syncFolder(account, remoteFolder, fullSync);
                    foldersSynced += 1;
                    messagesSynced += sr.messagesSynced;
                    messagesSkipped += sr.messagesSkipped;
                } catch (Exception e) {
                    log.warn("Falha ao sincronizar pasta {} da conta {}: {}",
                            remoteFolder.getFullName(), account.getEmailAddress(), e.getMessage());
                } finally {
                    if (remoteFolder.isOpen()) {
                        try {
                            remoteFolder.close(false);
                        } catch (MessagingException ignored) {
                        }
                    }
                }
            }

            account.setLastSyncAt(LocalDateTime.now());
            account.setLastSyncStatus("SUCCESS");
            account.setLastSyncMessage(foldersSynced + " pastas, " + messagesSynced + " mensagens sincronizadas");
            account.setLastSyncTotal(account.getLastSyncTotal() == null ? messagesSynced : account.getLastSyncTotal() + messagesSynced);
            accountRepository.save(account);

            result.put("foldersSynced", foldersSynced);
            result.put("messagesSynced", messagesSynced);
            result.put("messagesSkipped", messagesSkipped);
            result.put("success", true);
            result.put("message", "Sincronização concluída: " + messagesSynced + " mensagens importadas");
        } catch (Exception e) {
            log.error("Erro na sincronização da conta {}: {}", account.getEmailAddress(), e.getMessage(), e);
            account.setLastSyncStatus("ERROR");
            account.setLastSyncMessage(e.getMessage());
            accountRepository.save(account);

            result.put("success", false);
            result.put("error", emailAccountService.extractFriendlyError(e));
        }
        result.put("finishedAt", LocalDateTime.now().toString());
        return result;
    }

    /**
     * Lista pastas já espelhadas no banco (sem tocar no servidor IMAP).
     */
    public List<Map<String, Object>> listLocalFolders(UUID accountId) {
        return folderRepository.findByAccount_IdOrderByRemoteNameAsc(accountId).stream()
                .map(this::folderToMap)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Sincroniza pastas de uma conta (sem mensagens).
     */
    @Transactional
    public List<Map<String, Object>> syncFolders(UUID accountId) {
        EmailAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Conta de e-mail não encontrada"));

        List<Map<String, Object>> folderList = new ArrayList<>();
        try (Store store = emailAccountService.connectImap(account)) {
            Folder defaultFolder = store.getDefaultFolder();
            if (defaultFolder == null) {
                return folderList;
            }
            Folder[] folders = defaultFolder.list("*");
            if (folders == null) {
                return folderList;
            }
            for (Folder remoteFolder : folders) {
                try {
                    EmailFolder local = mirrorFolder(account, remoteFolder);
                    folderList.add(folderToMap(local));
                } catch (Exception e) {
                    log.warn("Falha ao espelhar pasta {}: {}", remoteFolder.getFullName(), e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Erro ao conectar ao servidor IMAP: " + emailAccountService.extractFriendlyError(e));
        }
        return folderList;
    }

    private SyncResult syncFolder(EmailAccount account, Folder remoteFolder, boolean fullSync) throws Exception {
        SyncResult result = new SyncResult();

        EmailFolder local = mirrorFolder(account, remoteFolder);

        // Lemos sempre em READ_ONLY - este serviço não escreve flags de volta ao servidor
        remoteFolder.open(Folder.READ_ONLY);

        // UIDVALIDITY - os métodos UID pertencem à interface UIDFolder
        UIDFolder uidFolder = (UIDFolder) remoteFolder;
        long uidValidity = -1;
        try {
            uidValidity = uidFolder.getUIDValidity();
        } catch (MessagingException e) {
            log.warn("Servidor não suporta UIDVALIDITY na pasta {}", remoteFolder.getFullName());
        }
        if (uidValidity > 0 && local.getUidValidity() != null && local.getUidValidity() != uidValidity) {
            // UIDVALIDITY mudou: invalida e resincroniza
            messageRepository.deleteAllInBatch(messageRepository.findByFolder_Id(local.getId()));
            local.setHighestUid(0L);
            local.setUidValidity(uidValidity);
        } else if (uidValidity > 0) {
            local.setUidValidity(uidValidity);
        }

        long startUid = local.getHighestUid() == null ? 0 : local.getHighestUid();
        // Sincronização completa: reinicia a partir do início da caixa
        if (fullSync) {
            startUid = 0;
            local.setHighestUid(0L);
        }
        int count = 0;
        int skipped = 0;

        // Busca apenas mensagens com UID maior que o último processado (UID FETCH incremental)
        // em faixas para não travar o servidor com caixas enormes.
        long endUid = -1;
        try {
            endUid = uidFolder.getUIDNext() - 1;
        } catch (MessagingException e) {
            log.warn("Não foi possível obter UIDNext da pasta {}: {}", remoteFolder.getFullName(), e.getMessage());
        }
        List<Message> newMessages = new ArrayList<>();
        if (endUid > startUid) {
            try {
                Message[] range = uidFolder.getMessagesByUID(startUid + 1, endUid);
                if (range != null) {
                    newMessages.addAll(Arrays.asList(range));
                }
            } catch (MessagingException e) {
                log.warn("Falha no UID FETCH por faixa da pasta {}: {} - usando varredura completa",
                        remoteFolder.getFullName(), e.getMessage());
                endUid = -1;
            }
        }
        if (endUid < 0) {
            // Fallback APENAS quando UIDNext não está disponível (servidor não suporta)
            // ou o fetch por faixa falhou. Não cai aqui quando simplesmente não há
            // mensagens novas (endUid <= startUid e endUid >= 0) - evita varrer a
            // caixa inteira a cada sincronização de uma conta ociosa.
            Message[] messages = remoteFolder.getMessages();
            for (Message m : messages) {
                long uid;
                try {
                    uid = uidFolder.getUID(m);
                } catch (MessagingException e) {
                    continue; // servidor sem suporte a UID - ignora mensagem individual
                }
                if (uid > startUid) {
                    newMessages.add(m);
                } else {
                    skipped++;
                }
            }
        }
        newMessages.sort(Comparator.comparingLong(m -> {
            try {
                return uidFolder.getUID(m);
            } catch (MessagingException e) {
                return Long.MAX_VALUE;
            }
        }));

        // Limita volume por sincronização (evita travar servidor com caixas enormes).
        // Processamos as MAIS ANTIGAS primeiro para que highestUid avance de forma
        // incremental - nas sincronizações seguintes o restante é importado em lote.
        int limit = syncMaxMessages > 0 ? syncMaxMessages : Integer.MAX_VALUE;
        if (newMessages.size() > limit) {
            log.info("Pasta {} tem {} novas mensagens; importando lote de {} (das mais antigas primeiro)",
                    remoteFolder.getFullName(), newMessages.size(), limit);
            newMessages = newMessages.subList(0, Math.min(limit, newMessages.size()));
        }

        long maxUidProcessed = startUid;
        Long firstFailedUid = null; // menor UID que falhou - evita pular mensagens em falhas transitórias
        for (Message m : newMessages) {
            long uid;
            try {
                uid = uidFolder.getUID(m);
            } catch (MessagingException e) {
                skipped++;
                continue;
            }
            try {
                saveMessage(account, local, m);
                if (uid > maxUidProcessed) {
                    maxUidProcessed = uid;
                }
                count++;
                if (count % syncBatchSize == 0) {
                    messageRepository.flush();
                }
            } catch (Exception e) {
                log.warn("Falha ao importar mensagem UID {} na pasta {}: {}",
                        uid, remoteFolder.getFullName(), e.getMessage());
                if (firstFailedUid == null || uid < firstFailedUid) {
                    firstFailedUid = uid;
                }
                skipped++;
            }
        }

        // Atualiza UID máximo processado para sincronização incremental correta.
        // Se alguma mensagem falhou, recomeça a partir dela na próxima execução.
        long newHighestUid = firstFailedUid != null ? Math.max(startUid, firstFailedUid - 1) : maxUidProcessed;
        local.setHighestUid(newHighestUid);
        local.setTotalMessages(remoteFolder.getMessageCount());
        folderRepository.save(local);

        result.messagesSynced = count;
        result.messagesSkipped = skipped;
        return result;
    }

    private EmailFolder mirrorFolder(EmailAccount account, Folder remoteFolder) throws MessagingException {
        String remoteName = remoteFolder.getFullName();
        char separator = remoteFolder.getSeparator(); // pode lançar MessagingException
        String display = computeDisplayName(remoteName, separator);

        return folderRepository.findByAccount_IdAndRemoteName(account.getId(), remoteName)
                .map(f -> {
                    f.setDisplayName(display);
                    f.setDelimiter(String.valueOf(separator));
                    f.setAttributes(describeFolder(remoteFolder));
                    return f;
                })
                .orElseGet(() -> {
                    EmailFolder f = EmailFolder.builder()
                            .account(account)
                            .companyId(account.getCompanyId())
                            .remoteName(remoteName)
                            .displayName(display)
                            .delimiter(String.valueOf(separator))
                            .attributes(describeFolder(remoteFolder))
                            .highestUid(0L)
                            .totalMessages(0)
                            .system(SYSTEM_FOLDER.matcher(remoteName).find())
                            .build();
                    return folderRepository.save(f);
                });
    }

    private void saveMessage(EmailAccount account, EmailFolder folder, Message m) throws Exception {
        UIDFolder uidFolder = (UIDFolder) m.getFolder();
        long uid = uidFolder.getUID(m);
        if (messageRepository.findByFolder_IdAndUid(folder.getId(), uid).isPresent()) {
            return;
        }
        if (!(m instanceof MimeMessage mime)) {
            return;
        }

        EmailMessage.EmailMessageBuilder builder = EmailMessage.builder()
                .account(account)
                .folder(folder)
                .companyId(account.getCompanyId())
                .uid(uid)
                .messageIdHeader(safeDecode(mime.getMessageID()))
                .inReplyTo(safeHeader(mime, "In-Reply-To"))
                .subject(safeDecode(mime.getSubject()))
                .fromAddress(emailAccountService.addressesToJson(addressesOf(mime, "FROM")))
                .toAddress(emailAccountService.addressesToJson(addressesOf(mime, "TO")))
                .ccAddress(emailAccountService.addressesToJson(addressesOf(mime, "CC")))
                .senderAddress(emailAccountService.addressesToJson(addressesOf(mime, "SENDER")))
                .date(toLocalDateTime(mime.getSentDate() != null ? mime.getSentDate() : mime.getReceivedDate()))
                .read(m.isSet(Flags.Flag.SEEN))
                .flagged(m.isSet(Flags.Flag.FLAGGED))
                .answered(m.isSet(Flags.Flag.ANSWERED))
                .sizeBytes((long) mime.getSize())
                .hasAttachments(false)
                .attachments(new ArrayList<>());

        // Extrai corpo e anexos
        Map<String, Object> parsed = extractContent(mime);
        builder.bodyText((String) parsed.getOrDefault("text", null));
        builder.bodyHtml((String) parsed.getOrDefault("html", null));

        @SuppressWarnings("unchecked")
        List<Object[]> rawAttachments = (List<Object[]>) parsed.getOrDefault("attachments", new ArrayList<Object[]>());
        if (!rawAttachments.isEmpty()) {
            builder.hasAttachments(true);
        }

        EmailMessage saved = messageRepository.save(builder.build());

        for (Object[] raw : rawAttachments) {
            String fileName = (String) raw[0];
            String contentType = (String) raw[1];
            byte[] bytes = (byte[]) raw[2];
            String contentId = (String) raw[3];
            boolean inline = (boolean) raw[4];

            String safeName = sanitizeFileName(fileName);
            String relPath = "email-attachments/" + account.getId() + "/" + saved.getId() + "/" + safeName;
            Path abs = Paths.get(storagePath).toAbsolutePath().normalize().resolve(relPath).normalize();
            if (!abs.startsWith(Paths.get(storagePath).toAbsolutePath().normalize())) {
                continue; // path traversal guard
            }
            Files.createDirectories(abs.getParent());
            try (InputStream in = new ByteArrayInputStream(bytes)) {
                Files.copy(in, abs, StandardCopyOption.REPLACE_EXISTING);
            }

            EmailMessageAttachment att = EmailMessageAttachment.builder()
                    .message(saved)
                    .account(account)
                    .companyId(account.getCompanyId())
                    .fileName(safeName)
                    .contentType(contentType)
                    .sizeBytes((long) bytes.length)
                    .storagePath(relPath)
                    .contentId(contentId)
                    .inline(inline)
                    .build();
            attachmentRepository.save(att);
            saved.getAttachments().add(att);
        }
    }

    /**
     * Extrai texto puro, HTML e anexos recursivamente de um MimeMessage.
     */
    private Map<String, Object> extractContent(Part part) throws Exception {
        StringBuilder text = new StringBuilder();
        StringBuilder html = new StringBuilder();
        List<Object[]> attachments = new ArrayList<>();
        extractPart(part, text, html, attachments);
        Map<String, Object> result = new HashMap<>();
        result.put("text", text.length() > 0 ? text.toString() : null);
        result.put("html", html.length() > 0 ? html.toString() : null);
        result.put("attachments", attachments);
        return result;
    }

    private void extractPart(Part part, StringBuilder text, StringBuilder html, List<Object[]> attachments) throws Exception {
        if (part.isMimeType("text/plain")) {
            Object content = part.getContent();
            if (content != null) {
                if (text.length() > 0) text.append("\n");
                text.append(content.toString());
            }
        } else if (part.isMimeType("text/html")) {
            Object content = part.getContent();
            if (content != null) {
                if (html.length() > 0) html.append("\n");
                html.append(content.toString());
            }
        } else if (part.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) part.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                extractPart(mp.getBodyPart(i), text, html, attachments);
            }
        } else if (part.isMimeType("message/rfc822")) {
            Object content = part.getContent();
            if (content instanceof Part nested) {
                extractPart(nested, text, html, attachments);
            }
        } else {
            // Anexo ou parte desconhecida
            String fileName = part.getFileName();
            if (fileName != null || Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())
                    || Part.INLINE.equalsIgnoreCase(part.getDisposition())) {
                String decoded = safeDecode(fileName != null ? fileName : "attachment.bin");
                String contentType = part.getContentType();
                if (contentType != null && contentType.contains(";")) {
                    contentType = contentType.substring(0, contentType.indexOf(';')).trim();
                }
                if (contentType != null) {
                    contentType = contentType.toLowerCase(Locale.ROOT);
                }
                byte[] bytes;
                try (InputStream in = part.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                    in.transferTo(out);
                    bytes = out.toByteArray();
                }
                String contentId = safeHeader(part, "Content-ID");
                boolean inline = Part.INLINE.equalsIgnoreCase(part.getDisposition())
                        || (contentId != null && !contentId.isBlank());
                attachments.add(new Object[]{ decoded, contentType, bytes, contentId, inline });
            } else {
                // Sem nome e sem disposition - tenta como texto
                Object content = part.getContent();
                if (content != null) {
                    if (text.length() > 0) text.append("\n");
                    text.append(content.toString());
                }
            }
        }
    }

    private String describeFolder(Folder folder) {
        try {
            int type = folder.getType();
            List<String> attrs = new ArrayList<>();
            if ((type & Folder.HOLDS_MESSAGES) != 0) attrs.add("HAS_MESSAGES");
            if ((type & Folder.HOLDS_FOLDERS) != 0) attrs.add("HAS_CHILDREN");
            return String.join(",", attrs);
        } catch (MessagingException e) {
            return "";
        }
    }

    private String computeDisplayName(String remoteName, char separator) {
        if (!StringUtils.hasText(remoteName)) return "Raiz";
        if (remoteName.equalsIgnoreCase("INBOX")) return "Caixa de Entrada";
        if (remoteName.equalsIgnoreCase("Sent") || remoteName.equalsIgnoreCase("Sent Items")
                || remoteName.endsWith(separator + "Sent")) return "Enviados";
        if (remoteName.equalsIgnoreCase("Drafts") || remoteName.endsWith(separator + "Drafts")) return "Rascunhos";
        if (remoteName.equalsIgnoreCase("Trash") || remoteName.endsWith(separator + "Trash")) return "Lixeira";
        if (remoteName.equalsIgnoreCase("Spam") || remoteName.equalsIgnoreCase("Junk")
                || remoteName.endsWith(separator + "Junk")) return "Spam";
        if (remoteName.equalsIgnoreCase("Archive") || remoteName.endsWith(separator + "Archive")) return "Arquivo";

        int idx = remoteName.lastIndexOf(separator);
        if (idx >= 0 && idx < remoteName.length() - 1) {
            return remoteName.substring(idx + 1);
        }
        return remoteName;
    }

    private List<jakarta.mail.Address> addressesOf(MimeMessage mime, String type) throws Exception {
        return switch (type) {
            case "FROM" -> {
                jakarta.mail.Address[] a = mime.getFrom();
                yield a != null ? Arrays.asList(a) : List.of();
            }
            case "TO" -> {
                jakarta.mail.Address[] a = mime.getRecipients(Message.RecipientType.TO);
                yield a != null ? Arrays.asList(a) : List.of();
            }
            case "CC" -> {
                jakarta.mail.Address[] a = mime.getRecipients(Message.RecipientType.CC);
                yield a != null ? Arrays.asList(a) : List.of();
            }
            case "SENDER" -> {
                jakarta.mail.Address[] a = mime.getSender() != null ? new jakarta.mail.Address[]{ mime.getSender() } : null;
                yield a != null ? Arrays.asList(a) : List.of();
            }
            default -> List.of();
        };
    }

    private String safeHeader(Part part, String header) {
        try {
            String[] values = part.getHeader(header);
            return values != null && values.length > 0 ? values[0] : null;
        } catch (MessagingException e) {
            return null;
        }
    }

    private String safeDecode(String value) {
        if (value == null) return null;
        try {
            return MimeUtility.decodeText(value);
        } catch (Exception e) {
            return value;
        }
    }

    private LocalDateTime toLocalDateTime(java.util.Date date) {
        if (date == null) return null;
        return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
    }

    private String sanitizeFileName(String name) {
        String cleaned = name.replaceAll("[\\\\/:*?\"<>|]", "_").replaceAll("\\s+", " ").trim();
        if (cleaned.isBlank()) cleaned = "attachment.bin";
        return cleaned.length() > 200 ? cleaned.substring(0, 200) : cleaned;
    }

    private Map<String, Object> folderToMap(EmailFolder f) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", f.getId());
        map.put("accountId", f.getAccount() != null ? f.getAccount().getId() : null);
        map.put("remoteName", f.getRemoteName());
        map.put("displayName", f.getDisplayName());
        map.put("uidValidity", f.getUidValidity());
        map.put("highestUid", f.getHighestUid());
        map.put("totalMessages", f.getTotalMessages());
        map.put("system", f.getSystem());
        map.put("unread", messageRepository.countUnreadByFolderId(f.getId()));
        return map;
    }

    private static class SyncResult {
        int messagesSynced;
        int messagesSkipped;
    }
}
