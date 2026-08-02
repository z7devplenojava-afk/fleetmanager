package com.z7design.fleet_manager.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.ServerSetup;
import com.z7design.fleet_manager.dto.EmailAccountRequest;
import com.z7design.fleet_manager.dto.EmailSendRequest;
import com.z7design.fleet_manager.model.email.EmailAccount;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.repository.email.EmailAccountRepository;
import com.z7design.fleet_manager.repository.email.EmailFolderRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageAttachmentRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageRepository;
import com.z7design.fleet_manager.service.AuthenticationService;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Teste de integração do envio SMTP real usando GreenMail como servidor
 * SMTP/IMAP embarcado. Valida envio de e-mail, anexos a partir do disco e o
 * fluxo de teste de conexão/teste de credenciais (sem persistir a conta).
 */
class EmailAccountServiceSmtpIntegrationTest {

    private static final String USER_EMAIL = "user@test.com";
    private static final String RECIPIENT_EMAIL = "destinatario@test.com";
    private static final String PASSWORD = "secret123";

    private GreenMail greenMail;
    private int imapPort;
    private int smtpPort;

    private EmailAccountRepository accountRepository;
    private EmailFolderRepository folderRepository;
    private EmailMessageRepository messageRepository;
    private EmailMessageAttachmentRepository attachmentRepository;

    private EmailAccountService emailAccountService;

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
        greenMail.setUser(RECIPIENT_EMAIL, PASSWORD);

        accountRepository = mock(EmailAccountRepository.class);
        folderRepository = mock(EmailFolderRepository.class);
        messageRepository = mock(EmailMessageRepository.class);
        attachmentRepository = mock(EmailMessageAttachmentRepository.class);
        AuthenticationService authenticationService = mock(AuthenticationService.class);

