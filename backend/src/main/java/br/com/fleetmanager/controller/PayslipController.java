package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.PayslipProcessingService;
import br.com.fleetmanager.service.PayslipService;

import br.com.fleetmanager.dto.EnvioRequest;
import br.com.fleetmanager.model.Payslip;

import br.com.fleetmanager.service.ExtractDataHoleritesService;
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
import java.util.UUID;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.CompletableFuture;
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
    private final PayslipProcessingService payslipProcessingService;
    private final ExtractDataHoleritesService extractDataHoleritesService;

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
        
        log.info("🚀 Recebendo upload e envio unificado: {} - Tipo: {}", file.getOriginalFilename(), tipo);
        
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
            log.error("❌ Erro no upload e envio unificado: {}", e.getMessage());
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
        
        log.info("🔄 Recebendo upload e envio assíncrono: {} - Tipo: {}", file.getOriginalFilename(), tipo);
        
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
            
            // Iniciar processamento assíncrono
            CompletableFuture<PayslipProcessingService.ProcessingResult> future = 
                payslipProcessingService.processAsync(file, envioRequest);
            
            return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "status", "PROCESSING",
                "message", "Processamento iniciado. Use /api/payslips/status/{sessionId} para acompanhar o progresso."
            ));
            
        } catch (Exception e) {
            log.error("❌ Erro no upload e envio assíncrono: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/status/{sessionId}")
    @Operation(summary = "Get processing status by session ID")
    public ResponseEntity<PayslipProcessingService.ProcessingStatus> getStatus(@PathVariable String sessionId) {
        log.info("📊 Verificando status da sessão: {}", sessionId);
        
        PayslipProcessingService.ProcessingStatus status = payslipProcessingService.getStatus(sessionId);
        return ResponseEntity.ok(status);
    }

    // ==================== ENDPOINTS EXISTENTES ====================

    @PostMapping("/upload")
    @Operation(summary = "Upload and process a PDF containing multiple payslips")
    public ResponseEntity<List<Payslip>> uploadPayslips(@RequestParam("file") MultipartFile file) throws IOException {
        log.info("Recebendo upload de holerite: {}", file.getOriginalFilename());
        // Validação de nome de arquivo
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.matches(".*[\\r\\n/\\\\<>:\"|?*].*")) {
            log.warn("Nome de arquivo inválido recebido: {}", originalFilename);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Collections.emptyList());
        }
        List<Payslip> payslips = payslipService.processPayslipPDF(file);
        return ResponseEntity.ok(payslips);
    }

    @PostMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugPayslip(@RequestParam("file") MultipartFile file) throws IOException {
        log.info("Debug: Analisando conteúdo do PDF: {}", file.getOriginalFilename());
        Map<String, Object> debugInfo = payslipService.debugPayslipContent(file);
        return ResponseEntity.ok(debugInfo);
    }

    @GetMapping
    public ResponseEntity<List<Payslip>> getAllPayslips() {
        log.info("🔍 Iniciando busca de todos os payslips...");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
        List<Payslip> payslips;
        if (isColaborador) {
            String cpf = auth.getName(); // username é o CPF
            log.info("👤 Usuário colaborador, buscando payslips por CPF: {}", cpf);
            payslips = payslipService.getPayslipsByCpf(cpf);
        } else {
            log.info("👑 Usuário admin, buscando todos os payslips");
            payslips = payslipService.getAllPayslips();
        }
        log.info("✅ Payslips encontrados: {} registros", payslips.size());
        if (payslips.size() > 0) {
            log.info("📋 Primeiro payslip: ID={}, Nome={}, CPF={}, Mês={}, Ano={}", 
                payslips.get(0).getId(), payslips.get(0).getEmployeeName(), 
                payslips.get(0).getCpf(), payslips.get(0).getMonth(), payslips.get(0).getYear());
        }
        return ResponseEntity.ok(payslips);
    }

    @GetMapping("/download/{fileName}")
    @Operation(summary = "Download individual payslip file")
    public ResponseEntity<Resource> downloadPayslip(@PathVariable String fileName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
        if (isColaborador) {
            String cpf = auth.getName();
            Payslip payslip = payslipService.getPayslipByFileName(fileName);
            if (payslip == null || !cpf.equals(payslip.getCpf())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        try {
            // Usar caminho configurável ou padrão
            String uploadDir = System.getProperty("payslips.upload.dir", "uploads/payslips");
            Path filePath = Paths.get(uploadDir, fileName);
            
            // Se o caminho não existir, tentar o caminho antigo como fallback
            if (!java.nio.file.Files.exists(filePath)) {
                filePath = Paths.get("backend/payslips_output", fileName);
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(resource);
            } else {
                log.warn("Arquivo não encontrado: {} em {}", fileName, filePath);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            log.error("Erro ao acessar arquivo: {}", fileName, e);
            return ResponseEntity.internalServerError().build();
        }
    }


    @RequestMapping(value = "/test-download/{fileName}", method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> testDownloadOptions(@PathVariable String fileName) {
        return ResponseEntity.ok().build();
    }

    // Endpoint de teste temporário sem autenticação
    @GetMapping("/test-download/{fileName}")
    @Operation(summary = "Test download individual payslip file without authentication")
    public ResponseEntity<Resource> testDownloadPayslip(@PathVariable String fileName) {
        try {
            log.info("Teste de download: {}", fileName);
            
            // Tentar diferentes caminhos possíveis
            Path filePath = findPayslipFile(fileName);
            
            log.info("Tentando acessar arquivo em: {}", filePath);
            
            if (filePath != null && java.nio.file.Files.exists(filePath)) {
                Resource resource = new UrlResource(filePath.toUri());
                if (resource.exists() && resource.isReadable()) {
                    log.info("Arquivo encontrado e legível: {}", fileName);
                    return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                        .body(resource);
                }
            }
            
            log.warn("Arquivo não encontrado ou não legível: {} em {}", fileName, filePath);
            return ResponseEntity.notFound().build();
            
        } catch (MalformedURLException e) {
            log.error("Erro ao acessar arquivo: {}", fileName, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private Path findPayslipFile(String fileName) {
        // 1. Tentar no diretório de uploads padrão
        String uploadDir = System.getProperty("payslips.upload.dir", "uploads/payslips");
        Path filePath = Paths.get(uploadDir, fileName);
        
        // 2. Se não existir, tentar no diretório de output antigo
        if (!java.nio.file.Files.exists(filePath)) {
            filePath = Paths.get("backend/payslips_output", fileName);
        }
        
        // 3. Se não existir, tentar no diretório de holerites (raiz)
        if (!java.nio.file.Files.exists(filePath)) {
            filePath = Paths.get("backend/holerites", fileName);
        }
        
        // 4. Se não existir, tentar buscar nas subpastas de holerites por mês/ano
        if (!java.nio.file.Files.exists(filePath)) {
            Path holeritesDir = Paths.get("backend/holerites");
            if (java.nio.file.Files.exists(holeritesDir)) {
                try {
                    for (Path subDir : java.nio.file.Files.list(holeritesDir).toList()) {
                        if (java.nio.file.Files.isDirectory(subDir)) {
                            Path potentialFile = subDir.resolve(fileName);
                            if (java.nio.file.Files.exists(potentialFile)) {
                                filePath = potentialFile;
                                break;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Erro ao buscar em subpastas: {}", e.getMessage());
                }
            }
        }
        
        return filePath;
    }

    // Exclusão individual de payslip
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayslip(@PathVariable UUID id) {
        try {
            payslipService.deletePayslip(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao excluir payslip: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Exclusão em massa de payslips
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
            
            log.info("🗑️ Tentando excluir {} payslips", idStrings.size());
            
            // Converter IDs para UUID com validação individual
            List<UUID> validIds = new ArrayList<>();
            List<String> invalidIds = new ArrayList<>();
            
            for (String idString : idStrings) {
                try {
                    UUID uuid = UUID.fromString(idString);
                    validIds.add(uuid);
                } catch (IllegalArgumentException e) {
                    log.warn("ID inválido encontrado: {} - {}", idString, e.getMessage());
                    invalidIds.add(idString);
                }
            }
            
            // Se todos os IDs são inválidos, retornar erro
            if (validIds.isEmpty()) {
                log.error("Todos os IDs fornecidos são inválidos: {}", invalidIds);
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("deleted", 0);
                errorResult.put("failed", idStrings.size());
                errorResult.put("errors", List.of("Todos os IDs fornecidos são inválidos. IDs inválidos: " + String.join(", ", invalidIds)));
                return ResponseEntity.badRequest().body(errorResult);
            }
            
            // Se alguns IDs são inválidos, logar mas continuar com os válidos
            if (!invalidIds.isEmpty()) {
                log.warn("Alguns IDs são inválidos e serão ignorados: {}", invalidIds);
            }
            
            Map<String, Object> result = payslipService.deleteMultiplePayslips(validIds);
            
            // Adicionar informações sobre IDs inválidos ao resultado
            if (!invalidIds.isEmpty()) {
                result.put("invalidIds", invalidIds);
                result.put("invalidCount", invalidIds.size());
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro inesperado ao excluir múltiplos payslips: {}", e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("deleted", 0);
            errorResult.put("failed", 0);
            errorResult.put("errors", List.of("Erro interno: " + e.getMessage()));
            return ResponseEntity.internalServerError().body(errorResult);
        }
    }

    // ==================== ENDPOINTS DE VERIFICAÇÃO ====================

    @GetMapping("/extracted-data")
    @Operation(summary = "Get extracted data from holerites processing")
    public ResponseEntity<Map<String, Object>> getExtractedData() {
        log.info("📊 Verificando dados extraídos dos holerites");
        
        try {
            // Buscar dados da tabela de dados extraídos
            List<br.com.fleetmanager.model.ExtractDataHolerites> extractedData = 
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
            log.error("❌ Erro ao buscar dados extraídos: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}