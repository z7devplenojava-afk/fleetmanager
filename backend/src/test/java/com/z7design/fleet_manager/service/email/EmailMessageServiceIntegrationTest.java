package com.z7design.fleet_manager.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.EmailMessageDTO;
import com.z7design.fleet_manager.model.email.EmailAccount;
import com.z7design.fleet_manager.model.email.EmailFolder;
import com.z7design.fleet_manager.model.email.EmailMessage;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.repository.email.EmailFolderRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageAttachmentRepository;
import com.z7design.fleet_manager.repository.email.EmailMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Teste de integração do EmailMessageService com repositórios mockados.
 * Cobre a busca paginada (com total e clamp de tamanho), a marcação de
 * lida/não-lida e flag, a exclusão de mensagens, a leitura de mensagem
 * completa e o download de anexos a partir do disco.
 */
class EmailMessageServiceIntegrationTest {

    private static final String ADDRESS_JSON =
            "[{\"name\":\"Remetente\",\"address\":\"sender@test.com\"}," +
            "{\"name\":\"Outro\",\"address\":\"outro@test.com\"}]";

    private EmailMessageRepository messageRepository;
    private EmailMessageAttachmentRepository attachmentRepository;
    private EmailFolderRepository folderRepository;
    private EmailAccountService emailAccountService;
    private EmailMessageService emailMessageService;

    @TempDir
    Path tempDir;

    private UUID accountId;
    private UUID companyId;
    private UUID folderId;
    private EmailAccount account;
    private EmailFolder folder;

    @BeforeEach
    void setUp() {
        messageRepository = mock(EmailMessageRepository.class);
        attachmentRepository = mock(EmailMessageAttachmentRepository.class);
        folderRepository = mock(EmailFolderRepository.class);
        emailAccountService = mock(EmailAccountService.class);

        emailMessageService = new EmailMessageService(
                messageRepository, attachmentRepository, folderRepository,
                emailAccountService, new ObjectMapper());

        accountId = UUID.randomUUID();
        companyId = UUID.randomUUID();
        folderId = UUID.randomUUID();
        account = EmailAccount.builder().id(accountId).build();
        folder = EmailFolder.builder().id(folderId).account(account).build();
    }

    // ════════════════════════════════════════════════════════════════
    // Busca paginada
    // ════════════════════════════════════════════════════════════════

    @Test
    void search_ShouldReturnPaginatedResults_WithTotal() {
        EmailMessage m1 = createMessage(UUID.randomUUID(), "Relatório mensal", false, false);
        EmailMessage m2 = createMessage(UUID.randomUUID(), "Relatório semanal", true, false);
        when(messageRepository.countSearch(eq(accountId), eq("relatório"))).thenReturn(3L);
        when(messageRepository.search(eq(accountId), eq("relatório"), any(Pageable.class)))
                .thenReturn(List.of(m1, m2));

        Page<EmailMessageDTO> result = emailMessageService.search(accountId, "  relatório  ", 0, 2);

        assertEquals(3, result.getTotalElements());
        assertEquals(2, result.getContent().size());
        assertEquals("Relatório mensal", result.getContent().get(0).getSubject());
        assertEquals("Relatório semanal", result.getContent().get(1).getSubject());

        // Endereços desserializados do JSON
        assertEquals(2, result.getContent().get(0).getFrom().size());
        assertEquals("sender@test.com", result.getContent().get(0).getFrom().get(0).getAddress());

        // A query é passada com trim
        verify(messageRepository).countSearch(accountId, "relatório");
        verify(messageRepository).search(eq(accountId), eq("relatório"), any(Pageable.class));
    }

    @Test
    void search_ShouldClampPageSize_ToMax100() {
        when(messageRepository.countSearch(eq(accountId), eq("x"))).thenReturn(1L);
        when(messageRepository.search(eq(accountId), eq("x"), any(Pageable.class)))
                .thenReturn(List.of(createMessage(UUID.randomUUID(), "A", false, false)));

        emailMessageService.search(accountId, "x", 0, 500);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(messageRepository).search(eq(accountId), eq("x"), captor.capture());
        assertEquals(100, captor.getValue().getPageSize());
    }

    @Test
    void search_WithBlankQuery_ShouldListAllFromAccount() {
        EmailMessage m = createMessage(UUID.randomUUID(), "Sem filtro", false, false);
        Page<EmailMessage> dbPage = new PageImpl<>(List.of(m),
                PageRequest.of(0, 10), 1);
        when(messageRepository.findByAccountAndOptionalFolder(eq(accountId), isNull(),
                any(Pageable.class))).thenReturn(dbPage);

        Page<EmailMessageDTO> result = emailMessageService.search(accountId, "   ", 0, 10);

        assertEquals(1, result.getTotalElements());
        assertEquals("Sem filtro", result.getContent().get(0).getSubject());
        verify(messageRepository, never()).countSearch(any(), any());
    }

