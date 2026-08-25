package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CompanyTypeOrganizationResponse;
import com.z7design.fleet_manager.dto.EnvioRequest;
import com.z7design.fleet_manager.dto.PayslipOrganizationResponse;
import com.z7design.fleet_manager.dto.PayslipProcessedFileResponse;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.repository.PayslipRepository;
import com.z7design.fleet_manager.service.PayslipProcessingService;
import com.z7design.fleet_manager.service.PayslipService;
import com.z7design.fleet_manager.service.ExtractDataHoleritesService;
import com.z7design.fleet_manager.util.AuthenticatedCpfResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/payslips")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payslip Management", description = "APIs for managing payslips")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class PayslipController {

    private final PayslipService payslipService;
    private final PayslipRepository payslipRepository;
    private final PayslipProcessingService payslipProcessingService;
    private final ExtractDataHoleritesService extractDataHoleritesService;
    private final AuthenticatedCpfResolver authenticatedCpfResolver;

    // ==================== ENDPOINTS UNIFICADOS ====================

    @PostMapping("/upload-and-send")
    @Operation(summary = "Upload, process and send payslips automatically")
    public ResponseEntity<PayslipProcessingService.ProcessingResult> uploadProcessAndSend(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipo") String tipo,
            @RequestParam(value = "assunto", required = false) String assunto,
            @RequestParam(value = "mensagem", required = false) String mensagem,
            @RequestParam(value = "funcionarioId", required = false) String funcionarioId,
            @RequestParam(value = "funcionarioIds", required = false) List<String> funcionarioIds) {
        
        log.info("ðŸš€ Recebendo upload e envio unificado: {} - Tipo: {}", file.getOriginalFilename(), tipo);
        
        try {
            // Criar request de envio
            EnvioRequest envioRequest = new EnvioRequest();
            envioRequest.setTipo(tipo);
            envioRequest.setAssunto(assunto);
            envioRequest.setMensagem(mensagem);
            envioRequest.setFuncionarioId(funcionarioId);
            envioRequest.setFuncionarioIds(funcionarioIds);
            
            // Processar e enviar
            PayslipProcessingService.ProcessingResult result = payslipProcessingService.uploadProcessAndSend(file, envioRequest);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("âŒ Erro no upload e envio unificado: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/upload-and-send-async")
    @Operation(summary = "Upload, process and send payslips asynchronously")
    public ResponseEntity<Map<String, Object>> uploadProcessAndSendAsync(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipo") String tipo,
            @RequestParam(value = "assunto", required = false) String assunto,
            @RequestParam(value = "mensagem", required = false) String mensagem,
            @RequestParam(value = "funcionarioId", required = false) String funcionarioId,
            @RequestParam(value = "funcionarioIds", required = false) List<String> funcionarioIds) {
        
        log.info("ðŸ”„ Recebendo upload e envio assÃ­ncrono: {} - Tipo: {}", file.getOriginalFilename(), tipo);
        
        try {
            // Gerar session ID
            String sessionId = UUID.randomUUID().toString();
            
            // Criar request de envio
            EnvioRequest envioRequest = new EnvioRequest();
            envioRequest.setTipo(tipo);
            envioRequest.setAssunto(assunto);
            envioRequest.setMensagem(mensagem);
            envioRequest.setFuncionarioId(funcionarioId);
            envioRequest.setFuncionarioIds(funcionarioIds);
            
            // Iniciar processamento assÃ­ncrono
            payslipProcessingService.processAsync(file, envioRequest);
            
            return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "status", "PROCESSING",
                "message", "Processamento iniciado. Use /api/payslips/status/{sessionId} para acompanhar o progresso."
            ));
            
        } catch (Exception e) {
            log.error("âŒ Erro no upload e envio assÃ­ncrono: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/status/{sessionId}")
    @Operation(summary = "Get processing status by session ID")
    public ResponseEntity<PayslipProcessingService.ProcessingStatus> getStatus(@PathVariable("sessionId") String sessionId) {
        log.info("ðŸ“Š Verificando status da sessÃ£o: {}", sessionId);
        
        PayslipProcessingService.ProcessingStatus status = payslipProcessingService.getStatus(sessionId);
        return ResponseEntity.ok(status);
    }

    // ==================== ENDPOINTS EXISTENTES ====================

    @PostMapping("/upload")
    @Operation(summary = "Upload and process one or more PDFs containing multiple payslips (up to 3 files)")
    public ResponseEntity<?> uploadPayslips(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        try {
            // Log inicial para debug
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.info("ðŸ“¥ RECEBENDO UPLOAD DE HOLERITES");
            log.info("   ParÃ¢metro 'file': {}", file != null ? file.getOriginalFilename() + " (" + file.getSize() + " bytes)" : "null");
            log.info("   ParÃ¢metro 'files': {}", files != null ? files.size() + " arquivo(s)" : "null");
            if (files != null && !files.isEmpty()) {
                for (int i = 0; i < files.size(); i++) {
                    MultipartFile f = files.get(i);
                    log.info("      [{}/{}] {} ({} bytes)", i + 1, files.size(), 
                        f != null ? f.getOriginalFilename() : "null", 
                        f != null ? f.getSize() : 0);
                }
            }
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            // Determinar quais arquivos processar
            List<MultipartFile> filesToProcess = new ArrayList<>();
            
            // Verificar se hÃ¡ mÃºltiplos arquivos no parÃ¢metro 'files'
            if (files != null && !files.isEmpty()) {
                log.info("ðŸ“¦ Recebidos {} arquivo(s) via parÃ¢metro 'files'", files.size());
                int validCount = 0;
                for (MultipartFile f : files) {
                    if (f != null && !f.isEmpty()) {
                        filesToProcess.add(f);
                        validCount++;
                        log.info("   âœ… Arquivo {} adicionado: {} ({} bytes)", validCount, f.getOriginalFilename(), f.getSize());
                    } else {
                        log.warn("   âš ï¸ Arquivo nulo ou vazio ignorado na lista 'files'");
                    }
                }
                log.info("   ðŸ“Š Total de arquivos vÃ¡lidos em 'files': {}/{}", validCount, files.size());
            }
            
            // Se nÃ£o encontrou arquivos em 'files', verificar 'file' (compatibilidade)
            if (filesToProcess.isEmpty()) {
                if (file != null && !file.isEmpty()) {
                    log.info("ðŸ“¦ Recebido 1 arquivo via parÃ¢metro 'file': {} ({} bytes)", file.getOriginalFilename(), file.getSize());
                    filesToProcess.add(file);
                } else {
                    log.warn("âš ï¸ Nenhum arquivo vÃ¡lido encontrado nem em 'files' nem em 'file'");
                }
            }
            
            // ValidaÃ§Ã£o crÃ­tica: garantir que temos arquivos para processar
            if (filesToProcess.isEmpty()) {
                log.error("âŒ CRÃTICO: Nenhum arquivo vÃ¡lido para processar apÃ³s validaÃ§Ã£o!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                        "error", "Nenhum arquivo vÃ¡lido fornecido",
                        "message", "Ã‰ necessÃ¡rio fornecer pelo menos um arquivo vÃ¡lido",
                        "debug", Map.of(
                            "fileParam", file != null ? "presente" : "ausente",
                            "filesParam", files != null ? files.size() + " arquivo(s)" : "ausente"
                        )
                    ));
            }
            
            log.info("âœ… Total de arquivos vÃ¡lidos para processar: {}", filesToProcess.size());
            
            // Validar quantidade mÃ¡xima (atÃ© 3 arquivos por usuÃ¡rio para manter performance e precisÃ£o)
            if (filesToProcess.size() > 3) {
                log.warn("âš ï¸ Muitos arquivos recebidos: {} (mÃ¡ximo 3 permitidos)", filesToProcess.size());
                log.warn("   Processando apenas os primeiros 3 arquivos");
                filesToProcess = new ArrayList<>(filesToProcess.subList(0, 3));
            }
            
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.info("ðŸ“¤ INICIANDO PROCESSAMENTO DE {} ARQUIVO(S)", filesToProcess.size());
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            for (int i = 0; i < filesToProcess.size(); i++) {
                MultipartFile f = filesToProcess.get(i);
                log.info("   [{}/{}] {} ({} bytes)", i + 1, filesToProcess.size(), f.getOriginalFilename(), f.getSize());
            }
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            
            // Processar arquivos SEQUENCIALMENTE (um por vez) para garantir precisÃ£o
            List<Payslip> allPayslips = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            int totalPages = 0;
            int totalFilesProcessed = 0;
            int filesBlocked = 0; // Contador para arquivos bloqueados
            Map<String, Integer> pagesPerFile = new HashMap<>();
            
            // Usar filesToProcess diretamente (jÃ¡ validados acima)
            List<MultipartFile> validFiles = filesToProcess;
            
            // Processar arquivos SEQUENCIALMENTE (um por vez) para garantir precisÃ£o e evitar problemas de memÃ³ria
            log.info("ðŸ“Š Processando {} arquivo(s) vÃ¡lido(s) SEQUENCIALMENTE (um por vez)", validFiles.size());
            log.info("   â„¹ï¸ Cada arquivo serÃ¡ processado completamente antes de iniciar o prÃ³ximo");
            log.info("   â„¹ï¸ Processamento sequencial garante precisÃ£o e evita problemas de memÃ³ria");
            
            for (int i = 0; i < validFiles.size(); i++) {
                MultipartFile f = validFiles.get(i);
                String originalFilename = f.getOriginalFilename();
                
                try {
                    log.info("");
                    log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                    log.info("ðŸ“¤ ARQUIVO [{}/{}]: {}", i + 1, validFiles.size(), originalFilename);
                    log.info("   Tamanho: {} bytes", f.getSize());
                    log.info("   Iniciando processamento...");
                    log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                    
                    // Carregar arquivo em memÃ³ria para verificaÃ§Ã£o de hash
                    byte[] fileBytes = f.getBytes();
                    
                    // Garantir que o arquivo ainda estÃ¡ acessÃ­vel
                    if (fileBytes.length == 0) {
                        throw new IllegalArgumentException("Arquivo estÃ¡ vazio apÃ³s carregamento");
                    }
                    
                    // Verificar se o arquivo completo jÃ¡ foi processado anteriormente
                    log.info("ðŸ” Verificando se arquivo jÃ¡ foi processado anteriormente...");
                    boolean alreadyProcessed = payslipService.isFileAlreadyProcessed(fileBytes, originalFilename);
                    log.info("   Resultado da verificaÃ§Ã£o: {}", alreadyProcessed ? "JÃ PROCESSADO - BLOQUEANDO" : "NÃƒO PROCESSADO - PERMITINDO");
                    
                    if (alreadyProcessed) {
                        log.warn("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                        log.warn("âš ï¸ [{}/{}] ARQUIVO JÃ PROCESSADO - BLOQUEANDO PROCESSAMENTO", 
                            i + 1, validFiles.size());
                        log.warn("   Arquivo: {}", originalFilename);
                        log.warn("   Status: JÃ¡ foi processado anteriormente e nÃ£o foi excluÃ­do do sistema.");
                        log.warn("   AÃ§Ã£o: Arquivo NÃƒO serÃ¡ processado novamente.");
                        log.warn("   â„¹ï¸ Se o arquivo foi modificado, o sistema detectarÃ¡ automaticamente e criarÃ¡ uma nova versÃ£o.");
                        log.warn("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
                        errors.add("Arquivo " + originalFilename + ": JÃ¡ foi processado anteriormente. Se houver alteraÃ§Ãµes no conteÃºdo, uma nova versÃ£o serÃ¡ criada automaticamente.");
                        pagesPerFile.put(originalFilename, 0);
                        filesBlocked++; // Incrementar contador de arquivos bloqueados
                        continue; // Pular para o prÃ³ximo arquivo - NÃƒO PROCESSAR
                    }
                    
                    log.info("âœ… Arquivo nÃ£o foi processado anteriormente ou foi modificado. Processando...");
                    
                    long startTime = System.currentTimeMillis();
                    
                    log.info("   ðŸ”„ Chamando processPayslipPDF para arquivo: {} ({} bytes)", originalFilename, fileBytes.length);
                    List<Payslip> payslips = payslipService.processPayslipPDF(f);
                    long processingTime = System.currentTimeMillis() - startTime;
                    
                    log.info("   ðŸ“Š Resultado do processamento: {} holerite(s) retornado(s)", 
                        payslips != null ? payslips.size() : 0);
                    
                    if (payslips == null || payslips.isEmpty()) {
                        log.warn("âš ï¸ [{}/{}] Arquivo {} processado mas nenhum holerite foi extraÃ­do", 
                            i + 1, validFiles.size(), originalFilename);
                        errors.add("Arquivo " + originalFilename + ": Nenhum holerite extraÃ­do (pode estar vazio ou corrompido)");
                        pagesPerFile.put(originalFilename, 0);
                    } else {
                        allPayslips.addAll(payslips);
                        int pagesInFile = payslips.size();
                        totalPages += pagesInFile;
                        totalFilesProcessed++;
                        pagesPerFile.put(originalFilename, pagesInFile);
                        
                        log.info("âœ… [{}/{}] Arquivo {} processado com SUCESSO:", 
                            i + 1, validFiles.size(), originalFilename);
                        log.info("   ðŸ“„ Holerites extraÃ­dos: {}", pagesInFile);
                        log.info("   â±ï¸ Tempo de processamento: {}ms ({})", 
                            processingTime, String.format("%.2f", processingTime / 1000.0) + "s");
                        log.info("   âœ… Arquivo concluÃ­do - PrÃ³ximo arquivo serÃ¡ processado agora");
                    }
                } catch (Exception e) {
                    log.error("âŒ [{}/{}] ERRO ao processar arquivo {}: {}", 
                        i + 1, validFiles.size(), originalFilename, e.getMessage(), e);
                    errors.add("Erro ao processar " + originalFilename + ": " + e.getMessage());
                    pagesPerFile.put(originalFilename, 0);
                    // CONTINUAR processando prÃ³ximos arquivos mesmo se este falhar
                    log.info("   â­ï¸ Continuando com prÃ³ximo arquivo...");
                }
            }
            
            log.info("");
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.info("ðŸ“Š RESUMO FINAL DO PROCESSAMENTO DE TODOS OS ARQUIVOS:");
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            log.info("   ðŸ“ Total de arquivos recebidos: {}", filesToProcess.size());
            log.info("   âœ… Arquivos processados com sucesso: {}/{}", totalFilesProcessed, validFiles.size());
            log.info("   ðŸš« Arquivos bloqueados (jÃ¡ processados): {}", filesBlocked);
            log.info("   ðŸ“„ Total de holerites extraÃ­dos: {}", allPayslips.size());
            log.info("   ðŸ“‘ Total de PÃGINAS processadas em TODOS os arquivos: {}", totalPages);
            log.info("   âš ï¸ Erros encontrados: {}", errors.size());
            log.info("");
            log.info("   ðŸ“‹ DETALHAMENTO POR ARQUIVO:");
            for (Map.Entry<String, Integer> entry : pagesPerFile.entrySet()) {
                log.info("      â€¢ {}: {} pÃ¡gina(s)/holerite(s)", entry.getKey(), entry.getValue());
            }
            log.info("â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”");
            
            if (allPayslips.isEmpty() && !errors.isEmpty()) {
                log.warn("âš ï¸ Nenhum holerite foi processado dos arquivos enviados, mas erros foram encontrados.");
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Nenhum holerite foi processado. Verifique os erros.");
                response.put("payslips", Collections.emptyList());
                response.put("errors", errors);
                response.put("totalPayslips", 0);
                response.put("totalPages", 0);
                response.put("totalFiles", filesToProcess.size());
                response.put("filesProcessed", totalFilesProcessed);
                response.put("filesBlocked", filesBlocked);
                response.put("pagesPerFile", pagesPerFile);
                return ResponseEntity.ok(response);
            } else if (allPayslips.isEmpty()) {
                log.warn("âš ï¸ Nenhum holerite foi processado dos arquivos enviados");
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Nenhum holerite foi processado");
                response.put("payslips", Collections.emptyList());
                response.put("warning", "Os arquivos podem estar vazios, corrompidos ou nÃ£o conter holerites vÃ¡lidos");
                if (!errors.isEmpty()) {
                    response.put("errors", errors);
                }
                response.put("filesBlocked", filesBlocked);
                return ResponseEntity.ok(response);
            }
            
            // Preparar resposta com informaÃ§Ãµes detalhadas
            Map<String, Object> response = new HashMap<>();
            response.put("payslips", allPayslips);
            response.put("totalPayslips", allPayslips.size());
            response.put("totalPages", totalPages); // Total de pÃ¡ginas processadas em TODOS os arquivos
            response.put("totalFiles", filesToProcess.size());
            response.put("filesProcessed", totalFilesProcessed);
            response.put("filesBlocked", filesBlocked);
            response.put("pagesPerFile", pagesPerFile);
            
            // Sempre incluir erros na resposta (mesmo que vazio) para o frontend saber
            if (!errors.isEmpty()) {
                response.put("errors", errors);
                response.put("message", "Processamento concluÃ­do com alguns avisos/erros. " + allPayslips.size() + " holerite(s) extraÃ­do(s).");
            } else {
                response.put("message", "Processamento concluÃ­do com sucesso! " + allPayslips.size() + " holerite(s) extraÃ­do(s) de " + totalPages + " pÃ¡gina(s) em " + totalFilesProcessed + " arquivo(s)");
            }
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("âŒ Erro de validaÃ§Ã£o ao processar upload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Erro de validaÃ§Ã£o", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("âŒ Erro inesperado ao processar upload de holerite: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro interno", "message", "Erro ao processar o arquivo: " + e.getMessage()));
        }
    }

    @PostMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugPayslip(@RequestParam("file") MultipartFile file) throws IOException {
        log.info("Debug: Analisando conteÃºdo do PDF: {}", file.getOriginalFilename());
        Map<String, Object> debugInfo = payslipService.debugPayslipContent(file);
        return ResponseEntity.ok(debugInfo);
    }

    @GetMapping
    public ResponseEntity<List<Payslip>> getAllPayslips() {
        log.info("ðŸ” Iniciando busca de todos os payslips...");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
        Optional<String> resolvedCpf = authenticatedCpfResolver.resolve(auth);
        List<Payslip> payslips;
        if (isColaborador) {
            if (resolvedCpf.isEmpty()) {
                log.warn("âš ï¸ NÃ£o foi possÃ­vel determinar o CPF do colaborador {}", auth.getName());
                payslips = Collections.emptyList();
            } else {
                log.info("ðŸ‘¤ UsuÃ¡rio colaborador, buscando payslips por CPF: {}", resolvedCpf.get());
                payslips = payslipService.getPayslipsByCpf(resolvedCpf.get());
            }
        } else {
            log.info("ðŸ‘‘ UsuÃ¡rio admin, buscando todos os payslips");
            payslips = payslipService.getAllPayslips();
        }
        log.info("âœ… Payslips encontrados: {} registros", payslips.size());
        if (payslips.size() > 0) {
            log.info("ðŸ“‹ Primeiro payslip: ID={}, Nome={}, CPF={}, MÃªs={}, Ano={}", 
                payslips.get(0).getId(), payslips.get(0).getEmployeeName(), 
                payslips.get(0).getCpf(), payslips.get(0).getMonth(), payslips.get(0).getYear());
        }
        return ResponseEntity.ok(payslips);
    }

    @GetMapping("/organization")
    public ResponseEntity<PayslipOrganizationResponse> getPayslipOrganization() {
        try {
            log.info("ðŸ“Š Iniciando organizaÃ§Ã£o de holerites por empresa/setor/perÃ­odo...");
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null) {
                log.error("AutenticaÃ§Ã£o Ã© null ao organizar holerites");
                PayslipOrganizationResponse emptyResponse = new PayslipOrganizationResponse();
                emptyResponse.setCompanies(Collections.emptyList());
                emptyResponse.setTotalCompanies(0);
                emptyResponse.setTotalSectors(0);
                emptyResponse.setTotalPayslips(0);
                emptyResponse.setGeneratedAt(java.time.LocalDateTime.now());
                return ResponseEntity.ok(emptyResponse);
            }
            
            boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
            Optional<String> resolvedCpf = authenticatedCpfResolver.resolve(auth);

            List<Payslip> payslips;
            try {
                if (isColaborador) {
                    if (resolvedCpf.isEmpty()) {
                        log.warn("âš ï¸ NÃ£o foi possÃ­vel determinar o CPF do colaborador {} para organizaÃ§Ã£o de holerites", auth.getName());
                        payslips = Collections.emptyList();
                    } else {
                        log.info("ðŸ‘¤ UsuÃ¡rio colaborador, organizando holerites por CPF: {}", resolvedCpf.get());
                        payslips = payslipService.getPayslipsByCpf(resolvedCpf.get());
                    }
                } else {
                    log.info("ðŸ‘‘ UsuÃ¡rio admin, organizando todos os holerites por empresa");
                    payslips = payslipService.getAllPayslips();
                }
            } catch (org.springframework.dao.DataAccessException e) {
                log.error("Erro de acesso ao banco de dados ao buscar holerites: {}", e.getMessage(), e);
                payslips = Collections.emptyList();
            } catch (Exception e) {
                log.error("Erro ao buscar holerites: {}", e.getMessage(), e);
                payslips = Collections.emptyList();
            }

            try {
                PayslipOrganizationResponse response = payslipService.organizePayslipsByCompany(payslips);
                log.info("âœ… OrganizaÃ§Ã£o concluÃ­da: {} empresas, {} setores, {} holerites",
                    response.getTotalCompanies(), response.getTotalSectors(), response.getTotalPayslips());
                return ResponseEntity.ok(response);
            } catch (org.springframework.dao.DataAccessException e) {
                log.error("Erro de acesso ao banco de dados ao organizar holerites: {}", e.getMessage(), e);
                PayslipOrganizationResponse emptyResponse = new PayslipOrganizationResponse();
                emptyResponse.setCompanies(Collections.emptyList());
                emptyResponse.setTotalCompanies(0);
                emptyResponse.setTotalSectors(0);
                emptyResponse.setTotalPayslips(0);
                emptyResponse.setGeneratedAt(java.time.LocalDateTime.now());
                return ResponseEntity.ok(emptyResponse);
            } catch (Exception e) {
                log.error("Erro ao organizar holerites: {}", e.getMessage(), e);
                PayslipOrganizationResponse emptyResponse = new PayslipOrganizationResponse();
                emptyResponse.setCompanies(Collections.emptyList());
                emptyResponse.setTotalCompanies(0);
                emptyResponse.setTotalSectors(0);
                emptyResponse.setTotalPayslips(0);
                emptyResponse.setGeneratedAt(java.time.LocalDateTime.now());
                return ResponseEntity.ok(emptyResponse);
            }
        } catch (Exception e) {
            log.error("Erro geral ao organizar holerites: {}", e.getMessage(), e);
            // Retornar resposta vazia ao invÃ©s de erro 500 para nÃ£o quebrar o frontend
            PayslipOrganizationResponse emptyResponse = new PayslipOrganizationResponse();
            emptyResponse.setCompanies(Collections.emptyList());
            emptyResponse.setTotalCompanies(0);
            emptyResponse.setTotalSectors(0);
            emptyResponse.setTotalPayslips(0);
            emptyResponse.setGeneratedAt(java.time.LocalDateTime.now());
            return ResponseEntity.ok(emptyResponse);
        }
    }

    @GetMapping("/organization-by-type")
    @Operation(summary = "Organizar holerites por tipo de empresa", description = "Organiza holerites por tipo (TerceirizaÃ§Ã£o vs VigilÃ¢ncia e ADM), depois por empresa, setor e perÃ­odo")
    public ResponseEntity<CompanyTypeOrganizationResponse> getPayslipOrganizationByType() {
        try {
            log.info("ðŸ“Š Iniciando organizaÃ§Ã£o de holerites por tipo de empresa...");
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null) {
                log.error("AutenticaÃ§Ã£o Ã© null ao organizar holerites por tipo");
                CompanyTypeOrganizationResponse emptyResponse = new CompanyTypeOrganizationResponse();
                emptyResponse.setGeneratedAt(java.time.LocalDateTime.now());
                emptyResponse.setTotalPayslips(0);
                emptyResponse.setTotalCompanies(0);
                emptyResponse.setTotalSectors(0);
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyTerceirizacao = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyTerceirizacao.setTypeName("TerceirizaÃ§Ã£o");
                emptyTerceirizacao.setTypeCode("TERCEIRIZACAO");
                emptyTerceirizacao.setTotalCompanies(0);
                emptyTerceirizacao.setTotalPayslips(0);
                emptyTerceirizacao.setTotalSectors(0);
                emptyTerceirizacao.setCompanies(Collections.emptyList());
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyVigilancia = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyVigilancia.setTypeName("VigilÃ¢ncia");
                emptyVigilancia.setTypeCode("VIGILANCIA");
                emptyVigilancia.setTotalCompanies(0);
                emptyVigilancia.setTotalPayslips(0);
                emptyVigilancia.setTotalSectors(0);
                emptyVigilancia.setCompanies(Collections.emptyList());
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyAdministrativo = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyAdministrativo.setTypeName("Administrativo");
                emptyAdministrativo.setTypeCode("ADMINISTRATIVO");
                emptyAdministrativo.setTotalCompanies(0);
                emptyAdministrativo.setTotalPayslips(0);
                emptyAdministrativo.setTotalSectors(0);
                emptyAdministrativo.setCompanies(Collections.emptyList());
                
                emptyResponse.setTerceirizacao(emptyTerceirizacao);
                emptyResponse.setVigilancia(emptyVigilancia);
                emptyResponse.setAdministrativo(emptyAdministrativo);
                return ResponseEntity.ok(emptyResponse);
            }
            
            boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
            Optional<String> resolvedCpf = authenticatedCpfResolver.resolve(auth);

            List<Payslip> payslips;
            try {
                if (isColaborador) {
                    if (resolvedCpf.isEmpty()) {
                        log.warn("âš ï¸ NÃ£o foi possÃ­vel determinar o CPF do colaborador {} para organizaÃ§Ã£o por tipo", auth.getName());
                        payslips = Collections.emptyList();
                    } else {
                        log.info("ðŸ‘¤ UsuÃ¡rio colaborador, organizando holerites por CPF: {}", resolvedCpf.get());
                        payslips = payslipService.getPayslipsByCpf(resolvedCpf.get());
                    }
                } else {
                    log.info("ðŸ‘‘ UsuÃ¡rio admin, organizando todos os holerites por tipo");
                    payslips = payslipService.getAllPayslips();
                }
            } catch (org.springframework.dao.DataAccessException e) {
                log.error("Erro de acesso ao banco de dados ao buscar holerites por tipo: {}", e.getMessage(), e);
                payslips = Collections.emptyList();
            } catch (Exception e) {
                log.error("Erro ao buscar holerites por tipo: {}", e.getMessage(), e);
                payslips = Collections.emptyList();
            }

            try {
                CompanyTypeOrganizationResponse response = payslipService.organizePayslipsByCompanyType(payslips);
                log.info("âœ… OrganizaÃ§Ã£o por tipo concluÃ­da: {} holerites, {} empresas, {} setores",
                    response.getTotalPayslips(), response.getTotalCompanies(), response.getTotalSectors());
                return ResponseEntity.ok(response);
            } catch (org.springframework.dao.DataAccessException e) {
                log.error("Erro de acesso ao banco de dados ao organizar holerites por tipo: {}", e.getMessage(), e);
                CompanyTypeOrganizationResponse emptyResponse = new CompanyTypeOrganizationResponse();
                emptyResponse.setGeneratedAt(java.time.LocalDateTime.now());
                emptyResponse.setTotalPayslips(0);
                emptyResponse.setTotalCompanies(0);
                emptyResponse.setTotalSectors(0);
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyTerceirizacao = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyTerceirizacao.setTypeName("TerceirizaÃ§Ã£o");
                emptyTerceirizacao.setTypeCode("TERCEIRIZACAO");
                emptyTerceirizacao.setTotalCompanies(0);
                emptyTerceirizacao.setTotalPayslips(0);
                emptyTerceirizacao.setTotalSectors(0);
                emptyTerceirizacao.setCompanies(Collections.emptyList());
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyVigilancia = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyVigilancia.setTypeName("VigilÃ¢ncia");
                emptyVigilancia.setTypeCode("VIGILANCIA");
                emptyVigilancia.setTotalCompanies(0);
                emptyVigilancia.setTotalPayslips(0);
                emptyVigilancia.setTotalSectors(0);
                emptyVigilancia.setCompanies(Collections.emptyList());
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyAdministrativo = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyAdministrativo.setTypeName("Administrativo");
                emptyAdministrativo.setTypeCode("ADMINISTRATIVO");
                emptyAdministrativo.setTotalCompanies(0);
                emptyAdministrativo.setTotalPayslips(0);
                emptyAdministrativo.setTotalSectors(0);
                emptyAdministrativo.setCompanies(Collections.emptyList());
                
                emptyResponse.setTerceirizacao(emptyTerceirizacao);
                emptyResponse.setVigilancia(emptyVigilancia);
                emptyResponse.setAdministrativo(emptyAdministrativo);
                return ResponseEntity.ok(emptyResponse);
            } catch (Exception e) {
                log.error("Erro ao organizar holerites por tipo: {}", e.getMessage(), e);
                CompanyTypeOrganizationResponse emptyResponse = new CompanyTypeOrganizationResponse();
                emptyResponse.setGeneratedAt(java.time.LocalDateTime.now());
                emptyResponse.setTotalPayslips(0);
                emptyResponse.setTotalCompanies(0);
                emptyResponse.setTotalSectors(0);
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyTerceirizacao = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyTerceirizacao.setTypeName("TerceirizaÃ§Ã£o");
                emptyTerceirizacao.setTypeCode("TERCEIRIZACAO");
                emptyTerceirizacao.setTotalCompanies(0);
                emptyTerceirizacao.setTotalPayslips(0);
                emptyTerceirizacao.setTotalSectors(0);
                emptyTerceirizacao.setCompanies(Collections.emptyList());
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyVigilancia = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyVigilancia.setTypeName("VigilÃ¢ncia");
                emptyVigilancia.setTypeCode("VIGILANCIA");
                emptyVigilancia.setTotalCompanies(0);
                emptyVigilancia.setTotalPayslips(0);
                emptyVigilancia.setTotalSectors(0);
                emptyVigilancia.setCompanies(Collections.emptyList());
                
                CompanyTypeOrganizationResponse.CompanyTypeGroup emptyAdministrativo = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
                emptyAdministrativo.setTypeName("Administrativo");
                emptyAdministrativo.setTypeCode("ADMINISTRATIVO");
                emptyAdministrativo.setTotalCompanies(0);
                emptyAdministrativo.setTotalPayslips(0);
                emptyAdministrativo.setTotalSectors(0);
                emptyAdministrativo.setCompanies(Collections.emptyList());
                
                emptyResponse.setTerceirizacao(emptyTerceirizacao);
                emptyResponse.setVigilancia(emptyVigilancia);
                emptyResponse.setAdministrativo(emptyAdministrativo);
                return ResponseEntity.ok(emptyResponse);
            }
        } catch (Exception e) {
            log.error("Erro geral ao organizar holerites por tipo: {}", e.getMessage(), e);
            CompanyTypeOrganizationResponse emptyResponse = new CompanyTypeOrganizationResponse();
            emptyResponse.setGeneratedAt(java.time.LocalDateTime.now());
            emptyResponse.setTotalPayslips(0);
            emptyResponse.setTotalCompanies(0);
            emptyResponse.setTotalSectors(0);
            
            CompanyTypeOrganizationResponse.CompanyTypeGroup emptyTerceirizacao = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            emptyTerceirizacao.setTypeName("TerceirizaÃ§Ã£o");
            emptyTerceirizacao.setTypeCode("TERCEIRIZACAO");
            emptyTerceirizacao.setTotalCompanies(0);
            emptyTerceirizacao.setTotalPayslips(0);
            emptyTerceirizacao.setTotalSectors(0);
            emptyTerceirizacao.setCompanies(Collections.emptyList());
            
            CompanyTypeOrganizationResponse.CompanyTypeGroup emptyVigilancia = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            emptyVigilancia.setTypeName("VigilÃ¢ncia");
            emptyVigilancia.setTypeCode("VIGILANCIA");
            emptyVigilancia.setTotalCompanies(0);
            emptyVigilancia.setTotalPayslips(0);
            emptyVigilancia.setTotalSectors(0);
            emptyVigilancia.setCompanies(Collections.emptyList());
            
            CompanyTypeOrganizationResponse.CompanyTypeGroup emptyAdministrativo = new CompanyTypeOrganizationResponse.CompanyTypeGroup();
            emptyAdministrativo.setTypeName("Administrativo");
            emptyAdministrativo.setTypeCode("ADMINISTRATIVO");
            emptyAdministrativo.setTotalCompanies(0);
            emptyAdministrativo.setTotalPayslips(0);
            emptyAdministrativo.setTotalSectors(0);
            emptyAdministrativo.setCompanies(Collections.emptyList());
            
            emptyResponse.setTerceirizacao(emptyTerceirizacao);
            emptyResponse.setVigilancia(emptyVigilancia);
            emptyResponse.setAdministrativo(emptyAdministrativo);
            return ResponseEntity.ok(emptyResponse);
        }
    }

    @GetMapping("/processed-files")
    public ResponseEntity<Map<String, Object>> getProcessedPayslipFiles() {
        log.info("ðŸ“‚ Solicitando lista de holerites processados");
        try {
            List<PayslipProcessedFileResponse> files = payslipService.getProcessedPayslipFiles();

            Map<String, Object> body = new HashMap<>();
            body.put("success", true);
            body.put("total", files.size());
            body.put("files", files);

            log.info("ðŸ“‚ Retornando {} holerites processados", files.size());
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            log.error("âŒ Erro ao listar holerites processados: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Erro ao listar holerites processados");
            error.put("details", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/download/{fileName}")
    @Operation(summary = "Download individual payslip file by fileName (deprecated - use /download-by-id/{id})")
    public ResponseEntity<Resource> downloadPayslip(@PathVariable("fileName") String fileName) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
            Optional<String> resolvedCpf = authenticatedCpfResolver.resolve(auth);
            
            log.info("ðŸ“¥ Tentando baixar arquivo: {}", fileName);
            Payslip payslip = payslipService.getPayslipByFileName(fileName);
            
            if (payslip == null) {
                log.error("âŒ Payslip nÃ£o encontrado para o arquivo: {}", fileName);
                return ResponseEntity.notFound().build();
            }
            
            log.info("âœ… Payslip encontrado: ID={}, CPF={}, Nome={}, Arquivo={}", 
                payslip.getId(), payslip.getCpf(), payslip.getEmployeeName(), payslip.getFileName());
            
            if (isColaborador) {
                Optional<String> payslipCpf = authenticatedCpfResolver.normalizeCpf(payslip.getCpf());
                if (resolvedCpf.isEmpty() || payslipCpf.isEmpty() || !resolvedCpf.get().equals(payslipCpf.get())) {
                    log.warn("âš ï¸ Acesso negado: CPF do usuÃ¡rio ({}) nÃ£o corresponde ao CPF do payslip ({})", 
                        resolvedCpf.orElse("null"), payslipCpf.orElse("null"));
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }
            
            Path filePath = resolvePayslipPath(payslip, fileName);
            log.info("ðŸ“„ Caminho resolvido: {}", filePath.toAbsolutePath());
            
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                log.info("âœ… Arquivo encontrado e legÃ­vel: {}", filePath.toAbsolutePath());
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(resource);
            } else {
                log.error("âŒ Arquivo nÃ£o encontrado ou nÃ£o legÃ­vel: {} em {}", fileName, filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            log.error("âŒ Erro ao acessar arquivo: {}", fileName, e);
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            log.error("âŒ Erro inesperado ao baixar arquivo: {}", fileName, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/download-by-id/{id}")
    @Operation(summary = "Download individual payslip file by ID (recommended)")
    public ResponseEntity<Resource> downloadPayslipById(@PathVariable("id") String id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
            Optional<String> resolvedCpf = authenticatedCpfResolver.resolve(auth);
            
            log.info("ðŸ“¥ Tentando baixar payslip pelo ID: {}", id);
            
            java.util.UUID payslipId;
            try {
                payslipId = java.util.UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                log.error("âŒ ID invÃ¡lido: {}", id);
                return ResponseEntity.badRequest().build();
            }
            
            Payslip payslip = payslipService.getPayslipById(payslipId);
            
            if (payslip == null) {
                log.error("âŒ Payslip nÃ£o encontrado para o ID: {}", id);
                return ResponseEntity.notFound().build();
            }
            
            log.info("âœ… Payslip encontrado: ID={}, CPF={}, Nome={}, Arquivo={}", 
                payslip.getId(), payslip.getCpf(), payslip.getEmployeeName(), payslip.getFileName());
            
            if (isColaborador) {
                Optional<String> payslipCpf = authenticatedCpfResolver.normalizeCpf(payslip.getCpf());
                if (resolvedCpf.isEmpty() || payslipCpf.isEmpty() || !resolvedCpf.get().equals(payslipCpf.get())) {
                    log.warn("âš ï¸ Acesso negado: CPF do usuÃ¡rio ({}) nÃ£o corresponde ao CPF do payslip ({})", 
                        resolvedCpf.orElse("null"), payslipCpf.orElse("null"));
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }
            
            String fileName = payslip.getFileName();
            Path filePath = resolvePayslipPath(payslip, fileName);
            log.info("ðŸ“„ Caminho resolvido: {}", filePath.toAbsolutePath());
            
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                log.info("âœ… Arquivo encontrado e legÃ­vel: {}", filePath.toAbsolutePath());
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(resource);
            } else {
                log.error("âŒ Arquivo nÃ£o encontrado ou nÃ£o legÃ­vel: {} em {}", fileName, filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            log.error("âŒ Erro ao acessar arquivo: {}", id, e);
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            log.error("âŒ Erro inesperado ao baixar arquivo: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }


    @RequestMapping(value = "/test-download/{fileName}", method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> testDownloadOptions(@PathVariable("fileName") String fileName) {
        return ResponseEntity.ok().build();
    }

    // Endpoint de teste temporÃ¡rio sem autenticaÃ§Ã£o
    @GetMapping("/test-download/{fileName}")
    @Operation(summary = "Test download individual payslip file without authentication")
    public ResponseEntity<Resource> testDownloadPayslip(@PathVariable("fileName") String fileName) {
        try {
            log.info("Teste de download: {}", fileName);
            
            // Tentar diferentes caminhos possÃ­veis
            Path filePath = findPayslipFile(fileName);
            
            log.info("Tentando acessar arquivo em: {}", filePath);
            
            if (filePath != null && java.nio.file.Files.exists(filePath)) {
                Resource resource = new UrlResource(filePath.toUri());
                if (resource.exists() && resource.isReadable()) {
                    log.info("Arquivo encontrado e legÃ­vel: {}", fileName);
                    return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                        .body(resource);
                }
            }
            
            log.warn("Arquivo nÃ£o encontrado ou nÃ£o legÃ­vel: {} em {}", fileName, filePath);
            return ResponseEntity.notFound().build();
            
        } catch (MalformedURLException e) {
            log.error("Erro ao acessar arquivo: {}", fileName, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private Path resolvePayslipPath(Payslip payslip, String fileName) throws MalformedURLException {
        Path filePath = null;

        // PRIORIDADE 1: Usar arquivo_caminho se disponÃ­vel (mais confiÃ¡vel)
        if (payslip != null && payslip.getArquivoCaminho() != null && !payslip.getArquivoCaminho().isEmpty()) {
            filePath = Paths.get(payslip.getArquivoCaminho());
            if (java.nio.file.Files.exists(filePath)) {
                log.debug("ðŸ“„ Usando arquivo_caminho do banco: {}", filePath);
                return filePath;
            } else {
                log.warn("âš ï¸ arquivo_caminho do banco nÃ£o existe: {}", payslip.getArquivoCaminho());
            }
        }

        // PRIORIDADE 2: Resolver pelo CPF, mÃªs e ano
        if (payslip != null && payslip.getCpf() != null && payslip.getMonth() != null && payslip.getYear() != null) {
            filePath = payslipService.resolvePayslipPathByCpfMonthYear(
                    payslip.getCpf(),
                    payslip.getMonth(),
                    payslip.getYear()
            ).map(Paths::get).orElse(null);
        }

        // PRIORIDADE 3: Fallback - buscar pelo nome do arquivo
        if (filePath == null || !java.nio.file.Files.exists(filePath)) {
            filePath = findPayslipFile(fileName);
        }

        if (filePath == null || !java.nio.file.Files.exists(filePath)) {
            log.error("âŒ Arquivo nÃ£o encontrado: {} - Payslip: {}", fileName, payslip != null ? payslip.getId() : "null");
            throw new MalformedURLException("Arquivo nÃ£o encontrado nos diretÃ³rios configurados: " + fileName);
        }

        return filePath;
    }
    
    private Path findPayslipFile(String fileName) {
        String uploadDir = System.getProperty("payslips.upload.dir", "uploads/payslips");
        Path filePath = Paths.get(uploadDir, fileName);
        
        if (java.nio.file.Files.exists(filePath)) {
            return filePath;
        }
        
        filePath = Paths.get("backend/payslips_output", fileName);
        if (java.nio.file.Files.exists(filePath)) {
            return filePath;
        }
        
        filePath = Paths.get("backend/holerites", fileName);
        if (java.nio.file.Files.exists(filePath)) {
            return filePath;
        }
        
        Path holeritesDir = Paths.get("backend/holerites");
        if (java.nio.file.Files.exists(holeritesDir)) {
            try {
                for (Path subDir : java.nio.file.Files.list(holeritesDir).toList()) {
                    if (java.nio.file.Files.isDirectory(subDir)) {
                        Path potentialFile = subDir.resolve(fileName);
                        if (java.nio.file.Files.exists(potentialFile)) {
                            return potentialFile;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Erro ao buscar em subpastas: {}", e.getMessage());
            }
        }
        
        return null;
    }

    // ExclusÃ£o individual de payslip
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayslip(@PathVariable("id") UUID id) {
        try {
            payslipService.deletePayslip(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao excluir payslip: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ExclusÃ£o em massa de payslips
    @PostMapping("/delete-multiple")
    public ResponseEntity<Map<String, Object>> deleteMultiplePayslips(@RequestBody Map<String, List<String>> body) {
        try {
            List<String> idStrings = body.get("ids");
            if (idStrings == null || idStrings.isEmpty()) {
                Map<String, Object> result = new HashMap<>();
                result.put("deleted", 0);
                result.put("failed", 0);
                result.put("errors", List.of());
                return ResponseEntity.ok(result);
            }
            
            log.info("ðŸ—‘ï¸ Tentando excluir {} payslips", idStrings.size());
            
            // Converter IDs para UUID com validaÃ§Ã£o individual
            List<UUID> validIds = new ArrayList<>();
            List<String> invalidIds = new ArrayList<>();
            
            for (String idString : idStrings) {
                try {
                    UUID uuid = UUID.fromString(idString);
                    validIds.add(uuid);
                } catch (IllegalArgumentException e) {
                    log.warn("ID invÃ¡lido encontrado: {} - {}", idString, e.getMessage());
                    invalidIds.add(idString);
                }
            }
            
            // Se todos os IDs sÃ£o invÃ¡lidos, retornar erro
            if (validIds.isEmpty()) {
                log.error("Todos os IDs fornecidos sÃ£o invÃ¡lidos: {}", invalidIds);
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("deleted", 0);
                errorResult.put("failed", idStrings.size());
                errorResult.put("errors", List.of("Todos os IDs fornecidos sÃ£o invÃ¡lidos. IDs invÃ¡lidos: " + String.join(", ", invalidIds)));
                return ResponseEntity.badRequest().body(errorResult);
            }
            
            // Se alguns IDs sÃ£o invÃ¡lidos, logar mas continuar com os vÃ¡lidos
            if (!invalidIds.isEmpty()) {
                log.warn("Alguns IDs sÃ£o invÃ¡lidos e serÃ£o ignorados: {}", invalidIds);
            }
            
            Map<String, Object> result = payslipService.deleteMultiplePayslips(validIds);
            
            // Adicionar informaÃ§Ãµes sobre IDs invÃ¡lidos ao resultado
            if (!invalidIds.isEmpty()) {
                result.put("invalidIds", invalidIds);
                result.put("invalidCount", invalidIds.size());
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro inesperado ao excluir mÃºltiplos payslips: {}", e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("deleted", 0);
            errorResult.put("failed", 0);
            errorResult.put("errors", List.of("Erro interno: " + e.getMessage()));
            return ResponseEntity.internalServerError().body(errorResult);
        }
    }

    // ==================== ENDPOINTS DE VERIFICAÃ‡ÃƒO ====================

    @GetMapping("/extracted-data")
    @Operation(summary = "Get extracted data from holerites processing")
    public ResponseEntity<Map<String, Object>> getExtractedData() {
        log.info("ðŸ“Š Verificando dados extraÃ­dos dos holerites");
        
        try {
            // Buscar dados da tabela de dados extraÃ­dos
            List<com.z7design.fleet_manager.model.ExtractDataHolerites> extractedData = 
                extractDataHoleritesService.findAll();
            
            // Buscar dados da tabela de payslips
            List<Payslip> payslips = payslipService.getAllPayslips();
            
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("extractedDataCount", extractedData.size());
            result.put("payslipsCount", payslips.size());
            result.put("extractedData", extractedData);
            result.put("payslips", payslips);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar dados extraÃ­dos: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/update-missing-data")
    @Operation(summary = "Update payslips missing company and sector data by extracting from PDFs")
    public ResponseEntity<Map<String, Object>> updateMissingData() {
        log.info("ðŸ”„ Iniciando atualizaÃ§Ã£o de holerites sem empresa/setor");
        
        try {
            Map<String, Object> result = payslipService.updateMissingCompanyAndSectorData();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("âŒ Erro ao atualizar holerites: {}", e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResult);
        }
    }
}
