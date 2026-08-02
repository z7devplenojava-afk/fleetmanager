package com.z7design.fleet_manager.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.ServerSetup;
import com.z7design.fleet_manager.model.email.EmailAccount;
import com.z7design.fleet_manager.model.email.EmailFolder;
import com.z7design.fleet_manager.model.email.EmailMessage;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.repository.email.EmailAccountRepository;
import com.z7design.fleet_manager.repository.email.EmailFolderRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageAttachmentRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageRepository;
import com.z7design.fleet_manager.service.AuthenticationService;
import jakarta.mail.Message;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Teste de integração do fluxo IMAP real usando GreenMail como servidor
 * IMAP/SMTP embarcado. Repositórios são mockados (sem banco de dados) para
 * validar o protocolo IMAP de ponta a ponta: espelhamento de pastas, UID
 * incremental, extração de conteúdo e gravação de anexos em disco.
 */
class ImapSyncServiceIntegrationTest {

    private static final String USER_EMAIL = "user@test.com";
    private static final String SENDER_EMAIL = "sender@test.com";
    private static final String PASSWORD = "secret123";

    private GreenMail greenMail;
    private int imapPort;
    private int smtpPort;

    private EmailAccountRepository accountRepository;
    private EmailFolderRepository folderRepository;
    private EmailMessageRepository messageRepository;
    private EmailMessageAttachmentRepository attachmentRepository;

    private EmailAccountService emailAccountService;
    private ImapSyncService imapSyncService;

    private EmailAccount account;
    private UUID accountId;

    // Estado em memória dos mocks para simular persistência entre chamadas
    private final Map<String, EmailFolder> folderMap = new HashMap<>();
    private final List<EmailMessage> savedMessages = new ArrayList<>();

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        imapPort = findFreePort();
        smtpPort = findFreePort();
        greenMail = new GreenMail(new ServerSetup[]{
                new ServerSetup(imapPort, "127.0.0.1", "imap"),
                new ServerSetup(smtpPort, "127.0.0.1", "smtp")});
        greenMail.start();
        greenMail.setUser(USER_EMAIL, PASSWORD);
        greenMail.setUser(SENDER_EMAIL, PASSWORD);