    @Test
    void listByFolder_ShouldReturnPagedMessages() {
        EmailMessage m1 = createMessage(UUID.randomUUID(), "Primeiro", false, false);
        EmailMessage m2 = createMessage(UUID.randomUUID(), "Segundo", true, false);
        Page<EmailMessage> dbPage = new PageImpl<>(List.of(m1, m2),
                PageRequest.of(0, 2), 5);
        when(messageRepository.findByFolder_IdOrderByDateDesc(eq(folderId), any(Pageable.class)))
                .thenReturn(dbPage);

        Page<EmailMessageDTO> result = emailMessageService.listByFolder(folderId, 0, 2);

        assertEquals(5, result.getTotalElements());
        assertEquals(2, result.getContent().size());
        assertEquals("Primeiro", result.getContent().get(0).getSubject());
        assertEquals(Boolean.FALSE, result.getContent().get(0).getRead());
    }

    // ════════════════════════════════════════════════════════════════
    // Marcação lida / flag
    // ════════════════════════════════════════════════════════════════

    @Test
    void markRead_ShouldUpdateStatus_AndReturnUpdatedDto() {
        UUID id = UUID.randomUUID();
        EmailMessage message = createMessage(id, "Assunto", false, false);
        when(messageRepository.findById(id)).thenAnswer(inv -> Optional.of(message));
        // Simula a persistência: o update no repositório reflete no objeto retornado
        doAnswer(inv -> {
            message.setRead(inv.getArgument(1));
            return null;
        }).when(messageRepository).updateReadStatus(eq(id), anyBoolean());

        EmailMessageDTO dto = emailMessageService.markRead(id, true);

        assertEquals(Boolean.TRUE, dto.getRead());
        verify(messageRepository).updateReadStatus(id, true);
    }

    @Test
    void markRead_ShouldReturnNotFound_WhenMessageMissing() {
        UUID id = UUID.randomUUID();
        when(messageRepository.findById(id)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> emailMessageService.markRead(id, true));
        assertNotNull(ex.getMessage());
    }

    @Test
    void getMessageAndMarkRead_ShouldMarkUnreadMessageAsRead() {
        UUID id = UUID.randomUUID();
        EmailMessage message = createMessage(id, "Assunto", false, false);
        when(messageRepository.findById(id)).thenReturn(Optional.of(message));

        EmailMessageDTO dto = emailMessageService.getMessageAndMarkRead(id);

        assertEquals(Boolean.TRUE, dto.getRead());
        verify(messageRepository).updateReadStatus(id, true);
    }

    @Test
    void getMessageAndMarkRead_ShouldNotUpdate_WhenAlreadyRead() {
        UUID id = UUID.randomUUID();
        EmailMessage message = createMessage(id, "Assunto", true, false);
        when(messageRepository.findById(id)).thenReturn(Optional.of(message));

        EmailMessageDTO dto = emailMessageService.getMessageAndMarkRead(id);

        assertEquals(Boolean.TRUE, dto.getRead());
        verify(messageRepository, never()).updateReadStatus(any(), anyBoolean());
    }

    @Test
    void toggleFlag_ShouldToggleFlagStatus() {
        UUID id = UUID.randomUUID();
        EmailMessage message = createMessage(id, "Assunto", false, false);
        when(messageRepository.findById(id)).thenReturn(Optional.of(message));

        EmailMessageDTO flagged = emailMessageService.toggleFlag(id);
        assertEquals(Boolean.TRUE, flagged.getFlagged());
        verify(messageRepository).updateFlaggedStatus(id, true);

        EmailMessageDTO unflagged = emailMessageService.toggleFlag(id);
        assertEquals(Boolean.FALSE, unflagged.getFlagged());
        verify(messageRepository).updateFlaggedStatus(id, false);
    }

    // ════════════════════════════════════════════════════════════════
    // Exclusão
    // ════════════════════════════════════════════════════════════════

    @Test
    void deleteMessage_ShouldCallDeleteById() {
        UUID id = UUID.randomUUID();

        emailMessageService.deleteMessage(id);

        verify(messageRepository).deleteById(id);
    }