        emailAccountService = new EmailAccountService(
                accountRepository, folderRepository, messageRepository,
                attachmentRepository, authenticationService, new ObjectMapper());
        ReflectionTestUtils.setField(emailAccountService, "storagePath", tempDir.toString());
    }

    @AfterEach
    void tearDown() {
        if (greenMail != null) {
            greenMail.stop();
        }
    }

    // ════════════════════════════════════════════════════════════════
    // Envio SMTP
    // ════════════════════════════════════════════════════════════════

    @Test
    void sendEmail_ShouldDeliverMessageViaSmtp() throws Exception {
        EmailAccount account = createAccount();
        when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

        EmailSendRequest request = EmailSendRequest.builder()
                .to(RECIPIENT_EMAIL)
                .subject("Assunto do Envio")
                .bodyHtml("<h1>Olá</h1><p>Corpo do e-mail</p>")
                .build();

        Map<String, Object> result = emailAccountService.sendEmail(account.getId(), request);

        assertEquals(Boolean.TRUE, result.get("success"));

        MimeMessage[] received = greenMail.getReceivedMessages();
        assertEquals(1, received.length);
        assertEquals("Assunto do Envio", received[0].getSubject());
        assertEquals(RECIPIENT_EMAIL,
                ((InternetAddress) received[0].getAllRecipients()[0]).getAddress());
        assertTrue(received[0].getContent().toString().contains("Corpo do e-mail"));
    }

    @Test
    void sendEmail_ShouldSendCcAndBcc() throws Exception {
        EmailAccount account = createAccount();
        when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

        EmailSendRequest request = EmailSendRequest.builder()
                .to(RECIPIENT_EMAIL)
                .cc("cc@test.com")
                .bcc("bcc@test.com")
                .subject("Com cópia")
                .bodyHtml("corpo")
                .build();

        Map<String, Object> result = emailAccountService.sendEmail(account.getId(), request);

        assertEquals(Boolean.TRUE, result.get("success"));

        // O SMTP entrega uma cópia para cada destinatário (TO, CC e BCC)
        MimeMessage[] received = greenMail.getReceivedMessages();
        assertTrue(received.length >= 1, "Deveria haver mensagens entregues");
        MimeMessage mime = received[0];
        assertEquals("Com cópia", mime.getSubject());

        // TO e CC permanecem visíveis nos cabeçalhos da mensagem
        jakarta.mail.Address[] to = mime.getRecipients(jakarta.mail.Message.RecipientType.TO);
        assertNotNull(to);
        assertEquals(1, to.length);
        jakarta.mail.Address[] cc = mime.getRecipients(jakarta.mail.Message.RecipientType.CC);
        assertNotNull(cc);
        assertEquals(1, cc.length);
        assertEquals("cc@test.com", ((InternetAddress) cc[0]).getAddress());
    }

    @Test
    void sendEmail_WithAttachment_ShouldDeliverAttachment() throws Exception {
        EmailAccount account = createAccount();
        when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

        Path relPath = Path.of("email-attachments").resolve(account.getId().toString()).resolve("relatorio.pdf");
        Files.createDirectories(tempDir.resolve(relPath).getParent());
        Files.writeString(tempDir.resolve(relPath), "conteudo do anexo");

        UUID attachmentId = UUID.randomUUID();
        EmailMessageAttachment att = EmailMessageAttachment.builder()
                .id(attachmentId)
                .fileName("relatorio.pdf")
                .contentType("application/pdf")
                .storagePath(relPath.toString())
                .build();
        when(attachmentRepository.findById(attachmentId)).thenReturn(Optional.of(att));

        EmailSendRequest request = EmailSendRequest.builder()
                .to(RECIPIENT_EMAIL)
                .subject("Com anexo")
                .bodyHtml("corpo")
                .attachmentIds(java.util.List.of(attachmentId.toString()))
                .build();

        Map<String, Object> result = emailAccountService.sendEmail(account.getId(), request);

        assertEquals(Boolean.TRUE, result.get("success"));

        MimeMessage[] received = greenMail.getReceivedMessages();
        assertEquals(1, received.length);
        MimeMessage mime = received[0];
        assertEquals("Com anexo", mime.getSubject());

        // O anexo deve ter sido realmente enviado: multipart com corpo + arquivo
        Object content = mime.getContent();
        assertTrue(content instanceof jakarta.mail.internet.MimeMultipart,
                "A mensagem deveria ser multipart, mas era: " + content.getClass().getSimpleName());
        jakarta.mail.internet.MimeMultipart multipart = (jakarta.mail.internet.MimeMultipart) content;
        assertEquals(2, multipart.getCount(), "Deveria haver corpo + anexo");
        jakarta.mail.Part filePart = multipart.getBodyPart(1);
        assertEquals("relatorio.pdf", filePart.getFileName());
    }

    @Test
    void sendEmail_ShouldThrow_WhenSmtpAuthenticationFails() {
        EmailAccount account = createAccount();
        account.setPassword("senha-errada");
        when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

        EmailSendRequest request = EmailSendRequest.builder()
                .to(RECIPIENT_EMAIL)
                .subject("Vai falhar")
                .bodyHtml("corpo")
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> emailAccountService.sendEmail(account.getId(), request));
        assertNotNull(ex.getMessage());

        MimeMessage[] received = greenMail.getReceivedMessages();
        assertEquals(0, received.length);
    }

    // ════════════════════════════════════════════════════════════════
    // Teste de conexão / credenciais
    // ════════════════════════════════════════════════════════════════

    @Test
    void testConnection_ShouldSucceed_WhenIMAPAndSMTPAvailable() {
        EmailAccount account = createAccount();
        when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

        Map<String, Object> result = emailAccountService.testConnection(account.getId());

        assertEquals(Boolean.TRUE, result.get("success"));
        @SuppressWarnings("unchecked")
        Map<String, Object> imap = (Map<String, Object>) result.get("imap");
        @SuppressWarnings("unchecked")
        Map<String, Object> smtp = (Map<String, Object>) result.get("smtp");
        assertEquals(Boolean.TRUE, imap.get("ok"));
        assertEquals(Boolean.TRUE, smtp.get("ok"));
    }

    @Test
    void testConnection_ShouldFail_WhenPasswordInvalid() {
        EmailAccount account = createAccount();
        account.setPassword("senha-errada");
        when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

        Map<String, Object> result = emailAccountService.testConnection(account.getId());

        assertEquals(Boolean.FALSE, result.get("success"));
        @SuppressWarnings("unchecked")
        Map<String, Object> imap = (Map<String, Object>) result.get("imap");
        assertEquals(Boolean.FALSE, imap.get("ok"));
    }

    @Test
    void testCredentials_ShouldSucceed_WithoutPersisting() {
        EmailAccountRequest request = EmailAccountRequest.builder()
                .emailAddress(USER_EMAIL)
                .imapHost("127.0.0.1")
                .imapPort(imapPort)
                .imapSsl(false)
                .smtpHost("127.0.0.1")
                .smtpPort(smtpPort)
                .smtpSsl(false)
                .username(USER_EMAIL)
                .password(PASSWORD)
                .build();

        Map<String, Object> result = emailAccountService.testCredentials(request);

        assertEquals(Boolean.TRUE, result.get("success"));
        verify(accountRepository, never()).save(any());
    }

    @Test
    void testCredentials_ShouldFail_WithWrongPassword_AndNotPersist() {
        EmailAccountRequest request = EmailAccountRequest.builder()
                .emailAddress(USER_EMAIL)
                .imapHost("127.0.0.1")
                .imapPort(imapPort)
                .imapSsl(false)
                .smtpHost("127.0.0.1")
                .smtpPort(smtpPort)
                .smtpSsl(false)
                .username(USER_EMAIL)
                .password("senha-errada")
                .build();

        Map<String, Object> result = emailAccountService.testCredentials(request);

        assertEquals(Boolean.FALSE, result.get("success"));
        verify(accountRepository, never()).save(any());
    }

    // ════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════

    private EmailAccount createAccount() {
        return EmailAccount.builder()
                .id(UUID.randomUUID())
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
    }

    private static int findFreePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }
}
