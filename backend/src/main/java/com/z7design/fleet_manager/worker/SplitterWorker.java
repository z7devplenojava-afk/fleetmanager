package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.DocumentProcessingJob;
import com.z7design.fleet_manager.repository.DocumentProcessingJobRepository;
import com.z7design.fleet_manager.service.MinIOService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SplitterWorker {

    private final StringRedisTemplate redisTemplate;
    private final DocumentProcessingJobRepository jobRepository;
    private final MinIOService minIOService;

    private static final String STREAM_JOBS = "stream:jobs";
    private static final String STREAM_PAGES = "stream:pages";
    private static final String CONSUMER_GROUP = "splitter-group";
    private static final String CONSUMER_NAME = "splitter-worker-1";
    private static final int DPI = 400; // Aumentado para melhor qualidade de OCR

    @PostConstruct
    public void init() {
        // Log imediato para confirmar que o mÃ©todo foi chamado
        System.out.println(
                "â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•â• â• â• â• â• â• â• â• â• â• â• â• â• ");
        System.out.println("ðŸŸ¢ SPLITTER WORKER: @PostConstruct CHAMADO!");
        System.out.println(
                "â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•â• â• â• â• â• â• â• â• â• â• â• â• â• ");

        log.info(
                "â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•â• â• â• â•â• â• â• â• â• â• â• â• â• â• â• â• â• â• ");
        log.info("ðŸŸ¢ SPLITTER WORKER: Iniciando inicializaÃ§Ã£o...");
        log.info(
                "â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•â• â•â• â• â• â• â•â• â• â•â• â• â• â• â• â• ");

        // InicializaÃ§Ã£o assÃ­ncrona para nÃ£o bloquear o startup do Spring se o Redis
        // estiver fora
        new Thread(() -> {
            try {
                // Verificar se as dependÃªncias estÃ£o injetadas
                if (redisTemplate == null) {
                    log.error("â Œ SPLITTER WORKER: StringRedisTemplate NÃƒO FOI INJETADO!");
                    return;
                }

                // Criar consumer group se nÃ£o existir
                log.info("ðŸŸ¢ SPLITTER WORKER: Criando/verificando consumer group '{}'...", CONSUMER_GROUP);
                try {
                    redisTemplate.opsForStream().createGroup(STREAM_JOBS, ReadOffset.from("0"), CONSUMER_GROUP);
                    log.info("âœ… SPLITTER WORKER: Consumer group '{}' criado/verificado", CONSUMER_GROUP);
                } catch (Exception e) {
                    log.info("â„¹ï¸  SPLITTER WORKER: Consumer group '{}' jÃ¡ existe ou erro: {}", CONSUMER_GROUP,
                            e.getMessage());
                }
            } catch (Exception e) {
                log.error("â Œ SPLITTER WORKER: Erro durante inicializaÃ§Ã£o assÃ­ncrona: {}", e.getMessage(), e);
            }
            log.info("âœ… SPLITTER WORKER: InicializaÃ§Ã£o concluÃ­da - Worker pronto!");
        }).start();

        log.info("ðŸŸ¢ SPLITTER WORKER: InicializaÃ§Ã£o agendada em background.");
        log.info(
                "â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•â•â• â• â• â• â• â• â• â• â• â• â• â• â• â• ");
    }



    @Scheduled(fixedDelay = 2000) // Processa a cada 2 segundos
    public void processJobs() {
        try {
            // Tentar ler mensagens do stream

            // Log periÃ³dico para debug (a cada 5 segundos)
            long currentTime = System.currentTimeMillis();
            boolean shouldLog = (currentTime % 5000 < 500);

            if (shouldLog) {
                try {
                    Long streamLength = redisTemplate.opsForStream().size(STREAM_JOBS);
                    log.debug("ðŸ”µ SplitterWorker: Verificando stream:jobs (tamanho: {})", streamLength);
                } catch (Exception e) {
                    log.debug("ðŸ”µ SplitterWorker: Erro ao verificar tamanho do stream: {}", e.getMessage());
                }
            }

            // Tentar ler mensagens do stream
            @SuppressWarnings("unchecked")
            List<MapRecord<String, String, String>> records = (List<MapRecord<String, String, String>>) (List<?>) redisTemplate
                    .opsForStream().read(
                            org.springframework.data.redis.connection.stream.Consumer.from(CONSUMER_GROUP,
                                    CONSUMER_NAME),
                            StreamOffset.create(STREAM_JOBS, ReadOffset.lastConsumed()));

            if (records == null || records.isEmpty()) {
                // Se nÃ£o houver mensagens novas, tentar ler do inÃ­cio (pode haver mensagens
                // nÃ£o processadas)
                if (shouldLog) {
                    log.debug("ðŸ”µ SplitterWorker: Nenhuma mensagem nova encontrada, tentando ler do inÃ­cio...");
                }
                try {
                    @SuppressWarnings("unchecked")
                    List<MapRecord<String, String, String>> allRecords = (List<MapRecord<String, String, String>>) (List<?>) redisTemplate
                            .opsForStream().read(
                                    org.springframework.data.redis.connection.stream.Consumer.from(CONSUMER_GROUP,
                                            CONSUMER_NAME),
                                    StreamOffset.create(STREAM_JOBS, ReadOffset.from("0")));
                    if (allRecords != null && !allRecords.isEmpty()) {
                        records = allRecords;
                        log.info("ðŸ”µ SplitterWorker: Encontradas {} mensagens nÃ£o processadas", records.size());
                    }
                } catch (Exception e) {
                    // Ignorar erro - pode ser que nÃ£o haja mensagens mesmo
                    if (shouldLog) {
                        log.debug("ðŸ”µ SplitterWorker: Nenhuma mensagem encontrada no stream");
                    }
                }
            }

            if (records == null || records.isEmpty()) {
                return;
            }

            log.info("ðŸ”µ SplitterWorker: Processando {} jobs", records.size());
            System.out.println("ðŸ”µ SplitterWorker: Processando " + records.size() + " jobs");

            for (MapRecord<String, String, String> record : records) {
                try {
                    processJob(record);
                    // ACK da mensagem apÃ³s processar com sucesso
                    redisTemplate.opsForStream().acknowledge(STREAM_JOBS, CONSUMER_GROUP, record.getId());
                } catch (IllegalArgumentException e) {
                    // Erro de validaÃ§Ã£o - fazer ACK para nÃ£o reprocessar
                    log.warn("âš ï¸ SplitterWorker: Erro de validaÃ§Ã£o na mensagem {}: {}. Fazendo ACK para ignorar.",
                            record.getId(), e.getMessage());
                    redisTemplate.opsForStream().acknowledge(STREAM_JOBS, CONSUMER_GROUP, record.getId());
                } catch (Exception e) {
                    log.error("Erro ao processar job {}", record.getId(), e);
                    // Tentar marcar job como falho (pode nÃ£o existir)
                    String jobIdStr = record.getValue().get("jobId");
                    if (jobIdStr != null) {
                        try {
                            markJobAsFailed(jobIdStr, e.getMessage());
                        } catch (Exception ex) {
                            log.warn("NÃ£o foi possÃ­vel marcar job {} como falho: {}", jobIdStr, ex.getMessage());
                        }
                    }
                    // Fazer ACK mesmo em caso de erro para nÃ£o ficar reprocessando infinitamente
                    try {
                        redisTemplate.opsForStream().acknowledge(STREAM_JOBS, CONSUMER_GROUP, record.getId());
                    } catch (Exception ackEx) {
                        log.error("Erro ao fazer ACK da mensagem {}", record.getId(), ackEx);
                    }
                }
            }
        } catch (org.springframework.data.redis.RedisConnectionFailureException e) {
            log.error("âŒ SplitterWorker: Erro de conexÃ£o com Redis - {}", e.getMessage());
        } catch (Exception e) {
            log.error("âŒ SplitterWorker: Erro inesperado", e);
        }
    }

    private void processJob(MapRecord<String, String, String> record) throws Exception {
        String jobIdStr = record.getValue().get("jobId");
        String filePath = record.getValue().get("filePath");
        String fileHash = record.getValue().get("fileHash"); // Hash do arquivo completo

        if (jobIdStr == null || filePath == null) {
            throw new IllegalArgumentException("jobId ou filePath nÃ£o encontrado na mensagem");
        }

        UUID jobId = UUID.fromString(jobIdStr);
        log.info("ðŸŸ¢ SplitterWorker: Iniciando processamento do job {} - arquivo: {}", jobId, filePath);

        // Atualizar status do job
        DocumentProcessingJob job = jobRepository.findById(jobId).orElse(null);

        // Se o job nÃ£o existe mais no banco, provavelmente foi deletado ou Ã© uma
        // mensagem antiga
        // Nesse caso, apenas logamos e retornamos (nÃ£o lanÃ§amos exceÃ§Ã£o para nÃ£o
        // bloquear outras mensagens)
        if (job == null) {
            log.warn(
                    "âš ï¸ SplitterWorker: Job {} nÃ£o encontrado no banco de dados. Pode ser uma mensagem antiga. Ignorando...",
                    jobId);
            // Verificar se o arquivo existe - se nÃ£o existir, Ã© definitivamente uma
            // mensagem antiga
            File pdfFile = new File(filePath);
            if (!pdfFile.exists()) {
                log.warn(
                        "âš ï¸ SplitterWorker: Arquivo {} tambÃ©m nÃ£o existe. Esta Ã© uma mensagem antiga que pode ser ignorada.",
                        filePath);
            }
            return; // Retorna sem lanÃ§ar exceÃ§Ã£o para nÃ£o bloquear outras mensagens
        }

        log.info("ðŸŸ¢ SplitterWorker: Job encontrado - Status atual: {}, Total pÃ¡ginas: {}",
                job.getStatus(), job.getTotalPages());

        job.setStatus(DocumentProcessingJob.JobStatus.PROCESSING);
        job.setStartedAt(java.time.LocalDateTime.now());
        jobRepository.saveAndFlush(job);
        log.info("ðŸŸ¢ SplitterWorker: Status do job {} atualizado para PROCESSING", jobId);

        // Processar PDF
        File pdfFile = new File(filePath);
        if (!pdfFile.exists()) {
            throw new RuntimeException("Arquivo nÃ£o encontrado: " + filePath);
        }

        try (PDDocument document = PDDocument.load(pdfFile)) {
            PDFRenderer renderer = new PDFRenderer(document);
            int totalPages = document.getNumberOfPages();

            job.setTotalPages(totalPages);
            jobRepository.saveAndFlush(job);

            log.info("ðŸŸ¢ SplitterWorker: PDF tem {} pÃ¡ginas - iniciando processamento", totalPages);

            // Processar cada pÃ¡gina
            for (int pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                try {
                    // Renderizar pÃ¡gina como imagem
                    BufferedImage image = renderer.renderImageWithDPI(pageIndex, DPI);

                    // Converter para PNG
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    ImageIO.write(image, "PNG", baos);
                    byte[] imageBytes = baos.toByteArray();

                    // Upload para MinIO/S3
                    String s3Url = minIOService.uploadPage(imageBytes, jobId.toString(), pageIndex);

                    // Publicar em stream:pages com o tipo de documento do job
                    String pageId = UUID.randomUUID().toString();
                    Map<String, String> pageFields = new HashMap<>();
                    pageFields.put("jobId", jobId.toString());
                    pageFields.put("pageId", pageId);
                    pageFields.put("pageIndex", String.valueOf(pageIndex));
                    pageFields.put("s3Url", s3Url);
                    pageFields.put("totalPages", String.valueOf(totalPages));
                    // Adicionar documentType do job para que os workers saibam o tipo
                    if (job.getDocumentType() != null) {
                        pageFields.put("documentType", job.getDocumentType());
                    }
                    // Adicionar hash do arquivo completo para verificaÃ§Ã£o de duplicatas e versÃ£o
                    if (fileHash != null && !fileHash.isEmpty()) {
                        pageFields.put("fileHash", fileHash);
                    }

                    redisTemplate.opsForStream().add(STREAM_PAGES, pageFields);

                    // Atualizar progresso
                    job.setProcessedPages(pageIndex + 1);
                    job.updateProgress();
                    jobRepository.save(job);

                    log.info("ðŸŸ¢ SplitterWorker: PÃ¡gina {}/{} processada e publicada no stream:pages", pageIndex + 1,
                            totalPages);
                } catch (Exception e) {
                    log.error("Erro ao processar pÃ¡gina {} do job {}", pageIndex, jobId, e);
                }
            }

            // Marcar job como concluÃ­do
            job.setStatus(DocumentProcessingJob.JobStatus.COMPLETED);
            job.setCompletedAt(java.time.LocalDateTime.now());
            jobRepository.save(job);

            log.info("âœ… SplitterWorker: Job {} CONCLUÃDO - {} pÃ¡ginas processadas e publicadas", jobId, totalPages);
        }
    }

    private void markJobAsFailed(String jobIdStr, String errorMessage) {
        try {
            if (jobIdStr != null) {
                UUID jobId = UUID.fromString(jobIdStr);
                DocumentProcessingJob job = jobRepository.findById(jobId).orElse(null);
                if (job != null) {
                    job.setStatus(DocumentProcessingJob.JobStatus.FAILED);
                    job.setErrorMessage(errorMessage);
                    job.setCompletedAt(java.time.LocalDateTime.now());
                    jobRepository.save(job);
                }
            }
        } catch (Exception e) {
            log.error("Erro ao marcar job como falho", e);
        }
    }

    @PreDestroy
    public void cleanup() {
        log.info("SplitterWorker sendo finalizado");
    }
}
