package com.z7design.fleet_manager.service.whatsapp;

import com.z7design.fleet_manager.model.WhatsAppOutbox;
import com.z7design.fleet_manager.model.enums.WhatsAppOutboxKind;
import com.z7design.fleet_manager.model.enums.WhatsAppOutboxStatus;
import com.z7design.fleet_manager.repository.WhatsAppOutboxRepository;
import com.z7design.fleet_manager.service.FleetWorkOrderPdfService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WhatsAppOutboxProcessorTest {

    @Mock
    private WhatsAppOutboxRepository outboxRepository;

    @Mock
    private WhatsAppProviderRouter providerRouter;

    @Mock
    private FleetWorkOrderPdfService pdfService;

    @Mock
    private WhatsAppProvider provider;

    private WhatsAppOutboxProcessor processor;
    private UUID companyId;
    private UUID workOrderId;

    @BeforeEach
    void setUp() {
        processor = new WhatsAppOutboxProcessor(outboxRepository, providerRouter, pdfService);
        ReflectionTestUtils.setField(processor, "stuckMinutes", 10);
        ReflectionTestUtils.setField(processor, "retryBaseMinutes", 2);
        companyId = UUID.randomUUID();
        workOrderId = UUID.randomUUID();
    }

    @Test
    @DisplayName("envia texto e marca a mensagem como SENT")
    void sendsTextSuccessfully() {
        WhatsAppOutbox outbox = textOutbox();
        when(outboxRepository.claim(eq(outbox.getId()), eq(WhatsAppOutboxStatus.PROCESSING),
                eq(WhatsAppOutboxStatus.PENDING), any(LocalDateTime.class))).thenReturn(1);
        when(outboxRepository.findById(outbox.getId())).thenReturn(Optional.of(outbox));
        when(providerRouter.resolve(companyId)).thenReturn(
                new WhatsAppProviderRouter.ResolvedProvider(provider, null, "astracalls"));
        when(provider.sendText(null, outbox.getRecipientPhone(), outbox.getMessageText(),
                outbox.getId().toString())).thenReturn(WhatsAppSendResult.success("provider-1"));

        processor.process(outbox.getId());

        assertEquals(WhatsAppOutboxStatus.SENT, outbox.getStatus());
        assertNotNull(outbox.getSentAt());
        assertEquals("provider-1", outbox.getProviderMessageId());
        assertNull(outbox.getNextAttemptAt());
        verify(outboxRepository).save(outbox);
    }

    @Test
    @DisplayName("gera e envia PDF para mensagens do tipo DOCUMENT")
    void sendsDocumentWithGeneratedPdf() {
        WhatsAppOutbox outbox = documentOutbox();
        byte[] pdf = new byte[]{1, 2, 3};
        when(outboxRepository.claim(eq(outbox.getId()), eq(WhatsAppOutboxStatus.PROCESSING),
                eq(WhatsAppOutboxStatus.PENDING), any(LocalDateTime.class))).thenReturn(1);
        when(outboxRepository.findById(outbox.getId())).thenReturn(Optional.of(outbox));
        when(providerRouter.resolve(companyId)).thenReturn(
                new WhatsAppProviderRouter.ResolvedProvider(provider, "sessao-1", "astracalls"));
        when(pdfService.generateDriverPdf(workOrderId)).thenReturn(pdf);
        when(provider.sendDocument("sessao-1", outbox.getRecipientPhone(), pdf,
                outbox.getDocumentFilename(), "application/pdf", outbox.getMessageText(),
                outbox.getId().toString())).thenReturn(WhatsAppSendResult.success("provider-2"));

        processor.process(outbox.getId());

        assertEquals(WhatsAppOutboxStatus.SENT, outbox.getStatus());
        verify(pdfService).generateDriverPdf(workOrderId);
        verify(provider).sendDocument("sessao-1", outbox.getRecipientPhone(), pdf,
                outbox.getDocumentFilename(), "application/pdf", outbox.getMessageText(),
                outbox.getId().toString());
    }

    @Test
    @DisplayName("falha temporaria volta para PENDING com backoff")
    void retriesTemporaryFailure() {
        WhatsAppOutbox outbox = textOutbox();
        when(outboxRepository.claim(eq(outbox.getId()), eq(WhatsAppOutboxStatus.PROCESSING),
                eq(WhatsAppOutboxStatus.PENDING), any(LocalDateTime.class))).thenReturn(1);
        when(outboxRepository.findById(outbox.getId())).thenReturn(Optional.of(outbox));
        when(providerRouter.resolve(companyId)).thenReturn(
                new WhatsAppProviderRouter.ResolvedProvider(provider, null, "astracalls"));
        when(provider.sendText(any(), anyString(), anyString(), anyString()))
                .thenReturn(WhatsAppSendResult.failure("timeout", true));

        processor.process(outbox.getId());

        assertEquals(WhatsAppOutboxStatus.PENDING, outbox.getStatus());
        assertEquals(1, outbox.getAttempts());
        assertNotNull(outbox.getNextAttemptAt());
        verify(outboxRepository).save(outbox);
    }

    @Test
    @DisplayName("falha definitiva marca FAILED sem nova tentativa")
    void marksPermanentFailureAsFailed() {
        WhatsAppOutbox outbox = textOutbox();
        when(outboxRepository.claim(eq(outbox.getId()), eq(WhatsAppOutboxStatus.PROCESSING),
                eq(WhatsAppOutboxStatus.PENDING), any(LocalDateTime.class))).thenReturn(1);
        when(outboxRepository.findById(outbox.getId())).thenReturn(Optional.of(outbox));
        when(providerRouter.resolve(companyId)).thenReturn(
                new WhatsAppProviderRouter.ResolvedProvider(provider, null, "astracalls"));
        when(provider.sendText(any(), anyString(), anyString(), anyString()))
                .thenReturn(WhatsAppSendResult.failure("telefone invalido", false));

        processor.process(outbox.getId());

        assertEquals(WhatsAppOutboxStatus.FAILED, outbox.getStatus());
        assertNull(outbox.getNextAttemptAt());
        assertEquals(1, outbox.getAttempts());
    }

    @Test
    @DisplayName("nao processa mensagem ja reservada por outro worker")
    void doesNotProcessAlreadyClaimedMessage() {
        WhatsAppOutbox outbox = textOutbox();
        when(outboxRepository.claim(eq(outbox.getId()), eq(WhatsAppOutboxStatus.PROCESSING),
                eq(WhatsAppOutboxStatus.PENDING), any(LocalDateTime.class))).thenReturn(0);

        processor.process(outbox.getId());

        verify(outboxRepository, never()).findById(any());
        verifyNoInteractions(providerRouter, provider, pdfService);
    }

    private WhatsAppOutbox textOutbox() {
        return WhatsAppOutbox.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .workOrderId(workOrderId)
                .eventType("WORK_ORDER_COMPLETED")
                .kind(WhatsAppOutboxKind.TEXT)
                .recipientPhone("5511999999999")
                .recipientName("Motorista")
                .messageText("OS concluida")
                .status(WhatsAppOutboxStatus.PENDING)
                .attempts(0)
                .maxAttempts(5)
                .dedupeKey("dedupe-text")
                .build();
    }

    private WhatsAppOutbox documentOutbox() {
        return WhatsAppOutbox.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .workOrderId(workOrderId)
                .eventType("WORK_ORDER_COMPLETED")
                .kind(WhatsAppOutboxKind.DOCUMENT)
                .recipientPhone("5511999999999")
                .recipientName("Motorista")
                .messageText("Resumo da OS")
                .documentFilename("OS-1.pdf")
                .status(WhatsAppOutboxStatus.PENDING)
                .attempts(0)
                .maxAttempts(5)
                .dedupeKey("dedupe-document")
                .build();
    }
}
