package com.z7design.fleet_manager.worker;

import com.z7design.fleet_manager.model.DocumentPage;
import com.z7design.fleet_manager.repository.DocumentPageRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StreamOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ParserWorker {

    private ParserWorker self; // Self-injection para permitir @Transactional em mÃ©todos internos

    @org.springframework.beans.factory.annotation.Autowired
    public void setSelf(ParserWorker self) {
        this.self = self;
    }

    private final StringRedisTemplate redisTemplate;
    private final DocumentPageRepository documentPageRepository;
    private final EntityManager entityManager;

    private static final String STREAM_PARSED = "stream:parsed";
    private static final String STREAM_VALIDATED = "stream:validated";
    private static final String CONSUMER_GROUP = "parser-group";
    private static final String CONSUMER_NAME = "parser-worker-1";

    @PostConstruct
    public void init() {
        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•");
        log.info("ðŸŸ£ PARSER WORKER: Iniciando inicializaÃ§Ã£o...");
        log.info(
                "â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â••â•â•â•");

        // InicializaÃ§Ã£o assÃ­ncrona para nÃ£o bloquear o startup do Spring se o Redis
        // estiver fora
        new Thread(() -> {
            try {
                redisTemplate.opsForStream().createGroup(STREAM_PARSED, ReadOffset.from("0"), CONSUMER_GROUP);
                log.info("âœ… PARSER WORKER: Consumer group '{}' criado/verificado", CONSUMER_GROUP);
            } catch (Exception e) {
                log.info("â„¹ï¸ PARSER WORKER: Consumer group '{}' jÃ¡ existe ou erro: {}", CONSUMER_GROUP,
                        e.getMessage());
            }
            log.info("âœ… PARSER WORKER: InicializaÃ§Ã£o concluÃ­da - Worker pronto!");
        }).start();

        log.info("ðŸŸ£ PARSER WORKER: InicializaÃ§Ã£o agendada em background.");
    }

    @Scheduled(fixedDelay = 2000)
    public void processParsedPages() {
        try {

            StreamOperations<String, Object, Object> streamOps = redisTemplate.opsForStream();
            Consumer consumer = Consumer.from(CONSUMER_GROUP, CONSUMER_NAME);

            // 1. Tentar ler mensagens pendentes (que nÃ£o foram ACKed)
            List<MapRecord<String, Object, Object>> pendingRecords = streamOps.read(
                    consumer,
                    StreamReadOptions.empty().count(10).noack(),
                    StreamOffset.create(STREAM_PARSED, ReadOffset.from("0")));

            if (pendingRecords != null && !pendingRecords.isEmpty()) {
                log.info("ðŸ”µ ParserWorker: Encontradas {} mensagens pendentes", pendingRecords.size());
                System.out.println("ðŸ”µ ParserWorker: Encontradas " + pendingRecords.size() + " mensagens pendentes");
                for (MapRecord<String, Object, Object> record : pendingRecords) {
                    try {
                        if (self != null) {
                            self.processPageTransactional(record);
                        } else {
                            processPage(record);
                        }
                        streamOps.acknowledge(STREAM_PARSED, CONSUMER_GROUP, record.getId());
                    } catch (RuntimeException e) {
                        log.warn(
                                "âš ï¸ ParserWorker: Erro ao processar mensagem pendente {} (DocumentPage pode ter sido excluÃ­da): {}",
                                record.getId(), e.getMessage());
                        streamOps.acknowledge(STREAM_PARSED, CONSUMER_GROUP, record.getId());
                    } catch (Exception e) {
                        log.error("âŒ ParserWorker: Erro inesperado ao processar mensagem pendente {}", record.getId(),
                                e);
                        streamOps.acknowledge(STREAM_PARSED, CONSUMER_GROUP, record.getId());
                    }
                }
            }

            // 2. Tentar ler novas mensagens
            List<MapRecord<String, Object, Object>> newRecords = streamOps.read(
                    consumer,
                    StreamReadOptions.empty().count(10),
                    StreamOffset.create(STREAM_PARSED, ReadOffset.lastConsumed()));

            if (newRecords == null || newRecords.isEmpty()) {
                if (System.currentTimeMillis() % 10000 < 500) {
                    log.debug("ðŸŸ¢ ParserWorker: Nenhuma nova mensagem no stream:parsed");
                }
                return;
            }

            log.info("ðŸŸ£ ParserWorker: Processando {} novas pÃ¡ginas do stream:parsed", newRecords.size());
            System.out.println(
                    "ðŸŸ£ ParserWorker: Processando " + newRecords.size() + " novas pÃ¡ginas do stream:parsed");

            for (MapRecord<String, Object, Object> record : newRecords) {
                try {
                    if (self != null) {
                        self.processPageTransactional(record);
                    } else {
                        processPage(record);
                    }
                    streamOps.acknowledge(STREAM_PARSED, CONSUMER_GROUP, record.getId());
                } catch (RuntimeException e) {
                    log.warn(
                            "âš ï¸ ParserWorker: Erro ao processar nova pÃ¡gina {} (DocumentPage pode ter sido excluÃ­da): {}",
                            record.getId(), e.getMessage());
                    streamOps.acknowledge(STREAM_PARSED, CONSUMER_GROUP, record.getId());
                } catch (Exception e) {
                    log.error("âŒ ParserWorker: Erro inesperado ao processar nova pÃ¡gina {}", record.getId(), e);
                    streamOps.acknowledge(STREAM_PARSED, CONSUMER_GROUP, record.getId());
                }
            }
        } catch (org.springframework.data.redis.RedisConnectionFailureException e) {
            log.error("âŒ ParserWorker: Erro de conexÃ£o com Redis - {}", e.getMessage());
        } catch (Exception e) {
            log.error("âŒ ParserWorker: Erro inesperado no loop principal", e);
        }
    }

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED, propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void processPageTransactional(MapRecord<String, Object, Object> record) {
        processPage(record);
    }

    private void processPage(MapRecord<String, Object, Object> record) {
        String pageIdStr = (String) record.getValue().get("pageId");
        String jobIdStr = (String) record.getValue().get("jobId");
        String documentTypeStr = (String) record.getValue().get("type"); // Obter o tipo do documento
        String fileHash = (String) record.getValue().get("fileHash"); // Hash do arquivo completo

        log.info("ðŸŸ£ ParserWorker: Recebida mensagem do stream - pageId: {}, jobId: {}, type: {}, fileHash: {}",
                pageIdStr, jobIdStr, documentTypeStr,
                fileHash != null ? fileHash.substring(0, Math.min(16, fileHash.length())) + "..." : "null");

        if (pageIdStr == null || documentTypeStr == null) {
            log.warn("âš ï¸ ParserWorker: pageId ou documentType nÃ£o encontrado na mensagem: {}", record.getValue());
            throw new IllegalArgumentException("pageId ou documentType nÃ£o encontrado na mensagem do Redis");
        }

        UUID pageId = UUID.fromString(pageIdStr);
        DocumentPage.DocumentType documentType = DocumentPage.DocumentType.valueOf(documentTypeStr);

        log.info("ðŸŸ£ ParserWorker: Validando DocumentPage ID: {} (Tipo: {}) - Buscando no banco...", pageId,
                documentType);

        // Limpar cache do Hibernate para garantir que buscamos dados atualizados
        entityManager.clear();

        DocumentPage documentPage = documentPageRepository.findById(pageId).orElse(null);

        // Se nÃ£o encontrou, tentar novamente apÃ³s delays progressivos (pode ser
        // problema de timing/isolamento)
        if (documentPage == null) {
            log.warn(
                    "âš ï¸ ParserWorker: DocumentPage nÃ£o encontrado na primeira tentativa: {} (jobId: {}). Tentando novamente com delays progressivos...",
                    pageId, jobIdStr);
            int[] delays = { 200, 500, 1000 }; // Delays progressivos: 200ms, 500ms, 1000ms
            for (int delay : delays) {
                try {
                    Thread.sleep(delay);
                    entityManager.clear(); // Limpar cache novamente
                    entityManager.flush(); // ForÃ§ar flush
                    documentPage = documentPageRepository.findById(pageId).orElse(null);
                    if (documentPage != null) {
                        log.info("âœ… ParserWorker: DocumentPage encontrada apÃ³s retry com delay de {}ms", delay);
                        break;
                    } else {
                        log.debug(
                                "ðŸŸ¡ ParserWorker: DocumentPage ainda nÃ£o encontrada apÃ³s delay de {}ms, tentando novamente...",
                                delay);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        if (documentPage == null) {
            log.warn("âš ï¸ ParserWorker: DocumentPage nÃ£o encontrado apÃ³s retry: {} (jobId: {})", pageId, jobIdStr);
            // Tentar buscar por jobId para ver se a pÃ¡gina existe
            if (jobIdStr != null) {
                try {
                    UUID jobId = UUID.fromString(jobIdStr);
                    List<DocumentPage> pagesByJob = documentPageRepository.findByJobId(jobId);
                    log.warn(
                            "âš ï¸ ParserWorker: Encontradas {} pÃ¡ginas no job {}, mas a pÃ¡gina {} nÃ£o foi encontrada. IDs encontrados: {}",
                            pagesByJob.size(), jobId, pageId,
                            pagesByJob.stream().map(p -> p.getId().toString())
                                    .collect(java.util.stream.Collectors.joining(", ")));
                } catch (Exception e) {
                    log.error("âŒ ParserWorker: Erro ao buscar pÃ¡ginas por jobId", e);
                }
            }
            throw new RuntimeException("DocumentPage nÃ£o encontrada: " + pageId);
        }

        // Criar referÃªncia final para usar em lambdas
        final DocumentPage finalDocumentPage = documentPage;
        final UUID finalPageId = pageId;

        log.info("âœ… ParserWorker: DocumentPage encontrada - ID: {}, Type: {}, Status: {}, CPF: {}, Nome: {}",
                finalPageId, finalDocumentPage.getType(), finalDocumentPage.getStatus(), finalDocumentPage.getCpf(),
                finalDocumentPage.getName());

        log.debug("Validando pÃ¡gina {} do job {}", finalDocumentPage.getPageNumber(), finalDocumentPage.getJobId());

        // Validar CPF
        boolean cpfValid = validateCpf(finalDocumentPage.getCpf());
        if (!cpfValid && finalDocumentPage.getCpf() != null) {
            log.warn("CPF invÃ¡lido detectado: {}", finalDocumentPage.getCpf());
            finalDocumentPage.setStatus(DocumentPage.DocumentPageStatus.REVIEW);
        }

        // Validar valor lÃ­quido
        boolean valueValid = validateValue(finalDocumentPage.getLiquidValue());
        if (!valueValid) {
            log.warn("Valor lÃ­quido invÃ¡lido: {}", finalDocumentPage.getLiquidValue());
            finalDocumentPage.setStatus(DocumentPage.DocumentPageStatus.REVIEW);
        }

        // Validar nome
        boolean nameValid = validateName(finalDocumentPage.getName());
        if (!nameValid && finalDocumentPage.getName() != null) {
            log.warn("Nome invÃ¡lido: {}", finalDocumentPage.getName());
            finalDocumentPage.setStatus(DocumentPage.DocumentPageStatus.REVIEW);
        }

        // Verificar duplicados por hash
        if (finalDocumentPage.getHash() != null) {
            List<DocumentPage> duplicates = documentPageRepository.findByHash(finalDocumentPage.getHash());
            // Verificar se hÃ¡ outras pÃ¡ginas (alÃ©m da atual) com o mesmo hash
            boolean hasDuplicate = duplicates.stream()
                    .anyMatch(d -> !d.getId().equals(finalPageId));
            if (hasDuplicate) {
                log.info("PÃ¡gina duplicada detectada (hash: {}). Encontradas {} pÃ¡ginas com o mesmo hash",
                        finalDocumentPage.getHash(), duplicates.size());
                finalDocumentPage.setStatus(DocumentPage.DocumentPageStatus.REVIEW);
            }
        }

        // Normalizar dados
        finalDocumentPage.setName(normalizeName(finalDocumentPage.getName()));
        finalDocumentPage.setCpf(normalizeCpf(finalDocumentPage.getCpf()));

        // Atualizar status se tudo estiver OK
        if (finalDocumentPage.getStatus() == DocumentPage.DocumentPageStatus.OK) {
            // Verificar se todos os campos obrigatÃ³rios estÃ£o presentes
            if (hasRequiredFields(finalDocumentPage)) {
                finalDocumentPage.setStatus(DocumentPage.DocumentPageStatus.OK);
            } else {
                finalDocumentPage.setStatus(DocumentPage.DocumentPageStatus.REVIEW);
            }
        }

        finalDocumentPage.setProcessedAt(LocalDateTime.now());
        DocumentPage savedPage = documentPageRepository.saveAndFlush(finalDocumentPage);

        // Publicar em stream:validated
        Map<String, String> validatedFields = new HashMap<>();
        validatedFields.put("jobId", savedPage.getJobId().toString());
        validatedFields.put("pageId", savedPage.getId().toString());
        validatedFields.put("type", savedPage.getType().name());
        validatedFields.put("cpf", savedPage.getCpf() != null ? savedPage.getCpf() : "");
        validatedFields.put("name", savedPage.getName() != null ? savedPage.getName() : "");
        validatedFields.put("value", savedPage.getLiquidValue() != null ? savedPage.getLiquidValue().toString() : "");
        validatedFields.put("period", savedPage.getPeriod() != null ? savedPage.getPeriod() : "");
        validatedFields.put("status", savedPage.getStatus().name());
        // Passar hash do arquivo completo (nÃ£o o hash da pÃ¡gina) para verificaÃ§Ã£o
        // de duplicatas e versÃ£o
        if (fileHash != null && !fileHash.isEmpty()) {
            validatedFields.put("fileHash", fileHash);
        }

        try {
            var messageId = redisTemplate.opsForStream().add(STREAM_VALIDATED, validatedFields);
            log.info(
                    "âœ… ParserWorker: PÃ¡gina {} publicada no stream:validated com messageId: {} - Type: {}, Status: {}, CPF: {}, Nome: {}",
                    savedPage.getPageNumber(), messageId, savedPage.getType(), savedPage.getStatus(),
                    savedPage.getCpf(), savedPage.getName());
            System.out.println("âœ… ParserWorker: PÃ¡gina " + savedPage.getPageNumber() +
                    " publicada no stream:validated - Type: " + savedPage.getType() + ", Status: "
                    + savedPage.getStatus());
        } catch (Exception e) {
            log.error("âŒ ParserWorker: Erro ao publicar no stream:validated", e);
        }

        log.debug("PÃ¡gina {} validada - Status: {}", documentPage.getPageNumber(), documentPage.getStatus());
    }

    private boolean validateCpf(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return false;
        }

        // Verificar se todos os dÃ­gitos sÃ£o iguais (CPF invÃ¡lido por padrÃ£o)
        if (cpf.matches("(\\d)\\1{10}")) {
            return false;
        }

        // Para OCR, aceitar CPF mesmo se dÃ­gitos verificadores estiverem errados
        // (pode ser erro de leitura do OCR). Apenas verificar formato bÃ¡sico.
        // Se quiser validaÃ§Ã£o completa, descomente o cÃ³digo abaixo.

        // ValidaÃ§Ã£o completa de dÃ­gitos verificadores (mais restritiva)
        try {
            int[] digits = new int[11];
            for (int i = 0; i < 11; i++) {
                char c = cpf.charAt(i);
                if (!Character.isDigit(c)) {
                    return false;
                }
                digits[i] = Character.getNumericValue(c);
            }

            // Calcular primeiro dÃ­gito verificador
            int sum = 0;
            for (int i = 0; i < 9; i++) {
                sum += digits[i] * (10 - i);
            }
            int firstDigit = 11 - (sum % 11);
            if (firstDigit >= 10)
                firstDigit = 0;

            // Calcular segundo dÃ­gito verificador
            sum = 0;
            for (int i = 0; i < 10; i++) {
                sum += digits[i] * (11 - i);
            }
            int secondDigit = 11 - (sum % 11);
            if (secondDigit >= 10)
                secondDigit = 0;

            // Aceitar se dÃ­gitos verificadores estÃ£o corretos OU se parece ser um CPF
            // vÃ¡lido (nÃ£o todos iguais)
            // Isso permite processar CPFs mesmo com pequenos erros de OCR
            boolean validCheckDigits = (firstDigit == digits[9] && secondDigit == digits[10]);
            boolean notAllSame = !cpf.matches("(\\d)\\1{10}");

            // Aceitar se: (dÃ­gitos verificadores corretos) OU (nÃ£o sÃ£o todos iguais E
            // tem formato vÃ¡lido)
            return validCheckDigits || (notAllSame && cpf.matches("\\d{11}"));
        } catch (Exception e) {
            log.warn("Erro ao validar CPF {}: {}", cpf, e.getMessage());
            return false;
        }
    }

    private boolean validateValue(BigDecimal value) {
        if (value == null) {
            return false;
        }
        return value.compareTo(BigDecimal.ZERO) >= 0;
    }

    private boolean validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return false;
        }
        // Nome deve ter pelo menos 2 palavras
        String[] words = name.trim().split("\\s+");
        return words.length >= 2;
    }

    private boolean hasRequiredFields(DocumentPage page) {
        // Para holerite: CPF, nome, perÃ­odo, valor sÃ£o obrigatÃ³rios
        if (page.getType() == DocumentPage.DocumentType.HOLERITE) {
            return page.getCpf() != null &&
                    page.getName() != null &&
                    page.getPeriod() != null &&
                    page.getLiquidValue() != null;
        }
        // Para comprovante: nome OU CPF, valor, perÃ­odo sÃ£o obrigatÃ³rios
        if (page.getType() == DocumentPage.DocumentType.COMPROVANTE) {
            return (page.getCpf() != null || page.getName() != null) &&
                    page.getLiquidValue() != null &&
                    page.getPeriod() != null;
        }
        return false;
    }

    private String normalizeCpf(String cpf) {
        if (cpf == null) {
            return null;
        }
        return cpf.replaceAll("[^0-9]", "");
    }

    private String normalizeName(String name) {
        if (name == null) {
            return null;
        }
        return name.toUpperCase()
                .replace("Ã", "A").replace("Ã€", "A").replace("Ã‚", "A").replace("Ãƒ", "A")
                .replace("Ã‰", "E").replace("ÃŠ", "E")
                .replace("Ã", "I")
                .replace("Ã“", "O").replace("Ã”", "O").replace("Ã•", "O")
                .replace("Ãš", "U").replace("Ãœ", "U")
                .replace("Ã‡", "C")
                .trim();
    }
}
