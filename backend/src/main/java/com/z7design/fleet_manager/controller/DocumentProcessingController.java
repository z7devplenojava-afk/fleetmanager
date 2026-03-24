package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.JobStatusResponse;
import com.z7design.fleet_manager.model.DocumentProcessingJob;
import com.z7design.fleet_manager.service.DocumentProcessingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/document-processing")
@RequiredArgsConstructor
@Tag(name = "Document Processing", description = "API para processamento inteligente de holerites e comprovantes")
public class DocumentProcessingController {
    
    private final DocumentProcessingService processingService;
    private final StringRedisTemplate redisTemplate;
    
    @PostMapping(value = "/upload-payslips", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Upload de PDF de Holerites para processamento",
        description = "Faz upload de um ou mais PDFs contendo holerites para processamento assÃ­ncrono. Aceita atÃ© 4 arquivos."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Upload realizado com sucesso",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<?> uploadPayslips(
            @Parameter(description = "Arquivo(s) PDF contendo holerites (atÃ© 4 arquivos)", required = true)
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        
        try {
            // Determinar quais arquivos processar
            List<MultipartFile> filesToProcess = new ArrayList<>();
            if (files != null && !files.isEmpty()) {
                filesToProcess.addAll(files);
            } else if (file != null) {
                filesToProcess.add(file);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Nenhum arquivo fornecido", "message", "Ã‰ necessÃ¡rio fornecer pelo menos um arquivo"));
            }
            
            // Validar quantidade mÃ¡xima (atÃ© 4 arquivos)
            if (filesToProcess.size() > 4) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Muitos arquivos", "message", "MÃ¡ximo de 4 arquivos permitidos. Fornecidos: " + filesToProcess.size()));
            }
            
            // Validar e processar cada arquivo
            List<Map<String, Object>> results = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (MultipartFile f : filesToProcess) {
                if (f == null || f.isEmpty()) {
                    errors.add("Arquivo vazio ou nulo ignorado");
                    continue;
                }
                
                try {
                    log.info("ðŸ“„ Recebido upload de HOLERITES: {} ({} bytes)", f.getOriginalFilename(), f.getSize());
                    UUID jobId = processingService.createProcessingJob(f, "HOLERITE");
                    log.info("âœ… Job de HOLERITES criado com ID: {} para arquivo: {}", jobId, f.getOriginalFilename());
                    
                    DocumentProcessingJob savedJob = processingService.getJob(jobId);
                    if (savedJob == null) {
                        errors.add("Erro ao salvar job para arquivo: " + f.getOriginalFilename());
                        continue;
                    }
                    
                    results.add(Map.of(
                        "jobId", jobId.toString(),
                        "fileName", f.getOriginalFilename(),
                        "status", savedJob.getStatus().name(),
                        "message", "Arquivo enfileirado para processamento"
                    ));
                } catch (IllegalArgumentException e) {
                    errors.add("Arquivo " + f.getOriginalFilename() + ": " + e.getMessage());
                } catch (Exception e) {
                    log.error("âŒ Erro ao processar arquivo {}: {}", f.getOriginalFilename(), e.getMessage(), e);
                    errors.add("Erro ao processar " + f.getOriginalFilename() + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("jobs", results);
            response.put("totalFiles", filesToProcess.size());
            response.put("successful", results.size());
            response.put("failed", errors.size());
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            if (results.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("âŒ Erro ao processar upload de holerites", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro interno", "message", "Erro ao processar arquivos: " + e.getMessage()));
        }
    }
    
    @PostMapping(value = "/upload-receipts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Upload de PDF de Comprovantes para processamento",
        description = "Faz upload de um PDF contendo comprovantes de pagamento para processamento assÃ­ncrono. Processa apenas comprovantes."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Upload realizado com sucesso",
            content = @Content(schema = @Schema(implementation = JobStatusResponse.class))
        ),
        @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido"),
        @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<JobStatusResponse> uploadReceipts(
            @Parameter(description = "Arquivo PDF contendo comprovantes", required = true)
            @RequestParam("file") MultipartFile file) {
        
        try {
            log.info("ðŸ“„ Recebido upload de COMPROVANTES: {}", file.getOriginalFilename());
            UUID jobId = processingService.createProcessingJob(file, "COMPROVANTE");
            log.info("âœ… Job de COMPROVANTES criado com ID: {}", jobId);
            
            DocumentProcessingJob savedJob = processingService.getJob(jobId);
            if (savedJob == null) {
                log.error("âŒ Job {} nÃ£o foi encontrado apÃ³s criaÃ§Ã£o!", jobId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(JobStatusResponse.builder()
                        .jobId(jobId)
                        .status("FAILED")
                        .message("Erro ao salvar job no banco de dados")
                        .build());
            }
            
            JobStatusResponse response = JobStatusResponse.builder()
                .jobId(jobId)
                .status(savedJob.getStatus().name())
                .message("Arquivo de comprovantes enfileirado para processamento")
                .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("âŒ Erro ao processar upload de comprovantes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @Deprecated
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "[DEPRECATED] Upload de PDF para processamento",
        description = "DEPRECATED: Use /upload-payslips ou /upload-receipts. Este endpoint serÃ¡ removido."
    )
    public ResponseEntity<JobStatusResponse> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "documentType", defaultValue = "HOLERITE") String documentType) {
        
        log.warn("âš ï¸ Endpoint /upload estÃ¡ deprecated. Use /upload-payslips ou /upload-receipts");
        
        try {
            UUID jobId = processingService.createProcessingJob(file, documentType);
            DocumentProcessingJob savedJob = processingService.getJob(jobId);
            
            if (savedJob == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(JobStatusResponse.builder()
                        .jobId(jobId)
                        .status("FAILED")
                        .message("Erro ao salvar job no banco de dados")
                        .build());
            }
            
            return ResponseEntity.ok(JobStatusResponse.builder()
                .jobId(jobId)
                .status(savedJob.getStatus().name())
                .message("Arquivo enfileirado para processamento")
                .build());
        } catch (Exception e) {
            log.error("Erro ao processar upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/job/{jobId}")
    @Operation(
        summary = "Consultar status do job",
        description = "Retorna o status atual de um job de processamento"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Status do job",
            content = @Content(schema = @Schema(implementation = JobStatusResponse.class))
        ),
        @ApiResponse(responseCode = "404", description = "Job nÃ£o encontrado")
    })
    public ResponseEntity<JobStatusResponse> getJobStatus(
            @Parameter(description = "ID do job", required = true)
            @PathVariable UUID jobId) {
        
        try {
            log.debug("Consultando status do job: {}", jobId);
            DocumentProcessingJob job = processingService.getJob(jobId);
            
            if (job == null) {
                log.warn("Job {} nÃ£o encontrado no banco de dados", jobId);
                return ResponseEntity.notFound().build();
            }
            
            log.debug("Job encontrado: id={}, status={}, progress={}%", 
                job.getId(), job.getStatus(), job.getProgressPercentage());
            
            JobStatusResponse response = JobStatusResponse.builder()
                .jobId(job.getId())
                .status(job.getStatus().name()) // Retorna em maiÃºsculo (QUEUED, PROCESSING, etc)
                .progressPercentage(job.getProgressPercentage())
                .totalPages(job.getTotalPages())
                .processedPages(job.getProcessedPages())
                .errorMessage(job.getErrorMessage())
                .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erro ao consultar status do job: {}", jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/stream-info")
    @Operation(summary = "InformaÃ§Ãµes sobre os streams do Redis")
    public ResponseEntity<Map<String, Object>> getStreamInfo() {
        Map<String, Object> info = new HashMap<>();
        
        try {
            // InformaÃ§Ãµes do stream:jobs
            try {
                Long jobsStreamLength = redisTemplate.opsForStream().size("stream:jobs");
                info.put("stream:jobs", Map.of(
                    "length", jobsStreamLength != null ? jobsStreamLength : 0,
                    "note", "NÃºmero de mensagens no stream"
                ));
                
                // Nota: Para ver o conteÃºdo das mensagens, use o endpoint /stream:jobs/clear para limpar mensagens antigas
                info.put("stream:jobs:note", "Use DELETE /api/v1/document-processing/stream:jobs/clear para limpar mensagens antigas");
            } catch (Exception e) {
                info.put("stream:jobs", Map.of("error", e.getMessage()));
            }
            
            // InformaÃ§Ãµes de outros streams
            String[] streams = {"stream:pages", "stream:parsed", "stream:validated"};
            Map<String, Object> otherStreams = new HashMap<>();
            for (String stream : streams) {
                try {
                    Long length = redisTemplate.opsForStream().size(stream);
                    otherStreams.put(stream, length != null ? length : 0);
                } catch (Exception e) {
                    otherStreams.put(stream, "error: " + e.getMessage());
                }
            }
            info.put("other_streams", otherStreams);
            
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            info.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(info);
        }
    }

    @DeleteMapping("/stream:jobs/clear")
    @Operation(summary = "Limpar todas as mensagens do stream:jobs (CUIDADO!)")
    public ResponseEntity<Map<String, String>> clearJobsStream() {
        try {
            // Deletar o stream inteiro
            redisTemplate.delete("stream:jobs");
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Stream stream:jobs foi limpo com sucesso"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Verificar saÃºde do sistema de processamento")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // Verificar Redis
            boolean redisAvailable = false;
            String redisError = null;
            try {
                String pingResult = redisTemplate.getConnectionFactory().getConnection().ping();
                redisAvailable = true;
                health.put("redis", Map.of(
                    "status", "OK",
                    "ping", pingResult
                ));
            } catch (Exception e) {
                redisError = e.getMessage();
                health.put("redis", Map.of(
                    "status", "ERROR",
                    "error", redisError,
                    "message", "Redis nÃ£o estÃ¡ disponÃ­vel. Verifique se estÃ¡ rodando em localhost:6379"
                ));
            }
            
            // Verificar streams do Redis
            if (redisAvailable) {
                try {
                    Long jobsInStream = redisTemplate.opsForStream().size("stream:jobs");
                    Long pagesInStream = redisTemplate.opsForStream().size("stream:pages");
                    Long parsedInStream = redisTemplate.opsForStream().size("stream:parsed");
                    Long validatedInStream = redisTemplate.opsForStream().size("stream:validated");
                    
                    health.put("streams", Map.of(
                        "stream:jobs", jobsInStream != null ? jobsInStream : 0,
                        "stream:pages", pagesInStream != null ? pagesInStream : 0,
                        "stream:parsed", parsedInStream != null ? parsedInStream : 0,
                        "stream:validated", validatedInStream != null ? validatedInStream : 0
                    ));
                } catch (Exception e) {
                    health.put("streams", Map.of(
                        "status", "ERROR",
                        "error", e.getMessage()
                    ));
                }
            } else {
                health.put("streams", "Redis nÃ£o disponÃ­vel - nÃ£o Ã© possÃ­vel verificar streams");
            }
            
            // InformaÃ§Ã£o sobre workers (serÃ¡ verificado pelos logs de inicializaÃ§Ã£o)
            health.put("workers", Map.of(
                "note", "Verifique os logs de inicializaÃ§Ã£o para confirmar se os workers foram carregados",
                "expected", "SplitterWorker, OcrWorker, ParserWorker, MatcherWorker, UnmatchedPayslipWorker"
            ));
            
            health.put("status", redisAvailable ? "OK" : "ERROR");
            health.put("message", redisAvailable 
                ? "Sistema funcionando normalmente" 
                : "Redis nÃ£o estÃ¡ disponÃ­vel - Workers nÃ£o podem processar jobs");
            
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            health.put("status", "ERROR");
            health.put("error", e.getMessage());
            log.error("Erro ao verificar saÃºde do sistema", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(health);
        }
    }
    
    @GetMapping("/diagnostic")
    @Operation(summary = "DiagnÃ³stico completo do sistema de processamento")
    public ResponseEntity<Map<String, Object>> diagnostic() {
        Map<String, Object> diagnostic = new HashMap<>();
        
        try {
            // 1. Jobs de processamento
            long totalJobs = processingService.countAllJobs();
            long queuedJobs = processingService.countJobsByStatus("QUEUED");
            long processingJobs = processingService.countJobsByStatus("PROCESSING");
            long completedJobs = processingService.countJobsByStatus("COMPLETED");
            long failedJobs = processingService.countJobsByStatus("FAILED");
            
            diagnostic.put("jobs", Map.of(
                "total", totalJobs,
                "queued", queuedJobs,
                "processing", processingJobs,
                "completed", completedJobs,
                "failed", failedJobs
            ));
            
            // 2. DocumentPages
            long totalPages = processingService.countAllDocumentPages();
            long holeritePages = processingService.countDocumentPagesByType("HOLERITE");
            long comprovantePages = processingService.countDocumentPagesByType("COMPROVANTE");
            long okPages = processingService.countDocumentPagesByStatus("OK");
            long reviewPages = processingService.countDocumentPagesByStatus("REVIEW");
            long errorPages = processingService.countDocumentPagesByStatus("ERROR");
            
            diagnostic.put("documentPages", Map.of(
                "total", totalPages,
                "holerites", holeritePages,
                "comprovantes", comprovantePages,
                "status_ok", okPages,
                "status_review", reviewPages,
                "status_error", errorPages
            ));
            
            // 3. Payslips salvos
            long totalPayslips = processingService.countAllPayslips();
            diagnostic.put("payslips", Map.of("total", totalPayslips));
            
            // 4. PaymentReceipts salvos
            long totalReceipts = processingService.countAllPaymentReceipts();
            diagnostic.put("paymentReceipts", Map.of("total", totalReceipts));
            
            // 5. Redis Streams
            try {
                Long jobsInStream = redisTemplate.opsForStream().size("stream:jobs");
                Long pagesInStream = redisTemplate.opsForStream().size("stream:pages");
                Long parsedInStream = redisTemplate.opsForStream().size("stream:parsed");
                Long validatedInStream = redisTemplate.opsForStream().size("stream:validated");
                
                diagnostic.put("redisStreams", Map.of(
                    "stream:jobs", jobsInStream != null ? jobsInStream : 0,
                    "stream:pages", pagesInStream != null ? pagesInStream : 0,
                    "stream:parsed", parsedInStream != null ? parsedInStream : 0,
                    "stream:validated", validatedInStream != null ? validatedInStream : 0
                ));
            } catch (Exception e) {
                diagnostic.put("redisStreams", Map.of("error", e.getMessage()));
            }
            
            return ResponseEntity.ok(diagnostic);
        } catch (Exception e) {
            diagnostic.put("error", e.getMessage());
            log.error("Erro ao obter diagnÃ³stico", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(diagnostic);
        }
    }

    @GetMapping("/debug/{jobId}")
    @Operation(summary = "Debug: Verificar status completo do processamento")
    public ResponseEntity<Map<String, Object>> debugJob(@PathVariable UUID jobId) {
        Map<String, Object> debug = new HashMap<>();
        
        try {
            // 1. Status do job
            DocumentProcessingJob job = processingService.getJob(jobId);
            if (job != null) {
                debug.put("job", Map.of(
                    "id", job.getId().toString(),
                    "status", job.getStatus().name(),
                    "progress", job.getProgressPercentage(),
                    "totalPages", job.getTotalPages() != null ? job.getTotalPages() : 0,
                    "processedPages", job.getProcessedPages() != null ? job.getProcessedPages() : 0,
                    "errorMessage", job.getErrorMessage() != null ? job.getErrorMessage() : ""
                ));
                
                // 2. DocumentPages criadas
                List<com.z7design.fleet_manager.model.DocumentPage> pages = 
                    processingService.getDocumentPagesByJobId(jobId);
                debug.put("documentPagesCount", pages.size());
                
                // Detalhes das pÃ¡ginas
                List<Map<String, Object>> pageDetails = new ArrayList<>();
                for (com.z7design.fleet_manager.model.DocumentPage page : pages) {
                    Map<String, Object> pageInfo = new HashMap<>();
                    pageInfo.put("id", page.getId().toString());
                    pageInfo.put("type", page.getType().name());
                    pageInfo.put("status", page.getStatus().name());
                    pageInfo.put("cpf", page.getCpf());
                    pageInfo.put("name", page.getName());
                    pageInfo.put("period", page.getPeriod());
                    pageInfo.put("pageNumber", page.getPageNumber());
                    pageDetails.add(pageInfo);
                }
                debug.put("documentPages", pageDetails);
                
                // 3. Payslips criados (buscar todos, nÃ£o apenas do job)
                List<com.z7design.fleet_manager.model.Payslip> allPayslips = 
                    processingService.getPayslipsByJobId(jobId);
                debug.put("payslipsCount", allPayslips.size());
                
                // Detalhes dos payslips
                List<Map<String, Object>> payslipDetails = new ArrayList<>();
                for (com.z7design.fleet_manager.model.Payslip payslip : allPayslips) {
                    Map<String, Object> payslipInfo = new HashMap<>();
                    payslipInfo.put("id", payslip.getId().toString());
                    payslipInfo.put("employeeName", payslip.getEmployeeName());
                    payslipInfo.put("cpf", payslip.getCpf());
                    payslipInfo.put("month", payslip.getMonth());
                    payslipInfo.put("year", payslip.getYear());
                    payslipInfo.put("fileName", payslip.getFileName());
                    payslipInfo.put("arquivoCaminho", payslip.getArquivoCaminho());
                    payslipDetails.add(payslipInfo);
                }
                debug.put("payslips", payslipDetails);
            } else {
                debug.put("job", "Job nÃ£o encontrado");
            }
            
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            debug.put("error", e.getMessage());
            log.error("Erro ao obter informaÃ§Ãµes de debug para job {}", jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(debug);
        }
    }
    
    @GetMapping("/download/{unifiedDocumentId}")
    @Operation(
        summary = "Download de documento unificado",
        description = "Retorna URL assinada para download do PDF unificado"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "URL de download gerada",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "404", description = "Documento nÃ£o encontrado")
    })
    public ResponseEntity<Map<String, String>> downloadUnifiedDocument(
            @Parameter(description = "ID do documento unificado", required = true)
            @PathVariable UUID unifiedDocumentId) {
        
        try {
            String downloadUrl = processingService.getDownloadUrl(unifiedDocumentId);
            if (downloadUrl == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, String> response = Map.of(
                "downloadUrl", downloadUrl,
                "expiresIn", "3600"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erro ao gerar URL de download", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