    @Test
    void deleteMessage_ShouldPropagateException_WhenMessageDoesNotExist() {
        UUID id = UUID.randomUUID();
        // O Spring Data JPA lança EmptyResultDataAccessException ao tentar
        // excluir um ID inexistente; o serviço repassa a exceção ao chamador.
        doThrow(new EmptyResultDataAccessException(1))
                .when(messageRepository).deleteById(id);

        assertThrows(EmptyResultDataAccessException.class,
                () -> emailMessageService.deleteMessage(id));
        verify(messageRepository).deleteById(id);
    }

    // ════════════════════════════════════════════════════════════════
    // Leitura de mensagem completa
    // ════════════════════════════════════════════════════════════════

    @Test
    void getMessage_ShouldReturnFullDto_WithBodyAndAttachments() {
        UUID id = UUID.randomUUID();
        EmailMessage message = createMessage(id, "Assunto", false, true);
        message.setBodyHtml("<p>corpo</p>");
        message.setBodyText("corpo texto");

        UUID attId = UUID.randomUUID();
        EmailMessageAttachment att = EmailMessageAttachment.builder()
                .id(attId)
                .message(message)
                .account(account)
                .fileName("relatorio.pdf")
                .contentType("application/pdf")
                .sizeBytes(1024L)
                .build();

        when(messageRepository.findById(id)).thenReturn(Optional.of(message));
        when(attachmentRepository.findByMessage_IdOrderByCreatedAtAsc(id))
                .thenReturn(List.of(att));

        EmailMessageDTO dto = emailMessageService.getMessage(id);

        assertEquals("Assunto", dto.getSubject());
        assertEquals("<p>corpo</p>", dto.getBodyHtml());
        assertEquals(1, dto.getAttachments().size());
        assertEquals("relatorio.pdf", dto.getAttachments().get(0).getFileName());
        assertTrue(dto.getAttachments().get(0).getDownloadUrl()
                .contains("/api/email/attachments/" + attId + "/download"));
    }

    // ════════════════════════════════════════════════════════════════
    // Download de anexo
    // ════════════════════════════════════════════════════════════════

    @Test
    void getAttachment_ShouldReturnPersistedAttachment() {
        UUID attId = UUID.randomUUID();
        EmailMessageAttachment att = EmailMessageAttachment.builder()
                .id(attId)
                .fileName("foto.png")
                .contentType("image/png")
                .sizeBytes(2048L)
                .build();
        when(attachmentRepository.findById(attId)).thenReturn(Optional.of(att));

        EmailMessageAttachment result = emailMessageService.getAttachment(attId);

        assertEquals(attId, result.getId());
        assertEquals("foto.png", result.getFileName());
    }

    @Test
    void getAttachment_ShouldThrow_WhenNotFound() {
        UUID attId = UUID.randomUUID();
        when(attachmentRepository.findById(attId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> emailMessageService.getAttachment(attId));
    }

    @Test
    void readAttachmentBytes_ShouldReadFileFromDisk() throws Exception {
        Path file = tempDir.resolve("anexo.pdf");
        Files.write(file, "conteudo binario do anexo".getBytes(StandardCharsets.UTF_8));

        EmailMessageAttachment att = EmailMessageAttachment.builder()
                .id(UUID.randomUUID())
                .storagePath("anexo.pdf")
                .build();
        when(emailAccountService.resolveAttachmentPath(att)).thenReturn(file);

        byte[] bytes = emailMessageService.readAttachmentBytes(att);

        assertEquals("conteudo binario do anexo",
                new String(bytes, StandardCharsets.UTF_8));
    }

    @Test
    void readAttachmentBytes_ShouldThrow_WhenFileMissingOnDisk() {
        EmailMessageAttachment att = EmailMessageAttachment.builder()
                .id(UUID.randomUUID())
                .storagePath("nao-existe.pdf")
                .build();
        when(emailAccountService.resolveAttachmentPath(att))
                .thenReturn(tempDir.resolve("nao-existe.pdf"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> emailMessageService.readAttachmentBytes(att));
        assertTrue(ex.getMessage().contains("não encontrado"));
    }

    // ════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════

    private EmailMessage createMessage(UUID id, String subject, boolean read, boolean flagged) {
        return EmailMessage.builder()
                .id(id)
                .account(account)
                .folder(folder)
                .companyId(companyId)
                .uid(1L)
                .subject(subject)
                .fromAddress(ADDRESS_JSON)
                .toAddress(ADDRESS_JSON)
                .date(LocalDateTime.of(2026, 7, 31, 10, 0))
                .read(read)
                .flagged(flagged)
                .hasAttachments(false)
                .build();
    }
}