        accountId = UUID.randomUUID();
        account = EmailAccount.builder()
                .id(accountId)
                .companyId(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .emailAddress(USER_EMAIL)
                .displayName("Usuário Teste")
                .imapHost("127.0.0.1")
                .imapPort(imapPort)
                .imapSsl(false)
                .smtpHost("127.0.0.1")
                .smtpPort(smtpPort)
                .smtpSsl(false)
                .username(USER_EMAIL)
                .password(PASSWORD)
                .authType("PASSWORD")
                .status("ACTIVE")
                .build();

        accountRepository = mock(EmailAccountRepository.class);
        folderRepository = mock(EmailFolderRepository.class);
        messageRepository = mock(EmailMessageRepository.class);
        attachmentRepository = mock(EmailMessageAttachmentRepository.class);
        AuthenticationService authenticationService = mock(AuthenticationService.class);

        emailAccountService = new EmailAccountService(
                accountRepository, folderRepository, messageRepository,
                attachmentRepository, authenticationService, new ObjectMapper());
        ReflectionTestUtils.setField(emailAccountService, "storagePath", tempDir.toString());

        imapSyncService = new ImapSyncService(
                accountRepository, folderRepository, messageRepository,
                attachmentRepository, emailAccountService);
        ReflectionTestUtils.setField(imapSyncService, "storagePath", tempDir.toString());
        ReflectionTestUtils.setField(imapSyncService, "syncBatchSize", 50);
        ReflectionTestUtils.setField(imapSyncService, "syncMaxMessages", 2000);

        // Stubs com estado para simular persistência entre sincronizações
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(EmailAccount.class))).thenAnswer(inv -> inv.getArgument(0));

        when(folderRepository.findByAccount_IdAndRemoteName(eq(accountId), anyString()))
                .thenAnswer(inv -> Optional.ofNullable(folderMap.get(inv.getArgument(1))));
        when(folderRepository.save(any(EmailFolder.class))).thenAnswer(inv -> {
            EmailFolder f = inv.getArgument(0);
            folderMap.put(f.getRemoteName(), f);
            return f;
        });

        when(messageRepository.findByFolder_IdAndUid(any(), any()))
                .thenAnswer(inv -> {
                    Long uid = inv.getArgument(1);
                    return savedMessages.stream().filter(m -> uid.equals(m.getUid())).findFirst();
                });
        when(messageRepository.save(any(EmailMessage.class))).thenAnswer(inv -> {
            EmailMessage m = inv.getArgument(0);
            savedMessages.add(m);
            return m;
        });
    }

    @AfterEach
    void tearDown() {
        if (greenMail != null) {
            greenMail.stop();
        }
    }

    // ════════════════════════════════════════════════════════════════
    // Fluxo IMAP
    // ════════════════════════════════════════════════════════════════

    @Test
    void syncAccount_FullSync_ShouldImportMessageFromInbox() throws Exception {
        deliverTextEmail("Assunto de Teste", "Corpo do e-mail de teste");

        Map<String, Object> result = imapSyncService.syncAccount(accountId, true);

        assertEquals(Boolean.TRUE, result.get("success"));
        assertEquals(1, ((Number) result.get("messagesSynced")).intValue());
        assertEquals(1, savedMessages.size());

        EmailMessage saved = savedMessages.get(0);
        assertEquals("Assunto de Teste", saved.getSubject());
        assertTrue(saved.getBodyText().contains("Corpo do e-mail de teste"));
        assertTrue(saved.getFromAddress().contains(SENDER_EMAIL));
        assertTrue(saved.getToAddress().contains(USER_EMAIL));
        assertEquals(Boolean.FALSE, saved.getRead());
        assertEquals(accountId, saved.getAccount().getId());

        // Pasta INBOX espelhada com UID avançado e status da conta atualizado
        assertTrue(folderMap.containsKey("INBOX"));
        assertNotNull(folderMap.get("INBOX").getHighestUid());
        assertEquals("SUCCESS", account.getLastSyncStatus());
    }

    @Test
    void syncAccount_IncrementalSync_ShouldImportOnlyNewMessages() throws Exception {
        deliverTextEmail("Primeiro", "Corpo 1");

        Map<String, Object> first = imapSyncService.syncAccount(accountId, true);
        assertEquals(1, ((Number) first.get("messagesSynced")).intValue());
        assertEquals(1, savedMessages.size());

        deliverTextEmail("Segundo", "Corpo 2");

        Map<String, Object> second = imapSyncService.syncAccount(accountId, false);
        assertEquals(1, ((Number) second.get("messagesSynced")).intValue());
        assertEquals(2, savedMessages.size());

        // A primeira mensagem não foi duplicada
        long distinctUids = savedMessages.stream().map(EmailMessage::getUid).distinct().count();
        assertEquals(2, distinctUids);
    }

    @Test
    void syncAccount_ShouldPersistAttachmentToDisk() throws Exception {
        Path attachmentFile = tempDir.resolve("anexo-origem.bin");
        Files.writeString(attachmentFile, "conteudo do anexo");

        Session session = Session.getInstance(new Properties());
        MimeMessage msg = new MimeMessage(session);
        msg.setFrom(new InternetAddress(SENDER_EMAIL));
        msg.setRecipients(Message.RecipientType.TO, USER_EMAIL);
        msg.setSubject("Com anexo");
        MimeBodyPart text = new MimeBodyPart();
        text.setText("Corpo com anexo");
        MimeBodyPart file = new MimeBodyPart();
        // Content-type NÃO-texto para ser classificado como anexo (não texto)
        file.setContent(Files.readAllBytes(attachmentFile), "application/octet-stream");
        file.setFileName("relatorio.txt");
        file.setDisposition(Part.ATTACHMENT);
        MimeMultipart mp = new MimeMultipart();
        mp.addBodyPart(text);
        mp.addBodyPart(file);
        msg.setContent(mp);
        deliver(msg);

        Map<String, Object> result = imapSyncService.syncAccount(accountId, true);

        assertEquals(Boolean.TRUE, result.get("success"));
        EmailMessage saved = savedMessages.get(0);
        assertEquals(Boolean.TRUE, saved.getHasAttachments());

        ArgumentCaptor<EmailMessageAttachment> captor = ArgumentCaptor.forClass(EmailMessageAttachment.class);
        verify(attachmentRepository, atLeastOnce()).save(captor.capture());

        EmailMessageAttachment att = captor.getValue();
        assertEquals("relatorio.txt", att.getFileName());
        // O serviço normaliza o content-type em minúsculas antes de persistir
        assertEquals("application/octet-stream", att.getContentType());
        Path stored = tempDir.resolve(att.getStoragePath()).normalize();
        assertTrue(Files.exists(stored), "Anexo deveria existir em disco: " + stored);
        assertEquals("conteudo do anexo", Files.readString(stored));
    }

    @Test
    void syncAccount_ShouldReturnFailure_WhenPasswordInvalid() {
        EmailAccount bad = EmailAccount.builder()
                .id(accountId)
                .companyId(account.getCompanyId())
                .emailAddress(USER_EMAIL)
                .imapHost("127.0.0.1")
                .imapPort(imapPort)
                .imapSsl(false)
                .username(USER_EMAIL)
                .password("senha-errada")
                .build();
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(bad));

        Map<String, Object> result = imapSyncService.syncAccount(accountId, true);

        assertEquals(Boolean.FALSE, result.get("success"));
        assertEquals("ERROR", bad.getLastSyncStatus());
        assertNotNull(result.get("error"));
    }

    @Test
    void listLocalFolders_ShouldReturnMirroredFoldersFromDatabase() {
        EmailFolder folder = EmailFolder.builder()
                .account(account)
                .companyId(account.getCompanyId())
                .remoteName("INBOX")
                .displayName("Caixa de Entrada")
                .system(true)
                .highestUid(5L)
                .build();
        when(folderRepository.findByAccount_IdOrderByRemoteNameAsc(accountId))
                .thenReturn(List.of(folder));
        when(messageRepository.countUnreadByFolderId(any())).thenReturn(2L);

        List<Map<String, Object>> folders = imapSyncService.listLocalFolders(accountId);

        assertEquals(1, folders.size());
        assertEquals("INBOX", folders.get(0).get("remoteName"));
        assertEquals("Caixa de Entrada", folders.get(0).get("displayName"));
        assertEquals(2, ((Number) folders.get(0).get("unread")).intValue());
    }

    // ════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════

    private void deliverTextEmail(String subject, String body) throws Exception {
        Session session = Session.getInstance(new Properties());
        MimeMessage msg = new MimeMessage(session);
        msg.setFrom(new InternetAddress(SENDER_EMAIL));
        msg.setRecipients(Message.RecipientType.TO, USER_EMAIL);
        msg.setSubject(subject, "UTF-8");
        msg.setText(body);
        deliver(msg);
    }

    /** Envia via SMTP real do GreenMail para a caixa do destinatário. */
    private void deliver(MimeMessage msg) throws Exception {
        Session session = Session.getInstance(new Properties());
        try (Transport transport = session.getTransport("smtp")) {
            transport.connect("127.0.0.1", smtpPort, SENDER_EMAIL, PASSWORD);
            transport.sendMessage(msg, msg.getAllRecipients());
        }
    }

    private static int findFreePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }
}
