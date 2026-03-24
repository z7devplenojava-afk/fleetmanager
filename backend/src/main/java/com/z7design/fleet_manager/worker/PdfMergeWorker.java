package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.DocumentPage;
import com.z7design.fleet_manager.model.PaymentReceipt;
import com.z7design.fleet_manager.model.PaymentReceiptStatus;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.model.UnifiedDocument;
import com.z7design.fleet_manager.repository.DocumentPageRepository;
import com.z7design.fleet_manager.repository.PaymentReceiptRepository;
import com.z7design.fleet_manager.repository.PayslipRepository;
import com.z7design.fleet_manager.repository.UnifiedDocumentRepository;
import com.z7design.fleet_manager.service.MinIOService;
import com.z7design.fleet_manager.service.UnifiedDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class PdfMergeWorker {

    private final StringRedisTemplate redisTemplate;
    private final DocumentPageRepository documentPageRepository;
    private final PayslipRepository payslipRepository;
    private final PaymentReceiptRepository paymentReceiptRepository;
    private final UnifiedDocumentRepository unifiedDocumentRepository;
    private final UnifiedDocumentService unifiedDocumentService;
    private final MinIOService minIOService;

    private static final String STREAM_MATCHED = "stream:matched";
    private static final String STREAM_MERGED = "stream:merged";
    private static final String CONSUMER_GROUP = "pdfmerge-group";
    private static final String CONSUMER_NAME = "pdfmerge-worker-1";
    private static final String TEMP_DIR = "uploads/temp/unified";

    @PostConstruct
    public void init() {
        // InicializaÃ§Ã£o assÃ­ncrona para nÃ£o bloquear o startup do Spring se o Redis
        // estiver fora
        new Thread(() -> {
            try {
                redisTemplate.opsForStream().createGroup(STREAM_MATCHED, ReadOffset.from("0"), CONSUMER_GROUP);
                log.info("âœ… PdfMergeWorker: Consumer group '{}' criado/verificado", CONSUMER_GROUP);
            } catch (Exception e) {
                log.debug("PdfMergeWorker: Consumer group jÃ¡ existe ou erro ao criar: {}", e.getMessage());
            }
            log.info("âœ… PdfMergeWorker inicializado");
        }).start();

        // Criar diretÃ³rio temporÃ¡rio
        try {
            Path tempPath = Paths.get(TEMP_DIR);
            if (!Files.exists(tempPath)) {
                Files.createDirectories(tempPath);
            }
        } catch (Exception e) {
            log.warn("Erro ao criar diretÃ³rio temporÃ¡rio", e);
        }

        log.info("ðŸŸ¡ PdfMergeWorker: InicializaÃ§Ã£o agendada em background.");
    }

    @Scheduled(fixedDelay = 2000) // Processa a cada 2 segundos
    @Transactional
    public void processMatches() {
        try {
            @SuppressWarnings("unchecked")
            List<MapRecord<String, String, String>> records = (List<MapRecord<String, String, String>>) (List<?>) redisTemplate
                    .opsForStream().read(
                            org.springframework.data.redis.connection.stream.Consumer.from(CONSUMER_GROUP,
                                    CONSUMER_NAME),
                            StreamOffset.create(STREAM_MATCHED, ReadOffset.lastConsumed()));

            if (records == null || records.isEmpty()) {
                return;
            }

            log.debug("Processando {} matches no PdfMergeWorker", records.size());

            for (MapRecord<String, String, String> record : records) {
                try {
                    processMatch(record);
                    redisTemplate.opsForStream().acknowledge(STREAM_MATCHED, CONSUMER_GROUP, record.getId());
                } catch (Exception e) {
                    log.error("Erro ao processar match", e);
                }
            }
        } catch (Exception e) {
            log.error("Erro no PdfMergeWorker", e);
        }
    }

    private void processMatch(MapRecord<String, String, String> record) throws Exception {
        String holeritePageIdStr = record.getValue().get("holeritePageId");
        String comprovantePageIdStr = record.getValue().get("comprovantePageId");
        String method = record.getValue().get("method");

        if (holeritePageIdStr == null || comprovantePageIdStr == null) {
            log.warn("Dados incompletos no match: {}", record.getValue());
            return;
        }

        UUID holeritePageId = UUID.fromString(holeritePageIdStr);
        UUID comprovantePageId = UUID.fromString(comprovantePageIdStr);

        log.info("Processando merge - Holerite: {}, Comprovante: {}, MÃ©todo: {}",
                holeritePageId, comprovantePageId, method);

        // Buscar DocumentPages
        DocumentPage holeritePage = documentPageRepository.findById(holeritePageId)
                .orElseThrow(() -> new RuntimeException("Holerite page nÃ£o encontrada: " + holeritePageId));

        DocumentPage comprovantePage = documentPageRepository.findById(comprovantePageId)
                .orElseThrow(() -> new RuntimeException("Comprovante page nÃ£o encontrada: " + comprovantePageId));

        // Criar Payslip a partir do DocumentPage
        Payslip payslip = createPayslipFromDocumentPage(holeritePage);
        payslip = payslipRepository.save(payslip);

        // Criar PaymentReceipt a partir do DocumentPage
        PaymentReceipt receipt = createPaymentReceiptFromDocumentPage(comprovantePage);
        receipt = paymentReceiptRepository.save(receipt);

        // Gerar PDF unificado usando o serviÃ§o existente
        String unifiedPdfPath = unifiedDocumentService.createUnifiedDocument(payslip, receipt);

        // Upload para MinIO/S3
        byte[] pdfBytes = Files.readAllBytes(Paths.get(unifiedPdfPath));
        String fileName = generateUnifiedFileName(holeritePage.getName(),
                extractMonth(holeritePage.getPeriod()),
                extractYear(holeritePage.getPeriod()));
        String s3Url = minIOService.uploadUnifiedPdf(pdfBytes, fileName);

        // Criar UnifiedDocument
        UnifiedDocument unifiedDocument = UnifiedDocument.builder()
                .payslip(payslip)
                .receipt(receipt)
                .month(extractMonth(holeritePage.getPeriod()))
                .year(extractYear(holeritePage.getPeriod()))
                .employeeName(holeritePage.getName())
                .filePath(s3Url)
                .fileName(fileName)
                .fileSize((long) pdfBytes.length)
                .status(UnifiedDocument.UnifiedDocumentStatus.PROCESSED)
                .matchingConfidence(new BigDecimal("1.0"))
                .notes("Match automÃ¡tico - MÃ©todo: " + method)
                .build();

        unifiedDocument = unifiedDocumentRepository.save(unifiedDocument);

        // Publicar em stream:merged
        Map<String, String> mergedFields = new HashMap<>();
        mergedFields.put("unifiedDocumentId", unifiedDocument.getId().toString());
        mergedFields.put("payslipId", payslip.getId().toString());
        mergedFields.put("receiptId", receipt.getId().toString());
        mergedFields.put("s3Url", s3Url);

        redisTemplate.opsForStream().add(STREAM_MERGED, mergedFields);

        // Limpar arquivo temporÃ¡rio
        try {
            Files.deleteIfExists(Paths.get(unifiedPdfPath));
        } catch (Exception e) {
            log.warn("Erro ao deletar arquivo temporÃ¡rio", e);
        }

        log.info("PDF unificado criado: {} - UnifiedDocument: {}", s3Url, unifiedDocument.getId());
    }

    private Payslip createPayslipFromDocumentPage(DocumentPage page) {
        return Payslip.builder()
                .employeeName(page.getName())
                .cpf(page.getCpf())
                .month(extractMonth(page.getPeriod()))
                .year(extractYear(page.getPeriod()))
                .fileName("holerite_" + page.getId() + ".pdf")
                .processedAt(LocalDateTime.now())
                .netValue(page.getLiquidValue())
                .totalEarnings(page.getLiquidValue() != null ? page.getLiquidValue() : BigDecimal.ZERO)
                .totalDeductions(BigDecimal.ZERO)
                .versao(1)
                .hashConteudo(page.getHash())
                .arquivoCaminho(page.getS3Url())
                .build();
    }

    private PaymentReceipt createPaymentReceiptFromDocumentPage(DocumentPage page) {
        return PaymentReceipt.builder()
                .employeeName(page.getName())
                .month(extractMonth(page.getPeriod()))
                .year(extractYear(page.getPeriod()))
                .netSalary(page.getLiquidValue())
                .grossSalary(page.getLiquidValue())
                .fileName("comprovante_" + page.getId() + ".pdf")
                .filePath(page.getS3Url())
                .fileSize(0L)
                .status(PaymentReceiptStatus.PROCESSED)
                .processedAt(LocalDateTime.now())
                .build();
    }

    private String generateUnifiedFileName(String employeeName, Integer month, Integer year) {
        String normalizedName = employeeName != null
                ? employeeName.replaceAll("[^a-zA-Z0-9]", "_").toUpperCase()
                : "FUNCIONARIO";
        return String.format("%s_%02d_%04d_unificado.pdf", normalizedName, month, year);
    }

    private Integer extractMonth(String period) {
        if (period == null || period.length() < 2) {
            return null;
        }
        try {
            String[] parts = period.split("/");
            if (parts.length >= 1) {
                return Integer.parseInt(parts[0]);
            }
        } catch (Exception e) {
            log.warn("Erro ao extrair mÃªs do perÃ­odo: {}", period);
        }
        return null;
    }

    private Integer extractYear(String period) {
        if (period == null || period.length() < 4) {
            return null;
        }
        try {
            String[] parts = period.split("/");
            if (parts.length >= 2) {
                return Integer.parseInt(parts[1]);
            }
        } catch (Exception e) {
            log.warn("Erro ao extrair ano do perÃ­odo: {}", period);
        }
        return null;
    }
}
