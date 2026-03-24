package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.UnifiedDocument;
import com.z7design.fleet_manager.repository.UnifiedDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class IndexerWorker {

    private final StringRedisTemplate redisTemplate;
    private final UnifiedDocumentRepository unifiedDocumentRepository;

    private static final String STREAM_MERGED = "stream:merged";
    private static final String CONSUMER_GROUP = "indexer-group";
    private static final String CONSUMER_NAME = "indexer-worker-1";
    private static final String CACHE_PREFIX = "unified:doc:";
    private static final String CACHE_URL_PREFIX = "unified:url:";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    @PostConstruct
    public void init() {
        // InicializaÃ§Ã£o assÃ­ncrona para nÃ£o bloquear o startup do Spring se o Redis
        // estiver fora
        new Thread(() -> {
            try {
                redisTemplate.opsForStream().createGroup(STREAM_MERGED, ReadOffset.from("0"), CONSUMER_GROUP);
                log.info("âœ… IndexerWorker: Consumer group '{}' criado/verificado", CONSUMER_GROUP);
            } catch (Exception e) {
                log.debug("IndexerWorker: Consumer group jÃ¡ existe ou erro ao criar: {}", e.getMessage());
            }
            log.info("âœ… IndexerWorker inicializado");
        }).start();

        log.info("ðŸŸ¡ IndexerWorker: InicializaÃ§Ã£o agendada em background.");
    }

    @Scheduled(fixedDelay = 1000) // Processa a cada 1 segundo
    public void processMergedDocuments() {
        try {
            @SuppressWarnings("unchecked")
            List<MapRecord<String, String, String>> records = (List<MapRecord<String, String, String>>) (List<?>) redisTemplate
                    .opsForStream().read(
                            org.springframework.data.redis.connection.stream.Consumer.from(CONSUMER_GROUP,
                                    CONSUMER_NAME),
                            StreamOffset.create(STREAM_MERGED, ReadOffset.lastConsumed()));

            if (records == null || records.isEmpty()) {
                return;
            }

            log.debug("Processando {} documentos no IndexerWorker", records.size());

            for (MapRecord<String, String, String> record : records) {
                try {
                    processDocument(record);
                    redisTemplate.opsForStream().acknowledge(STREAM_MERGED, CONSUMER_GROUP, record.getId());
                } catch (Exception e) {
                    log.error("Erro ao processar documento no IndexerWorker", e);
                }
            }
        } catch (Exception e) {
            log.error("Erro no IndexerWorker", e);
        }
    }

    private void processDocument(MapRecord<String, String, String> record) {
        String unifiedDocumentIdStr = record.getValue().get("unifiedDocumentId");
        String s3Url = record.getValue().get("s3Url");

        if (unifiedDocumentIdStr == null) {
            log.warn("unifiedDocumentId nÃ£o encontrado na mensagem");
            return;
        }

        UUID unifiedDocumentId = UUID.fromString(unifiedDocumentIdStr);

        log.debug("Indexando documento unificado: {}", unifiedDocumentId);

        try {
            UnifiedDocument unifiedDocument = unifiedDocumentRepository.findById(unifiedDocumentId)
                    .orElseThrow(() -> new RuntimeException("UnifiedDocument nÃ£o encontrado: " + unifiedDocumentId));

            // Cachear metadados do documento
            cacheDocumentMetadata(unifiedDocument);

            // Cachear URL de download (signed URL se necessÃ¡rio)
            if (s3Url != null) {
                cacheDownloadUrl(unifiedDocumentId, s3Url);
            }

            // Criar Ã­ndices adicionais se necessÃ¡rio
            createIndexes(unifiedDocument);

            log.debug("Documento {} indexado com sucesso", unifiedDocumentId);

        } catch (Exception e) {
            log.error("Erro ao indexar documento {}", unifiedDocumentId, e);
        }
    }

    private void cacheDocumentMetadata(UnifiedDocument document) {
        try {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("id", document.getId().toString());
            metadata.put("employeeName", document.getEmployeeName() != null ? document.getEmployeeName() : "");
            metadata.put("month", document.getMonth() != null ? document.getMonth().toString() : "");
            metadata.put("year", document.getYear() != null ? document.getYear().toString() : "");
            metadata.put("status", document.getStatus() != null ? document.getStatus().name() : "");
            metadata.put("fileName", document.getFileName() != null ? document.getFileName() : "");
            metadata.put("filePath", document.getFilePath() != null ? document.getFilePath() : "");

            String cacheKey = CACHE_PREFIX + document.getId();
            redisTemplate.opsForHash().putAll(cacheKey, metadata);
            redisTemplate.expire(cacheKey, CACHE_TTL);

            // Criar Ã­ndices por funcionÃ¡rio e perÃ­odo
            if (document.getEmployeeName() != null && document.getMonth() != null && document.getYear() != null) {
                String indexKey = String.format("unified:index:%s:%02d:%04d",
                        document.getEmployeeName().toUpperCase().replaceAll("[^A-Z0-9]", "_"),
                        document.getMonth(),
                        document.getYear());
                redisTemplate.opsForSet().add(indexKey, document.getId().toString());
                redisTemplate.expire(indexKey, CACHE_TTL);
            }

        } catch (Exception e) {
            log.error("Erro ao cachear metadados do documento", e);
        }
    }

    private void cacheDownloadUrl(UUID documentId, String s3Url) {
        try {
            String cacheKey = CACHE_URL_PREFIX + documentId;
            redisTemplate.opsForValue().set(cacheKey, s3Url, CACHE_TTL);
        } catch (Exception e) {
            log.error("Erro ao cachear URL de download", e);
        }
    }

    private void createIndexes(UnifiedDocument document) {
        try {
            // Ãndice por funcionÃ¡rio
            if (document.getEmployeeName() != null) {
                String employeeIndex = "unified:employee:"
                        + document.getEmployeeName().toUpperCase().replaceAll("[^A-Z0-9]", "_");
                redisTemplate.opsForSet().add(employeeIndex, document.getId().toString());
                redisTemplate.expire(employeeIndex, CACHE_TTL);
            }

            // Ãndice por perÃ­odo
            if (document.getMonth() != null && document.getYear() != null) {
                String periodIndex = String.format("unified:period:%04d:%02d", document.getYear(), document.getMonth());
                redisTemplate.opsForSet().add(periodIndex, document.getId().toString());
                redisTemplate.expire(periodIndex, CACHE_TTL);
            }

        } catch (Exception e) {
            log.error("Erro ao criar Ã­ndices", e);
        }
    }

    /**
     * Busca URL de download em cache
     */
    public String getCachedDownloadUrl(UUID documentId) {
        try {
            String cacheKey = CACHE_URL_PREFIX + documentId;
            return redisTemplate.opsForValue().get(cacheKey);
        } catch (Exception e) {
            log.error("Erro ao buscar URL em cache", e);
            return null;
        }
    }

    /**
     * Busca metadados do documento em cache
     */
    public Map<Object, Object> getCachedMetadata(UUID documentId) {
        try {
            String cacheKey = CACHE_PREFIX + documentId;
            return redisTemplate.opsForHash().entries(cacheKey);
        } catch (Exception e) {
            log.error("Erro ao buscar metadados em cache", e);
            return null;
        }
    }
}
