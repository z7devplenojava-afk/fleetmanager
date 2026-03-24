package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PontoImportService {

    private final PontoRawRepository pontoRawRepository;
    private final ImportJobLogRepository importJobLogRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /**
     * Importa batidas de um arquivo JSON
     * Formato esperado: [{"employeeId": "uuid", "timestamp": "2025-01-15T08:00:00", "tipo": "ENTRADA"}, ...]
     */
    @Transactional
    public ImportJobLog importFromFile(MultipartFile file, UUID importedById) {
        log.info("ðŸ“¥ Iniciando importaÃ§Ã£o de batidas do arquivo: {}", file.getOriginalFilename());
        
        try {
            // Ler conteÃºdo do arquivo
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            
            // Calcular hash do conteÃºdo para idempotÃªncia
            String importHash = calculateSHA256(content);
            
            // Verificar se jÃ¡ foi importado
            Optional<ImportJobLog> existing = importJobLogRepository.findByImportHash(importHash);
            if (existing.isPresent()) {
                log.warn("âš ï¸ Arquivo jÃ¡ foi importado anteriormente - Hash: {}", importHash);
                return existing.get();
            }
            
            // Criar log de importaÃ§Ã£o
            ImportJobLog importJob = new ImportJobLog();
            importJob.setImportHash(importHash);
            importJob.setFileName(file.getOriginalFilename());
            importJob.setFileSize(file.getSize());
            importJob.setStatus(ImportJobLog.ImportStatus.PROCESSING);
            importJob.setSourceType("FILE");
            importJob.setImportedBy(userRepository.findById(importedById).orElse(null));
            importJob = importJobLogRepository.save(importJob);
            
            // Parsear JSON
            List<Map<String, Object>> batidas = objectMapper.readValue(content, new TypeReference<List<Map<String, Object>>>() {});
            
            int totalRecords = batidas.size();
            int processedRecords = 0;
            int failedRecords = 0;
            List<Map<String, Object>> errors = new ArrayList<>();
            
            // Processar cada batida
            for (int i = 0; i < batidas.size(); i++) {
                Map<String, Object> batidaData = batidas.get(i);
                try {
                    processBatida(batidaData, importJob.getId());
                    processedRecords++;
                } catch (Exception e) {
                    failedRecords++;
                    Map<String, Object> error = new HashMap<>();
                    error.put("line", i + 1);
                    error.put("data", batidaData);
                    error.put("message", e.getMessage());
                    errors.add(error);
                    log.error("âŒ Erro ao processar batida na linha {}: {}", i + 1, e.getMessage());
                }
            }
            
            // Atualizar log de importaÃ§Ã£o
            importJob.setTotalRecords(totalRecords);
            importJob.setProcessedRecords(processedRecords);
            importJob.setFailedRecords(failedRecords);
            importJob.setStatus(failedRecords == 0 ? ImportJobLog.ImportStatus.COMPLETED : ImportJobLog.ImportStatus.COMPLETED);
            importJob.setCompletedAt(LocalDateTime.now());
            
            if (!errors.isEmpty()) {
                importJob.setErrorMessage(String.format("Falha ao processar %d de %d registros", failedRecords, totalRecords));
                try {
                    importJob.setErrorDetails(objectMapper.writeValueAsString(errors));
                } catch (Exception e) {
                    log.error("Erro ao serializar erros: {}", e.getMessage());
                }
            }
            
            importJob = importJobLogRepository.save(importJob);
            log.info("âœ… ImportaÃ§Ã£o concluÃ­da - Total: {}, Processados: {}, Falhas: {}", 
                     totalRecords, processedRecords, failedRecords);
            
            return importJob;
            
        } catch (Exception e) {
            log.error("âŒ Erro ao importar arquivo: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao importar arquivo: " + e.getMessage(), e);
        }
    }

    /**
     * Importa batidas de uma lista (ex: endpoint API)
     */
    @Transactional
    public ImportJobLog importFromList(List<Map<String, Object>> batidas, UUID importedById, String sourceType) {
        log.info("ðŸ“¥ Iniciando importaÃ§Ã£o de {} batidas via {}", batidas.size(), sourceType);
        
        try {
            // Converter lista para JSON string para calcular hash
            String content = objectMapper.writeValueAsString(batidas);
            String importHash = calculateSHA256(content);
            
            // Verificar se jÃ¡ foi importado
            Optional<ImportJobLog> existing = importJobLogRepository.findByImportHash(importHash);
            if (existing.isPresent()) {
                log.warn("âš ï¸ Dados jÃ¡ foram importados anteriormente - Hash: {}", importHash);
                return existing.get();
            }
            
            // Criar log de importaÃ§Ã£o
            ImportJobLog importJob = new ImportJobLog();
            importJob.setImportHash(importHash);
            importJob.setStatus(ImportJobLog.ImportStatus.PROCESSING);
            importJob.setSourceType(sourceType != null ? sourceType : "API");
            importJob.setImportedBy(userRepository.findById(importedById).orElse(null));
            importJob = importJobLogRepository.save(importJob);
            
            int totalRecords = batidas.size();
            int processedRecords = 0;
            int failedRecords = 0;
            List<Map<String, Object>> errors = new ArrayList<>();
            
            // Processar cada batida
            for (int i = 0; i < batidas.size(); i++) {
                Map<String, Object> batidaData = batidas.get(i);
                try {
                    processBatida(batidaData, importJob.getId());
                    processedRecords++;
                } catch (Exception e) {
                    failedRecords++;
                    Map<String, Object> error = new HashMap<>();
                    error.put("index", i);
                    error.put("data", batidaData);
                    error.put("message", e.getMessage());
                    errors.add(error);
                    log.error("âŒ Erro ao processar batida no Ã­ndice {}: {}", i, e.getMessage());
                }
            }
            
            // Atualizar log de importaÃ§Ã£o
            importJob.setTotalRecords(totalRecords);
            importJob.setProcessedRecords(processedRecords);
            importJob.setFailedRecords(failedRecords);
            importJob.setStatus(failedRecords == 0 ? ImportJobLog.ImportStatus.COMPLETED : ImportJobLog.ImportStatus.COMPLETED);
            importJob.setCompletedAt(LocalDateTime.now());
            
            if (!errors.isEmpty()) {
                importJob.setErrorMessage(String.format("Falha ao processar %d de %d registros", failedRecords, totalRecords));
                try {
                    importJob.setErrorDetails(objectMapper.writeValueAsString(errors));
                } catch (Exception e) {
                    log.error("Erro ao serializar erros: {}", e.getMessage());
                }
            }
            
            importJob = importJobLogRepository.save(importJob);
            log.info("âœ… ImportaÃ§Ã£o concluÃ­da - Total: {}, Processados: {}, Falhas: {}", 
                     totalRecords, processedRecords, failedRecords);
            
            return importJob;
            
        } catch (Exception e) {
            log.error("âŒ Erro ao importar lista: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao importar lista: " + e.getMessage(), e);
        }
    }

    /**
     * Processa uma batida individual
     */
    private void processBatida(Map<String, Object> batidaData, UUID importJobId) throws Exception {
        // Extrair dados
        String employeeIdStr = String.valueOf(batidaData.get("employeeId"));
        UUID employeeId = UUID.fromString(employeeIdStr);
        
        String timestampStr = String.valueOf(batidaData.get("timestamp"));
        LocalDateTime timestamp = LocalDateTime.parse(timestampStr);
        
        String tipoStr = String.valueOf(batidaData.get("tipo"));
        PontoRaw.BatidaTipo tipo = PontoRaw.BatidaTipo.valueOf(tipoStr.toUpperCase());
        
        // Validar funcionÃ¡rio
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado: " + employeeId));
        
        // Criar hash Ãºnico para esta batida
        String batidaHash = calculateSHA256(employeeIdStr + timestampStr + tipoStr);
        
        // Verificar se jÃ¡ existe (evitar duplicatas)
        if (pontoRawRepository.existsByEmployeeIdAndTimestampAndTipo(employeeId, timestamp, tipo)) {
            log.warn("âš ï¸ Batida duplicada ignorada - Employee: {}, Timestamp: {}, Tipo: {}", 
                     employeeId, timestamp, tipo);
            return; // NÃ£o Ã© erro, apenas ignora duplicata
        }
        
        // Criar registro de batida bruta
        PontoRaw pontoRaw = new PontoRaw();
        pontoRaw.setEmployee(employee);
        pontoRaw.setTimestamp(timestamp);
        pontoRaw.setTipo(tipo);
        pontoRaw.setImportHash(batidaHash);
        pontoRaw.setImportJobId(importJobId);
        pontoRaw.setProcessed(false);
        
        // Preservar dados originais como JSON
        try {
            pontoRaw.setRawData(objectMapper.writeValueAsString(batidaData));
        } catch (Exception e) {
            log.warn("âš ï¸ Erro ao serializar raw_data: {}", e.getMessage());
        }
        
        pontoRawRepository.save(pontoRaw);
        log.debug("âœ… Batida processada - Employee: {}, Timestamp: {}, Tipo: {}", 
                  employeeId, timestamp, tipo);
    }

    /**
     * Calcula hash SHA-256 de uma string
     */
    private String calculateSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            
            // Converter para hexadecimal
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (Exception e) {
            log.error("Erro ao calcular hash SHA-256: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao calcular hash", e);
        }
    }

    /**
     * Busca log de importaÃ§Ã£o por ID
     */
    public ImportJobLog findImportJobById(UUID id) {
        return importJobLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job de importaÃ§Ã£o nÃ£o encontrado: " + id));
    }

    /**
     * Lista todos os jobs de importaÃ§Ã£o
     */
    public List<ImportJobLog> findAllImportJobs() {
        return importJobLogRepository.findAll();
    }

    /**
     * Busca batidas brutas nÃ£o processadas
     */
    public List<PontoRaw> findUnprocessedBatidas(UUID employeeId) {
        if (employeeId != null) {
            return pontoRawRepository.findByEmployeeIdAndProcessedFalse(employeeId);
        }
        return pontoRawRepository.findUnprocessed(org.springframework.data.domain.PageRequest.of(0, 1000))
                .getContent();
    }
}






