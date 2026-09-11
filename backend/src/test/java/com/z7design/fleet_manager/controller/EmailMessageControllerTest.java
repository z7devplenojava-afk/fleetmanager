package com.z7design.fleet_manager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.EmailMessageDTO;
import com.z7design.fleet_manager.model.email.EmailMessageAttachment;
import com.z7design.fleet_manager.service.email.EmailMessageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Teste de integração do EmailMessageController com MockMvc standalone.
 * Cobre a busca paginada, a marcação de lida/não-lida e flag, a exclusão
 * de mensagens e o download de anexos, com o serviço mockado.
 *
 * Nota: usa MockMvcBuilders.standaloneSetup em vez de @WebMvcTest porque
 * o slice @WebMvcTest deste projeto carrega cadeias JPA (userActivityAspect
 * -> LogService -> repositórios, CIDataLoader -> repositórios) que exigem
 * entityManagerFactory, ausente no slice web — o que quebra o context load
 * de qualquer @WebMvcTest.
 */
class EmailMessageControllerTest {

    private MockMvc mockMvc;
    private EmailMessageService emailMessageService;

    @BeforeEach
    void setUp() {
        emailMessageService = mock(EmailMessageService.class);
        // O standaloneSetup padrão coloca o JAXB antes do Jackson, serializando
        // o Map de resposta como XML. Configuramos JSON + byte[].
        mockMvc = MockMvcBuilders.standaloneSetup(new EmailMessageController(emailMessageService))
                .setMessageConverters(
                        new ByteArrayHttpMessageConverter(),
                        new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    // ════════════════════════════════════════════════════════════════
    // Busca paginada
    // ════════════════════════════════════════════════════════════════

    @Test
    void search_ShouldReturnPaginatedResults() throws Exception {
        UUID accountId = UUID.randomUUID();
        EmailMessageDTO dto = EmailMessageDTO.builder()
                .id(UUID.randomUUID())
                .accountId(accountId)
                .subject("Relatório mensal")
                .read(false)
                .build();
        PageImpl<EmailMessageDTO> page = new PageImpl<>(
                List.of(dto), PageRequest.of(0, 2), 3);

        when(emailMessageService.search(eq(accountId), eq("relatório"), eq(0), eq(2)))
                .thenReturn(page);

        mockMvc.perform(get("/api/email/accounts/{accountId}/search", accountId)
                        .param("q", "relatório")
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.content[0].subject").value("Relatório mensal"));

        verify(emailMessageService).search(accountId, "relatório", 0, 2);
    }

    @Test
    void search_ShouldReturnBadRequest_WhenServiceThrows() throws Exception {
        UUID accountId = UUID.randomUUID();
        when(emailMessageService.search(any(), any(), anyInt(), anyInt()))
                .thenThrow(new IllegalArgumentException("Query inválida"));

        mockMvc.perform(get("/api/email/accounts/{accountId}/search", accountId)
                        .param("q", "x"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void listByFolder_ShouldReturnPagedMessages() throws Exception {
        UUID folderId = UUID.randomUUID();
        EmailMessageDTO dto = EmailMessageDTO.builder()
                .id(UUID.randomUUID())
                .folderId(folderId)
                .subject("Primeiro")
                .build();
        // Nota: o construtor PageImpl(List, Pageable, long) do Spring Data 3.x recalcula
        // o total como offset + content.size() quando offset + pageSize > total.
        // Usamos PageRequest.of(0, 5) com total=5 (0+5>5 é falso), preservando o total.
        // Evitamos Pageable.unpaged() porque a classe Unpaged (package-private) não
        // serializa corretamente com o Jackson do MockMvc standalone.
        PageImpl<EmailMessageDTO> page = new PageImpl<>(
                List.of(dto), PageRequest.of(0, 5), 5);

        when(emailMessageService.listByFolder(eq(folderId), eq(0), eq(25)))
                .thenReturn(page);

        mockMvc.perform(get("/api/email/folders/{folderId}/messages", folderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(5))
                .andExpect(jsonPath("$.data.content[0].subject").value("Primeiro"));
    }

    // ════════════════════════════════════════════════════════════════
    // Marcação lida / flag
    // ════════════════════════════════════════════════════════════════

    @Test
    void getMessage_ShouldReturnMessageAndMarkRead() throws Exception {
        UUID id = UUID.randomUUID();
        EmailMessageDTO dto = EmailMessageDTO.builder()
                .id(id)
                .subject("Assunto")
                .read(true)
                .build();

        when(emailMessageService.getMessageAndMarkRead(id)).thenReturn(dto);

        mockMvc.perform(get("/api/email/messages/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.subject").value("Assunto"))
                .andExpect(jsonPath("$.data.read").value(true));

        verify(emailMessageService).getMessageAndMarkRead(id);
    }

    @Test
    void markRead_ShouldMarkMessageAsRead() throws Exception {
        UUID id = UUID.randomUUID();
        EmailMessageDTO dto = EmailMessageDTO.builder()
                .id(id)
                .read(true)
                .build();

        when(emailMessageService.markRead(eq(id), eq(true))).thenReturn(dto);

        mockMvc.perform(post("/api/email/messages/{id}/read", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"read\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.read").value(true));

        verify(emailMessageService).markRead(id, true);
    }

    @Test
    void markRead_WithoutBody_ShouldDefaultToRead() throws Exception {
        UUID id = UUID.randomUUID();
        EmailMessageDTO dto = EmailMessageDTO.builder().id(id).read(true).build();

        when(emailMessageService.markRead(eq(id), eq(true))).thenReturn(dto);

        mockMvc.perform(post("/api/email/messages/{id}/read", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.read").value(true));

        verify(emailMessageService).markRead(id, true);
    }

    @Test
    void toggleFlag_ShouldToggleFlaggedStatus() throws Exception {
        UUID id = UUID.randomUUID();
        EmailMessageDTO dto = EmailMessageDTO.builder()
                .id(id)
                .flagged(true)
                .build();

        when(emailMessageService.toggleFlag(id)).thenReturn(dto);

        mockMvc.perform(post("/api/email/messages/{id}/flag", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.flagged").value(true));

        verify(emailMessageService).toggleFlag(id);
    }

    // ════════════════════════════════════════════════════════════════
    // Exclusão
    // ════════════════════════════════════════════════════════════════

    @Test
    void deleteMessage_ShouldReturnSuccess() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(emailMessageService).deleteMessage(id);

        mockMvc.perform(delete("/api/email/messages/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Mensagem excluída"));

        verify(emailMessageService).deleteMessage(id);
    }

    // ════════════════════════════════════════════════════════════════
    // Download de anexo
    // ════════════════════════════════════════════════════════════════

    @Test
    void downloadAttachment_ShouldReturnFileBytes() throws Exception {
        UUID attachmentId = UUID.randomUUID();
        byte[] content = "conteudo do anexo".getBytes(StandardCharsets.UTF_8);
        EmailMessageAttachment att = EmailMessageAttachment.builder()
                .id(attachmentId)
                .fileName("relatorio.pdf")
                .contentType("application/pdf")
                .build();

        when(emailMessageService.getAttachment(attachmentId)).thenReturn(att);
        when(emailMessageService.readAttachmentBytes(att)).thenReturn(content);

        mockMvc.perform(get("/api/email/attachments/{attachmentId}/download", attachmentId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(content))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''relatorio.pdf"));

        verify(emailMessageService).getAttachment(attachmentId);
        verify(emailMessageService).readAttachmentBytes(att);
    }

    @Test
    void downloadAttachment_ShouldReturnBadRequest_WhenAttachmentMissing() throws Exception {
        UUID attachmentId = UUID.randomUUID();
        when(emailMessageService.getAttachment(attachmentId))
                .thenThrow(new IllegalArgumentException("Anexo não encontrado"));

        mockMvc.perform(get("/api/email/attachments/{attachmentId}/download", attachmentId))
                .andExpect(status().isBadRequest())
                .andExpect(content().bytes(new byte[0]));
    }
}
