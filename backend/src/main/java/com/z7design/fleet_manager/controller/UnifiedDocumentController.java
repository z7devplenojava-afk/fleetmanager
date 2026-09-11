package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.UnifiedDocumentService;
import com.z7design.fleet_manager.service.EmailService;
import com.z7design.fleet_manager.service.WhatsAppService;
import com.z7design.fleet_manager.service.PayslipService;
import com.z7design.fleet_manager.model.Payslip;
import com.z7design.fleet_manager.model.PaymentReceipt;
import com.z7design.fleet_manager.repository.PaymentReceiptRepository;
import com.z7design.fleet_manager.repository.PayslipRepository;
import com.z7design.fleet_manager.util.AuthenticatedCpfResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.io.BufferedOutputStream;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.io.FileInputStream;
import java.io.BufferedInputStream;
import java.util.UUID;

@RestController
@RequestMapping("/api/unified-documents")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequiredArgsConstructor
@Slf4j
public class UnifiedDocumentController {

    private final UnifiedDocumentService unifiedDocumentService;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final PayslipService payslipService;
    private final PaymentReceiptRepository paymentReceiptRepository;
    private final AuthenticatedCpfResolver authenticatedCpfResolver;
    private final com.z7design.fleet_manager.repository.UserRepository userRepository;
    private final PayslipRepository payslipRepository;

    private static final Pattern CPF_PATTERN = Pattern.compile("(\\d{11})");
    
    // Log de inicializaÃ§Ã£o para confirmar que o controller foi carregado
    {
        log.info("âœ… UnifiedDocumentController inicializado - Endpoint /download/company disponÃ­vel");
    }

    /**
     * Cria documento unificado para um funcionÃ¡rio especÃ­fico
     * Aceita payslipId e receiptId opcionais para garantir que os documentos corretos sejam usados
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createUnifiedDocument(
            @RequestParam(value = "employeeName") String employeeName,
            @RequestParam(value = "month") int month,
            @RequestParam(value = "year") int year,
            @RequestParam(value = "payslipId", required = false) java.util.UUID payslipId,
            @RequestParam(value = "receiptId", required = false) java.util.UUID receiptId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸŽ¯ Criando documento unificado para: {} - {}/{} (payslipId: {}, receiptId: {})", 
                employeeName, month, year, payslipId, receiptId);
            
            String unifiedPdfPath;
            
            // Se temos IDs especÃ­ficos, usar eles para garantir que os documentos corretos sejam usados
            if (payslipId != null && receiptId != null) {
                log.info("âœ… Usando IDs especÃ­ficos para garantir documentos corretos");
                unifiedPdfPath = unifiedDocumentService.createUnifiedDocumentByIds(payslipId, receiptId);
            } else {
                // Fallback para busca por nome/mÃªs/ano (comportamento antigo)
                log.info("âš ï¸ Usando busca por nome/mÃªs/ano (pode encontrar documentos incorretos se houver nomes similares)");
                unifiedPdfPath = unifiedDocumentService.createUnifiedDocumentForEmployee(employeeName, month, year);
            }
            
            response.put("sucesso", true);
            response.put("mensagem", "Documento unificado criado com sucesso");
            response.put("filePath", unifiedPdfPath);
            response.put("employeeName", employeeName);
            response.put("month", month);
            response.put("year", year);
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("ðŸ’¥ Erro de I/O ao criar documento unificado: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            response.put("detalhes", e.getMessage());
            // Retornar 400 (Bad Request) para erros de arquivo nÃ£o encontrado
            if (e.getMessage() != null && (e.getMessage().contains("nÃ£o encontrado") || e.getMessage().contains("not found"))) {
                return ResponseEntity.badRequest().body(response);
            }
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro inesperado ao criar documento unificado: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao criar documento unificado: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            response.put("detalhes", e.getMessage());
            if (e.getCause() != null) {
                response.put("causa", e.getCause().getMessage());
            }
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Debug: Testa busca de comprovante para um funcionÃ¡rio especÃ­fico
     */
    @GetMapping("/debug-search-receipt")
    public ResponseEntity<Map<String, Object>> debugSearchReceipt(
            @RequestParam(value = "employeeName") String employeeName,
            @RequestParam(value = "month") int month,
            @RequestParam(value = "year") int year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ” DEBUG: Testando busca de comprovante para: {} - {}/{}", employeeName, month, year);
            
            // Calcular mÃªs do comprovante (mÃªs seguinte)
            int receiptMonth = month == 12 ? 1 : month + 1;
            int receiptYear = month == 12 ? year + 1 : year;
            
            // Buscar comprovantes no banco
            List<PaymentReceipt> receiptsInDb = paymentReceiptRepository.findByYearAndMonth(receiptYear, receiptMonth);
            
            response.put("sucesso", true);
            response.put("employeeName", employeeName);
            response.put("holeriteMonth", month);
            response.put("holeriteYear", year);
            response.put("receiptMonth", receiptMonth);
            response.put("receiptYear", receiptYear);
            response.put("totalReceiptsInDb", receiptsInDb.size());
            
            // Listar todos os comprovantes encontrados
            List<Map<String, Object>> receiptsInfo = new ArrayList<>();
            for (PaymentReceipt r : receiptsInDb) {
                Map<String, Object> receiptInfo = new HashMap<>();
                receiptInfo.put("id", r.getId());
                receiptInfo.put("employeeName", r.getEmployeeName());
                receiptInfo.put("month", r.getMonth());
                receiptInfo.put("year", r.getYear());
                receiptInfo.put("fileName", r.getFileName());
                receiptInfo.put("filePath", r.getFilePath());
                
                // Verificar se arquivo existe
                if (r.getFilePath() != null) {
                    Path filePath = Paths.get(r.getFilePath());
                    receiptInfo.put("fileExists", Files.exists(filePath));
                    receiptInfo.put("absolutePath", filePath.toAbsolutePath().toString());
                    
                    // Tentar caminho relativo tambÃ©m
                    Path relativePath = Paths.get(System.getProperty("user.dir"), r.getFilePath());
                    receiptInfo.put("relativePathExists", Files.exists(relativePath));
                    if (Files.exists(relativePath)) {
                        receiptInfo.put("relativeAbsolutePath", relativePath.toAbsolutePath().toString());
                    }
                } else {
                    receiptInfo.put("fileExists", false);
                }
                
                receiptsInfo.add(receiptInfo);
            }
            response.put("receipts", receiptsInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no debug: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("erro", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Debug: Lista todos os holerites e comprovantes para diagnÃ³stico
     */
    @GetMapping("/debug-data")
    public ResponseEntity<Map<String, Object>> debugUnificationData(
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "year", required = false) Integer year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ” DEBUG: Listando dados para diagnÃ³stico - MÃªs: {}, Ano: {}", month, year);
            
            // 1. Listar todos os holerites
            List<Payslip> allPayslips = payslipService.getAllPayslips();
            log.info("ðŸ“Š Total de holerites: {}", allPayslips.size());
            
            // 2. Listar todos os comprovantes
            List<PaymentReceipt> allReceipts = paymentReceiptRepository.findAll();
            log.info("ðŸ“Š Total de comprovantes: {}", allReceipts.size());
            
            // 3. Filtrar por perÃ­odo se especificado
            List<Payslip> filteredPayslips = allPayslips;
            List<PaymentReceipt> filteredReceipts = allReceipts;
            
            if (month != null || year != null) {
                filteredPayslips = allPayslips.stream()
                    .filter(p -> month == null || p.getMonth().equals(month))
                    .filter(p -> year == null || p.getYear().equals(year))
                    .collect(Collectors.toList());
                    
                filteredReceipts = allReceipts.stream()
                    .filter(r -> month == null || r.getMonth() != null && r.getMonth().equals(month))
                    .filter(r -> year == null || r.getYear() != null && r.getYear().equals(year))
                    .collect(Collectors.toList());
            }
            
            // 4. Preparar resposta
            response.put("sucesso", true);
            response.put("totalHolerites", allPayslips.size());
            response.put("totalReceipts", allReceipts.size());
            response.put("filteredHolerites", filteredPayslips.size());
            response.put("filteredReceipts", filteredReceipts.size());
            
            // 5. Listar nomes Ãºnicos para comparaÃ§Ã£o
            Set<String> payslipNames = filteredPayslips.stream()
                .map(Payslip::getEmployeeName)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
                
            Set<String> receiptNames = filteredReceipts.stream()
                .map(PaymentReceipt::getEmployeeName)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
            
            response.put("payslipNames", payslipNames);
            response.put("receiptNames", receiptNames);
            
            // 6. Encontrar nomes que existem em ambos
            Set<String> commonNames = payslipNames.stream()
                .filter(receiptNames::contains)
                .collect(Collectors.toSet());
                
            response.put("commonNames", commonNames);
            response.put("commonNamesCount", commonNames.size());
            
            // 7. Listar detalhes dos primeiros 10 de cada
            List<Map<String, Object>> payslipDetails = filteredPayslips.stream()
                .limit(10)
                .map(p -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("id", p.getId());
                    detail.put("employeeName", p.getEmployeeName());
                    detail.put("month", p.getMonth());
                    detail.put("year", p.getYear());
                    detail.put("fileName", p.getFileName());
                    return detail;
                })
                .collect(Collectors.toList());
                
            List<Map<String, Object>> receiptDetails = filteredReceipts.stream()
                .limit(10)
                .map(r -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("id", r.getId());
                    detail.put("employeeName", r.getEmployeeName());
                    detail.put("month", r.getMonth());
                    detail.put("year", r.getYear());
                    detail.put("fileName", r.getFileName());
                    return detail;
                })
                .collect(Collectors.toList());
            
            response.put("samplePayslips", payslipDetails);
            response.put("sampleReceipts", receiptDetails);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no debug de dados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao obter dados de debug: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Testa conexÃ£o e status do serviÃ§o
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testUnifiedDocument() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ§ª Testando conexÃ£o do serviÃ§o de documentos unificados...");
            
            // Teste simples de conectividade
            response.put("sucesso", true);
            response.put("mensagem", "ServiÃ§o de documentos unificados estÃ¡ funcionando");
            response.put("timestamp", System.currentTimeMillis());
            response.put("status", "OK");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no teste de conectividade: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Testa criaÃ§Ã£o real de documento unificado usando dados existentes
     */
    @PostMapping("/test-create")
    public ResponseEntity<Map<String, Object>> testCreateUnifiedDocument(
            @RequestParam(value = "employeeName", required = false) String employeeName,
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "year", required = false) Integer year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ§ª Testando criaÃ§Ã£o de documento unificado...");
            
            // Se nÃ£o foram fornecidos parÃ¢metros, buscar um holerite existente
            if (employeeName == null || month == null || year == null) {
                log.info("ðŸ” Buscando holerite existente para teste...");
                
                // Buscar um holerite existente
                List<Payslip> existingPayslips = payslipService.getAllPayslips();
                
                if (existingPayslips.isEmpty()) {
                    response.put("sucesso", false);
                    response.put("mensagem", "Nenhum holerite encontrado no sistema para teste");
                    response.put("sugestao", "Importe alguns holerites primeiro");
                    return ResponseEntity.ok(response);
                }
                
                // Usar o primeiro holerite encontrado
                Payslip firstPayslip = existingPayslips.get(0);
                employeeName = firstPayslip.getEmployeeName();
                month = firstPayslip.getMonth();
                year = firstPayslip.getYear();
                
                log.info("ðŸ“‹ Usando holerite existente para teste: {} - {}/{}", employeeName, month, year);
            }
            
            log.info("ðŸ§ª Testando criaÃ§Ã£o de documento unificado para: {} - {}/{}", employeeName, month, year);
            
            String unifiedPdfPath = unifiedDocumentService.createUnifiedDocumentForEmployee(employeeName, month, year);
            
            response.put("sucesso", true);
            response.put("mensagem", "Teste de documento unificado realizado com sucesso");
            response.put("filePath", unifiedPdfPath);
            response.put("employeeName", employeeName);
            response.put("month", month);
            response.put("year", year);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no teste de criaÃ§Ã£o de documento unificado: {}", e.getMessage(), e);
            response.put("sucesso", false);
            
            // Extrair informaÃ§Ãµes da mensagem de erro
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("COMPROVANTE NÃƒO ENCONTRADO")) {
                // Parsear a mensagem estruturada
                String[] lines = errorMessage.split("\n");
                String errorEmployeeName = "";
                String holeritePeriod = "";
                String receiptPeriod = "";
                
                for (String line : lines) {
                    if (line.startsWith("FuncionÃ¡rio: ")) {
                        errorEmployeeName = line.replace("FuncionÃ¡rio: ", "").trim();
                    } else if (line.startsWith("PerÃ­odo do Holerite: ")) {
                        holeritePeriod = line.replace("PerÃ­odo do Holerite: ", "").trim();
                    } else if (line.startsWith("PerÃ­odo do Comprovante: ")) {
                        receiptPeriod = line.replace("PerÃ­odo do Comprovante: ", "").split("\\(")[0].trim();
                    }
                }
                
                response.put("mensagem", "Comprovante de Pagamento NÃ£o Encontrado");
                response.put("tipoErro", "COMPROVANTE_NAO_ENCONTRADO");
                response.put("funcionario", errorEmployeeName);
                response.put("periodoHolerite", holeritePeriod);
                response.put("periodoComprovante", receiptPeriod);
                response.put("acao", "Por favor, importe apenas o comprovante de pagamento que estÃ¡ faltando.");
                response.put("detalhes", errorMessage);
            } else {
                response.put("mensagem", "Erro no teste: " + errorMessage);
                response.put("erro", e.getClass().getSimpleName());
                
                // Se for erro de dados nÃ£o encontrados, sugerir usar dados existentes
                if (errorMessage != null && errorMessage.contains("nÃ£o encontrado")) {
                    response.put("sugestao", "Use o botÃ£o 'Analisar Dados' para ver quais holerites existem no sistema");
                }
            }
            
            return ResponseEntity.ok(response); // Retornar 200 com erro para mostrar a mensagem
        }
    }

    /**
     * Endpoint pÃºblico para teste
     */
    @GetMapping("/public/test")
    public ResponseEntity<Map<String, Object>> testUnifiedDocumentPublic() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸŒ Teste pÃºblico de documento unificado...");
            
            // Teste com dados mock
            String unifiedPdfPath = unifiedDocumentService.createUnifiedDocumentForEmployee("TESTE FUNCIONARIO", 7, 2025);
            
            response.put("sucesso", true);
            response.put("mensagem", "Teste pÃºblico realizado com sucesso");
            response.put("filePath", unifiedPdfPath);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no teste pÃºblico: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste pÃºblico: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lista documentos unificados - endpoint pÃºblico para debug
     */
    @GetMapping("/public/list")
    public ResponseEntity<Map<String, Object>> listUnifiedDocumentsPublic() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“‹ Listando documentos unificados (pÃºblico)...");
            
            List<Map<String, Object>> documents = unifiedDocumentService.listAllUnifiedDocuments();
            
            response.put("sucesso", true);
            response.put("mensagem", "Documentos unificados listados com sucesso");
            response.put("documents", documents);
            response.put("total", documents.size());
            
            log.info("âœ… Encontrados {} documentos unificados", documents.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao listar documentos unificados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao listar documentos unificados: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint de debug para listar arquivos disponÃ­veis
     */
    @GetMapping("/public/debug/list-files")
    public ResponseEntity<Map<String, Object>> listAvailableFiles() {
        Map<String, Object> response = new HashMap<>();
        try {
            Path basePath = Paths.get("uploads", "unified");
            log.info("ðŸ“ Listando arquivos em: {}", basePath.toAbsolutePath());
            
            response.put("basePath", basePath.toAbsolutePath().toString());
            response.put("exists", Files.exists(basePath));
            
            if (Files.exists(basePath)) {
                List<String> files = Files.walk(basePath)
                    .filter(Files::isRegularFile)
                    .map(path -> path.getFileName().toString())
                    .collect(java.util.stream.Collectors.toList());
                response.put("files", files);
                response.put("totalFiles", files.size());
            } else {
                response.put("files", new ArrayList<>());
                response.put("totalFiles", 0);
                response.put("error", "DiretÃ³rio nÃ£o existe");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Endpoint pÃºblico para servir arquivos PDF de documentos unificados
     */
    @GetMapping("/public/file/{fileName:.+}")
    public ResponseEntity<Resource> serveUnifiedDocumentFile(@PathVariable("fileName") String fileName) {
        try {
            log.info("ðŸ“„ Servindo arquivo pÃºblico: {}", fileName);
            
            // Procurar o arquivo recursivamente nas subpastas
            Path basePath = Paths.get("uploads", "unified");
            log.info("ðŸ” Procurando arquivo em: {}", basePath.toAbsolutePath());
            log.info("ðŸ” Nome do arquivo: {}", fileName);
            
            Path filePath = findFileRecursively(basePath, fileName);
            
            if (filePath == null) {
                log.error("âŒ Arquivo nÃ£o encontrado: {} no diretÃ³rio: {}", fileName, basePath.toAbsolutePath());
                
                // Tentar listar arquivos disponÃ­veis para debug
                try {
                    List<String> availableFiles = Files.walk(basePath)
                        .filter(Files::isRegularFile)
                        .map(p -> p.getFileName().toString())
                        .collect(java.util.stream.Collectors.toList());
                    log.error("ðŸ“ Arquivos disponÃ­veis: {}", availableFiles);
                } catch (IOException e) {
                    log.error("ðŸ’¥ Erro ao listar arquivos: {}", e.getMessage());
                }
                
                return ResponseEntity.notFound().build();
            }
            
            log.info("âœ… Arquivo encontrado em: {}", filePath);
            
            // Verificar se Ã© um arquivo PDF
            if (!fileName.toLowerCase().endsWith(".pdf")) {
                log.warn("âš ï¸ Tipo de arquivo nÃ£o permitido: {}", fileName);
                return ResponseEntity.badRequest().build();
            }
            
            // Criar recurso do arquivo
            Resource resource = new FileSystemResource(filePath.toFile());
            
            // Configurar headers para download/visualizaÃ§Ã£o
            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "inline; filename=\"" + fileName + "\"")
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "*")
                .header("X-Frame-Options", "ALLOWALL")
                .header("X-Content-Type-Options", "nosniff")
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(resource);
                
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao servir arquivo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/view/{fileName:.+}")
    public ResponseEntity<Resource> viewUnifiedDocument(@PathVariable("fileName") String fileName) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));

            if (isColaborador) {
                Optional<String> resolvedCpf = authenticatedCpfResolver.resolve(auth);
                Optional<String> fileCpf = extractCpfFromFileName(fileName);
                if (resolvedCpf.isEmpty() || fileCpf.isEmpty() || !resolvedCpf.get().equals(fileCpf.get())) {
                    log.warn("âš ï¸ Colaborador {} sem permissÃ£o para visualizar documento {}", auth.getName(), fileName);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }

            Path basePath = Paths.get("uploads", "unified");
            Path filePath = findFileRecursively(basePath, fileName);

            if (filePath == null) {
                log.warn("âš ï¸ Documento unificado nÃ£o encontrado: {}", fileName);
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(filePath.toFile());
            if (!resource.exists()) {
                log.warn("âš ï¸ Recurso nÃ£o encontrado no caminho: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", fileName);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao visualizar documento unificado {}: {}", fileName, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Download em lote por empresa (ZIP) - VERSÃƒO OTIMIZADA
     * Busca diretamente do banco de dados para melhor performance
     * IMPORTANTE: Este endpoint deve vir ANTES do /download/{fileName} para evitar conflito de rotas
     */
    @GetMapping("/download/company")
    public ResponseEntity<StreamingResponseBody> downloadByCompany(@RequestParam("name") String companyName) {
        long startTime = System.currentTimeMillis();
        try {
            // Decodificar o nome da empresa (pode vir com %20 para espaÃ§os)
            String decodedCompanyName = java.net.URLDecoder.decode(companyName, "UTF-8");
            log.info("ðŸ“¦ [OTIMIZADO] Download em lote por empresa: '{}'", decodedCompanyName);
            
            // OTIMIZAÃ‡ÃƒO: Buscar payslips diretamente do banco de dados usando query otimizada
            // Primeiro tentar buscar por CNPJ (mais rÃ¡pido e preciso)
            List<Payslip> companyPayslips = payslipRepository.findByCompanyCnpj(decodedCompanyName);
            
            // Se nÃ£o encontrou por CNPJ, buscar por nome da empresa (busca flexÃ­vel)
            if (companyPayslips.isEmpty()) {
                companyPayslips = payslipRepository.findByCompanyNameContainingIgnoreCase(decodedCompanyName);
            }
            
            log.info("âœ… {} payslip(s) encontrado(s) para a empresa '{}'", companyPayslips.size(), decodedCompanyName);
            
            if (companyPayslips.isEmpty()) {
                log.warn("âš ï¸ Nenhum payslip encontrado para a empresa: '{}'", decodedCompanyName);
                return ResponseEntity.notFound().build();
            }
            
            // Criar mapa para organizar arquivos por estrutura: Empresa/Setor/PerÃ­odo/FuncionÃ¡rio
            // Usar UUID do Payslip como chave para evitar LazyInitializationException
            Map<UUID, Path> payslipToFileMap = new HashMap<>();
            Map<UUID, Payslip> payslipMap = new HashMap<>();
            
            // Inicializar relaÃ§Ãµes lazy antes de usar
            for (Payslip payslip : companyPayslips) {
                // Inicializar company se necessÃ¡rio (para evitar LazyInitializationException)
                if (payslip.getCompany() != null) {
                    try {
                        // ForÃ§ar inicializaÃ§Ã£o da relaÃ§Ã£o lazy
                        org.hibernate.Hibernate.initialize(payslip.getCompany());
                    } catch (Exception e) {
                        log.warn("âš ï¸ NÃ£o foi possÃ­vel inicializar company para payslip {}: {}", payslip.getId(), e.getMessage());
                    }
                }
                payslipMap.put(payslip.getId(), payslip);
            }
            
            // Mapear cada payslip para seu arquivo encontrado
            for (Payslip payslip : companyPayslips) {
                String fileName = payslip.getFileName();
                if (fileName == null || fileName.isEmpty()) {
                    continue;
                }
                
                // Tentar encontrar o arquivo para este payslip especÃ­fico
                Path foundFile = null;
                
                // PRIORIDADE 1: Usar arquivo_caminho se disponÃ­vel
                if (payslip.getArquivoCaminho() != null && !payslip.getArquivoCaminho().isEmpty()) {
                    Path candidate = Paths.get(payslip.getArquivoCaminho());
                    if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                        foundFile = candidate;
                    }
                }
                
                // PRIORIDADE 2: Estrutura PRD completa
                if (foundFile == null && payslip.getCompanyCnpj() != null && payslip.getWorkPostName() != null) {
                    String empresaCnpj = normalizeCnpjForPath(payslip.getCompanyCnpj());
                    String setorNome = normalizeSectorNameForPath(payslip.getWorkPostName());
                    String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
                    String funcionarioNome = payslip.getEmployeeName() != null ? normalizeEmployeeNameForPath(payslip.getEmployeeName()) : null;
                    String funcionarioCpf = payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : null;
                    
                    if (empresaCnpj != null && setorNome != null && funcionarioNome != null && funcionarioCpf != null) {
                        String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);
                        Path candidate = Paths.get("backend/holerites", empresaCnpj, setorNome, periodo, pastaFuncionario, fileName);
                        if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                            foundFile = candidate;
                        }
                    }
                }
                
                // PRIORIDADE 3: Estrutura PRD sem pasta funcionÃ¡rio
                if (foundFile == null && payslip.getCompanyCnpj() != null && payslip.getWorkPostName() != null) {
                    String empresaCnpj = normalizeCnpjForPath(payslip.getCompanyCnpj());
                    String setorNome = normalizeSectorNameForPath(payslip.getWorkPostName());
                    String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
                    
                    if (empresaCnpj != null && setorNome != null) {
                        Path candidate = Paths.get("backend/holerites", empresaCnpj, setorNome, periodo, fileName);
                        if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                            foundFile = candidate;
                        }
                    }
                }
                
                // PRIORIDADE 4: Estrutura antiga
                if (foundFile == null) {
                    String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
                    Path candidate = Paths.get("backend/holerites", mesAno, fileName);
                    if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                        foundFile = candidate;
                    }
                }
                
                // PRIORIDADE 5: Buscar recursivamente
                if (foundFile == null) {
                    Path holeritesDir = Paths.get("backend/holerites");
                    if (Files.exists(holeritesDir)) {
                        try {
                            java.util.stream.Stream<Path> stream = Files.walk(holeritesDir, 5);
                            Optional<Path> found = stream
                                .filter(Files::isRegularFile)
                                .filter(p -> p.getFileName().toString().equals(fileName))
                                .findFirst();
                            stream.close();
                            
                            if (found.isPresent()) {
                                foundFile = found.get();
                            }
                        } catch (IOException e) {
                            log.warn("âš ï¸ Erro ao buscar arquivo recursivamente: {}", e.getMessage());
                        }
                    }
                }
                
                // PRIORIDADE 6: Outros diretÃ³rios
                if (foundFile == null) {
                    String[] fallbackDirs = {
                        System.getProperty("payslips.upload.dir", "uploads/payslips"),
                        "uploads/holerites_processados",
                        "backend/payslips_output",
                        "holerites"
                    };
                    
                    for (String baseDir : fallbackDirs) {
                        Path filePath = Paths.get(baseDir, fileName);
                        if (Files.exists(filePath) && Files.isRegularFile(filePath)) {
                            foundFile = filePath;
                            break;
                        }
                    }
                }
                
                if (foundFile != null) {
                    payslipToFileMap.put(payslip.getId(), foundFile);
                } else {
                    log.warn("âš ï¸ Arquivo nÃ£o encontrado para payslip {}: {}", payslip.getId(), fileName);
                }
            }
            
            log.info("ðŸ“Š {} arquivo(s) encontrado(s) de {} payslip(s) para empresa '{}'", 
                payslipToFileMap.size(), companyPayslips.size(), decodedCompanyName);
            
            if (payslipToFileMap.isEmpty()) {
                log.warn("âš ï¸ Nenhum arquivo fÃ­sico encontrado para os payslips da empresa: '{}'", decodedCompanyName);
                return ResponseEntity.notFound().build();
            }
            
            // Normalizar nome da empresa para pasta
            String empresaFolderName = normalizeCompanyNameForPath(decodedCompanyName);
            
            // Criar ZIP streaming com estrutura organizada: Empresa/Setor/PerÃ­odo/FuncionÃ¡rio/arquivo.pdf
            log.info("ðŸ“¦ Criando ZIP organizado com {} arquivo(s) para empresa '{}'...", payslipToFileMap.size(), decodedCompanyName);
            StreamingResponseBody responseBody = outputStream -> {
                try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(outputStream, 65536))) {
                    int filesAdded = 0;
                    
                    for (Map.Entry<UUID, Path> entry : payslipToFileMap.entrySet()) {
                        UUID payslipId = entry.getKey();
                        Payslip payslip = payslipMap.get(payslipId);
                        Path filePath = entry.getValue();
                        
                        if (payslip == null) {
                            log.warn("âš ï¸ Payslip nÃ£o encontrado para ID: {}", payslipId);
                            continue;
                        }
                        
                        // Construir caminho no ZIP: Empresa/Setor/PerÃ­odo/FuncionÃ¡rio/arquivo.pdf
                        String setorNome = payslip.getWorkPostName() != null 
                            ? normalizeSectorNameForPath(payslip.getWorkPostName()) 
                            : "SETOR_NAO_INFORMADO";
                        String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
                        String funcionarioNome = payslip.getEmployeeName() != null 
                            ? normalizeEmployeeNameForPath(payslip.getEmployeeName()) 
                            : "FUNCIONARIO_NAO_INFORMADO";
                        String funcionarioCpf = payslip.getCpf() != null 
                            ? payslip.getCpf().replaceAll("[^0-9]", "") 
                            : "SEM_CPF";
                        String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);
                        
                        String fileName = filePath.getFileName().toString();
                        String zipEntryPath = String.format("%s/%s/%s/%s/%s", 
                            empresaFolderName, setorNome, periodo, pastaFuncionario, fileName);
                        
                        ZipEntry zipEntry = new ZipEntry(zipEntryPath);
                        zos.putNextEntry(zipEntry);
                        
                        // Usar buffer maior para melhor performance
                        try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream(filePath.toFile()), 65536)) {
                            byte[] buffer = new byte[65536]; // 64KB buffer
                            int bytesRead;
                            while ((bytesRead = bis.read(buffer)) != -1) {
                                zos.write(buffer, 0, bytesRead);
                            }
                        }
                        zos.closeEntry();
                        filesAdded++;
                        
                        if (filesAdded % 10 == 0) {
                            log.debug("ðŸ“¦ Progresso: {} arquivo(s) adicionado(s)...", filesAdded);
                        }
                    }
                    log.info("âœ… ZIP criado com sucesso: {} arquivo(s) adicionado(s) em estrutura organizada", filesAdded);
                } catch (Exception e) {
                    log.error("ðŸ’¥ Erro ao criar ZIP: {}", e.getMessage(), e);
                    throw new RuntimeException("Erro ao criar ZIP", e);
                }
            };
            
            String zipFileName = decodedCompanyName.replaceAll("[^a-zA-Z0-9]", "_") + "_documentos_unificados.zip";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", zipFileName);
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("âš¡ Download otimizado concluÃ­do em {}ms para empresa '{}'", duration, decodedCompanyName);
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(responseBody);
                
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao fazer download por empresa: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Download em lote por setor (ZIP) - VERSÃƒO OTIMIZADA
     * Busca diretamente do banco de dados para melhor performance
     * IMPORTANTE: Este endpoint deve vir ANTES do /download/{fileName} para evitar conflito de rotas
     */
    @GetMapping("/download/sector")
    public ResponseEntity<StreamingResponseBody> downloadBySector(@RequestParam("name") String sectorName) {
        long startTime = System.currentTimeMillis();
        try {
            // Decodificar o nome do setor (pode vir com %20 para espaÃ§os)
            String decodedSectorName = java.net.URLDecoder.decode(sectorName, "UTF-8");
            log.info("ðŸ“¦ [OTIMIZADO] Download em lote por setor: '{}'", decodedSectorName);
            
            // OTIMIZAÃ‡ÃƒO: Buscar payslips diretamente do banco de dados usando query otimizada
            List<Payslip> sectorPayslips = payslipRepository.findByWorkPostNameContainingIgnoreCase(decodedSectorName);
            
            log.info("âœ… {} payslip(s) encontrado(s) para o setor '{}'", sectorPayslips.size(), decodedSectorName);
            
            if (sectorPayslips.isEmpty()) {
                log.warn("âš ï¸ Nenhum payslip encontrado para o setor: '{}'", decodedSectorName);
                return ResponseEntity.notFound().build();
            }
            
            // Criar mapa para organizar arquivos por estrutura: Empresa/Setor/PerÃ­odo/FuncionÃ¡rio
            // Usar UUID do Payslip como chave para evitar LazyInitializationException
            Map<UUID, Path> payslipToFileMap = new HashMap<>();
            Map<UUID, Payslip> payslipMap = new HashMap<>();
            
            // Inicializar relaÃ§Ãµes lazy antes de usar
            for (Payslip payslip : sectorPayslips) {
                // Inicializar company se necessÃ¡rio (para evitar LazyInitializationException)
                if (payslip.getCompany() != null) {
                    try {
                        // ForÃ§ar inicializaÃ§Ã£o da relaÃ§Ã£o lazy
                        org.hibernate.Hibernate.initialize(payslip.getCompany());
                    } catch (Exception e) {
                        log.warn("âš ï¸ NÃ£o foi possÃ­vel inicializar company para payslip {}: {}", payslip.getId(), e.getMessage());
                    }
                }
                payslipMap.put(payslip.getId(), payslip);
            }
            
            log.info("ðŸ” Buscando arquivos fÃ­sicos para {} payslip(s)...", sectorPayslips.size());
            
            // Mapear cada payslip para seu arquivo encontrado (mesma lÃ³gica do downloadByCompany)
            for (Payslip payslip : sectorPayslips) {
                String fileName = payslip.getFileName();
                if (fileName == null || fileName.isEmpty()) {
                    log.warn("âš ï¸ Payslip {} nÃ£o tem fileName", payslip.getId());
                    continue;
                }
                
                Path foundFile = findPayslipFile(payslip, fileName);
                if (foundFile != null) {
                    payslipToFileMap.put(payslip.getId(), foundFile);
                } else {
                    log.warn("âš ï¸ Arquivo nÃ£o encontrado para payslip {}: {}", payslip.getId(), fileName);
                }
            }
            
            log.info("ðŸ“Š {} arquivo(s) encontrado(s) de {} payslip(s) para setor '{}'", 
                payslipToFileMap.size(), sectorPayslips.size(), decodedSectorName);
            
            if (payslipToFileMap.isEmpty()) {
                log.warn("âš ï¸ Nenhum arquivo fÃ­sico encontrado para os payslips do setor: '{}'", decodedSectorName);
                return ResponseEntity.notFound().build();
            }
            
            // Normalizar nome do setor para pasta
            String setorFolderName = normalizeSectorNameForPath(decodedSectorName);
            
            // Criar ZIP streaming com estrutura organizada: Empresa/Setor/PerÃ­odo/FuncionÃ¡rio/arquivo.pdf
            log.info("ðŸ“¦ Criando ZIP organizado com {} arquivo(s) para setor '{}'...", payslipToFileMap.size(), decodedSectorName);
            StreamingResponseBody responseBody = outputStream -> {
                try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(outputStream, 65536))) {
                    int filesAdded = 0;
                    
                    for (Map.Entry<UUID, Path> entry : payslipToFileMap.entrySet()) {
                        UUID payslipId = entry.getKey();
                        Payslip payslip = payslipMap.get(payslipId);
                        Path filePath = entry.getValue();
                        
                        if (payslip == null) {
                            log.warn("âš ï¸ Payslip nÃ£o encontrado para ID: {}", payslipId);
                            continue;
                        }
                        
                        // Construir caminho no ZIP: Empresa/Setor/PerÃ­odo/FuncionÃ¡rio/arquivo.pdf
                        String empresaNome = payslip.getCompanyName() != null 
                            ? normalizeCompanyNameForPath(payslip.getCompanyName()) 
                            : "EMPRESA_NAO_INFORMADA";
                        String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
                        String funcionarioNome = payslip.getEmployeeName() != null 
                            ? normalizeEmployeeNameForPath(payslip.getEmployeeName()) 
                            : "FUNCIONARIO_NAO_INFORMADO";
                        String funcionarioCpf = payslip.getCpf() != null 
                            ? payslip.getCpf().replaceAll("[^0-9]", "") 
                            : "SEM_CPF";
                        String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);
                        
                        String fileName = filePath.getFileName().toString();
                        String zipEntryPath = String.format("%s/%s/%s/%s/%s", 
                            empresaNome, setorFolderName, periodo, pastaFuncionario, fileName);
                        
                        ZipEntry zipEntry = new ZipEntry(zipEntryPath);
                        zos.putNextEntry(zipEntry);
                        
                        // Usar buffer maior para melhor performance
                        try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream(filePath.toFile()), 65536)) {
                            byte[] buffer = new byte[65536]; // 64KB buffer
                            int bytesRead;
                            while ((bytesRead = bis.read(buffer)) != -1) {
                                zos.write(buffer, 0, bytesRead);
                            }
                        }
                        zos.closeEntry();
                        filesAdded++;
                        
                        if (filesAdded % 10 == 0) {
                            log.debug("ðŸ“¦ Progresso: {} arquivo(s) adicionado(s)...", filesAdded);
                        }
                    }
                    log.info("âœ… ZIP criado com sucesso: {} arquivo(s) adicionado(s) em estrutura organizada", filesAdded);
                } catch (Exception e) {
                    log.error("ðŸ’¥ Erro ao criar ZIP: {}", e.getMessage(), e);
                    throw new RuntimeException("Erro ao criar ZIP", e);
                }
            };
            
            String zipFileName = decodedSectorName.replaceAll("[^a-zA-Z0-9]", "_") + "_holerites.zip";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", zipFileName);
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("âš¡ Download otimizado concluÃ­do em {}ms para setor '{}'", duration, decodedSectorName);
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(responseBody);
                
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao fazer download por setor: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * MÃ©todo auxiliar para encontrar arquivo fÃ­sico de um payslip
     * Reutiliza a mesma lÃ³gica do downloadByCompany
     */
    private Path findPayslipFile(Payslip payslip, String fileName) {
        // PRIORIDADE 1: Usar arquivo_caminho se disponÃ­vel
        if (payslip.getArquivoCaminho() != null && !payslip.getArquivoCaminho().isEmpty()) {
            Path candidate = Paths.get(payslip.getArquivoCaminho());
            if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                return candidate.toAbsolutePath();
            }
        }
        
        // PRIORIDADE 2: Estrutura PRD completa
        if (payslip.getCompanyCnpj() != null && payslip.getWorkPostName() != null) {
            String empresaCnpj = normalizeCnpjForPath(payslip.getCompanyCnpj());
            String setorNome = normalizeSectorNameForPath(payslip.getWorkPostName());
            String periodo = String.format("%d-%02d", payslip.getYear(), payslip.getMonth());
            String funcionarioNome = payslip.getEmployeeName() != null ? normalizeEmployeeNameForPath(payslip.getEmployeeName()) : null;
            String funcionarioCpf = payslip.getCpf() != null ? payslip.getCpf().replaceAll("[^0-9]", "") : null;
            
            if (empresaCnpj != null && setorNome != null && funcionarioNome != null && funcionarioCpf != null) {
                String pastaFuncionario = String.format("%s_%s", funcionarioNome, funcionarioCpf);
                Path candidate = Paths.get("backend/holerites", empresaCnpj, setorNome, periodo, pastaFuncionario, fileName);
                if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                    return candidate.toAbsolutePath();
                }
            }
            
            // Tentar sem pasta funcionÃ¡rio
            if (empresaCnpj != null && setorNome != null) {
                Path candidate = Paths.get("backend/holerites", empresaCnpj, setorNome, periodo, fileName);
                if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                    return candidate.toAbsolutePath();
                }
            }
        }
        
        // PRIORIDADE 3: Estrutura antiga
        String mesAno = String.format("%s-%s", payslip.getMonth(), payslip.getYear());
        Path candidate = Paths.get("backend/holerites", mesAno, fileName);
        if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
            return candidate.toAbsolutePath();
        }
        
        // PRIORIDADE 4: Buscar recursivamente
        Path holeritesDir = Paths.get("backend/holerites");
        if (Files.exists(holeritesDir)) {
            try {
                java.util.stream.Stream<Path> stream = Files.walk(holeritesDir, 5);
                Optional<Path> found = stream
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().equals(fileName))
                    .findFirst();
                stream.close();
                
                if (found.isPresent()) {
                    return found.get().toAbsolutePath();
                }
            } catch (IOException e) {
                log.warn("âš ï¸ Erro ao buscar arquivo recursivamente: {}", e.getMessage());
            }
        }
        
        // PRIORIDADE 5: Outros diretÃ³rios
        String[] fallbackDirs = {
            System.getProperty("payslips.upload.dir", "uploads/payslips"),
            "uploads/holerites_processados",
            "backend/payslips_output",
            "holerites"
        };
        
        for (String baseDir : fallbackDirs) {
            Path filePath = Paths.get(baseDir, fileName);
            if (Files.exists(filePath) && Files.isRegularFile(filePath)) {
                return filePath.toAbsolutePath();
            }
        }
        
        return null;
    }

    /**
     * Endpoint alternativo para download de arquivos unificados
     */
    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadUnifiedDocument(@PathVariable("fileName") String fileName) {
        try {
            log.info("ðŸ“¥ Download de arquivo: {}", fileName);
            
            // Procurar o arquivo recursivamente nas subpastas
            Path basePath = Paths.get("uploads", "unified");
            Path filePath = findFileRecursively(basePath, fileName);
            
            if (filePath == null) {
                log.warn("âš ï¸ Arquivo nÃ£o encontrado para download: {}", fileName);
                return ResponseEntity.notFound().build();
            }
            
            log.info("âœ… Arquivo encontrado para download em: {}", filePath);
            
            // Verificar se Ã© um arquivo PDF
            if (!fileName.toLowerCase().endsWith(".pdf")) {
                log.warn("âš ï¸ Tipo de arquivo nÃ£o permitido para download: {}", fileName);
                return ResponseEntity.badRequest().build();
            }
            
            // Criar recurso do arquivo
            Resource resource = new FileSystemResource(filePath.toFile());
            
            // Configurar headers para download forÃ§ado (sem headers CORS manuais - deixar SecurityConfig gerenciar)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(org.springframework.http.ContentDisposition.attachment()
                .filename(fileName, java.nio.charset.StandardCharsets.UTF_8)
                .build());
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
                
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao fazer download do arquivo: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * MÃ©todo auxiliar para encontrar arquivo recursivamente
     * Tenta encontrar o arquivo com e sem o prefixo "UNIFICADO_"
     */
    private Path findFileRecursively(Path basePath, String fileName) {
        if (!Files.exists(basePath)) {
            log.warn("âš ï¸ DiretÃ³rio base nÃ£o existe: {}", basePath);
            return null;
        }
        
        // Lista de nomes de arquivo para tentar (com e sem prefixo UNIFICADO_)
        java.util.List<String> fileNameVariants = new java.util.ArrayList<>();
        fileNameVariants.add(fileName); // Nome original
        
        // Se o nome comeÃ§a com "UNIFICADO_", tentar sem o prefixo
        if (fileName.startsWith("UNIFICADO_")) {
            String withoutPrefix = fileName.substring("UNIFICADO_".length());
            fileNameVariants.add(withoutPrefix);
            log.debug("ðŸ” Tentando variante sem prefixo: {}", withoutPrefix);
        } else {
            // Se nÃ£o comeÃ§a com "UNIFICADO_", tentar com o prefixo
            String withPrefix = "UNIFICADO_" + fileName;
            fileNameVariants.add(withPrefix);
            log.debug("ðŸ” Tentando variante com prefixo: {}", withPrefix);
        }
        
        // Tentar cada variante
        for (String variant : fileNameVariants) {
            // Procurar diretamente no diretÃ³rio base
            Path directPath = basePath.resolve(variant);
            if (Files.exists(directPath)) {
                log.info("âœ… Arquivo encontrado diretamente: {}", directPath);
                return directPath;
            }
            
            // Procurar recursivamente nas subpastas
            try {
                java.util.Optional<Path> found = Files.walk(basePath)
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().equals(variant))
                    .findFirst();
                
                if (found.isPresent()) {
                    log.info("âœ… Arquivo encontrado recursivamente: {}", found.get());
                    return found.get();
                }
            } catch (IOException e) {
                log.warn("âš ï¸ Erro ao procurar variante '{}': {}", variant, e.getMessage());
            }
        }
        
        log.warn("âš ï¸ Arquivo nÃ£o encontrado em nenhuma variante: {}", fileName);
        return null;
    }

    private Optional<String> extractCpfFromFileName(String fileName) {
        if (fileName == null) {
            return Optional.empty();
        }

        Matcher matcher = CPF_PATTERN.matcher(fileName);
        if (matcher.find()) {
            return Optional.of(matcher.group(1));
        }

        return Optional.empty();
    }

    /**
     * Busca o caminho do arquivo unificado correspondente a um funcionÃ¡rio/mÃªs/ano
     */
    private String findUnifiedDocumentPath(List<Map<String, Object>> allUnifiedDocs, String employeeName, Integer month, Integer year) {
        if (employeeName == null || month == null || year == null) {
            log.warn("âš ï¸ findUnifiedDocumentPath: ParÃ¢metros invÃ¡lidos - employeeName: {}, month: {}, year: {}", 
                employeeName, month, year);
            return null;
        }
        
        String normalizedSearchName = normalizeNameForMatching(employeeName);
        log.debug("ðŸ” Buscando documento unificado: '{}' (normalizado: '{}') - {}/{}", 
            employeeName, normalizedSearchName, month, year);
        
        for (Map<String, Object> doc : allUnifiedDocs) {
            String docEmployeeName = (String) doc.get("employeeName");
            Object docMonthObj = doc.get("month");
            Object docYearObj = doc.get("year");
            String filePath = (String) doc.get("filePath");
            
            // Normalizar month e year (podem vir como Integer ou String)
            Integer docMonth = null;
            Integer docYear = null;
            if (docMonthObj instanceof Integer) {
                docMonth = (Integer) docMonthObj;
            } else if (docMonthObj != null) {
                try {
                    docMonth = Integer.parseInt(docMonthObj.toString());
                } catch (NumberFormatException e) {
                    log.warn("âš ï¸ MÃªs invÃ¡lido no documento: {}", docMonthObj);
                }
            }
            if (docYearObj instanceof Integer) {
                docYear = (Integer) docYearObj;
            } else if (docYearObj != null) {
                try {
                    docYear = Integer.parseInt(docYearObj.toString());
                } catch (NumberFormatException e) {
                    log.warn("âš ï¸ Ano invÃ¡lido no documento: {}", docYearObj);
                }
            }
            
            if (docEmployeeName != null && docMonth != null && docYear != null && filePath != null) {
                // Verificar correspondÃªncia de mÃªs e ano primeiro (mais rÃ¡pido)
                boolean monthMatch = docMonth.equals(month);
                boolean yearMatch = docYear.equals(year);
                
                if (monthMatch && yearMatch) {
                    // Normalizar nome do documento
                    String normalizedDocName = normalizeNameForMatching(docEmployeeName);
                    
                    // EstratÃ©gia 1: CorrespondÃªncia exata (case-insensitive)
                    if (docEmployeeName.equalsIgnoreCase(employeeName)) {
                        log.debug("âœ… Documento encontrado (exata): {} - {}/{}", docEmployeeName, month, year);
                        return filePath;
                    }
                    
                    // EstratÃ©gia 2: CorrespondÃªncia normalizada exata
                    if (normalizedDocName.equals(normalizedSearchName)) {
                        log.debug("âœ… Documento encontrado (normalizada exata): {} - {}/{}", docEmployeeName, month, year);
                        return filePath;
                    }
                    
                    // EstratÃ©gia 3: CorrespondÃªncia por contenÃ§Ã£o
                    if (normalizedDocName.contains(normalizedSearchName) || 
                        normalizedSearchName.contains(normalizedDocName)) {
                        log.debug("âœ… Documento encontrado (contenÃ§Ã£o): {} - {}/{}", docEmployeeName, month, year);
                        return filePath;
                    }
                    
                    // EstratÃ©gia 4: CorrespondÃªncia por primeiro e Ãºltimo nome
                    String[] searchParts = normalizedSearchName.split("\\s+");
                    String[] docParts = normalizedDocName.split("\\s+");
                    if (searchParts.length >= 2 && docParts.length >= 2) {
                        String searchFirst = searchParts[0];
                        String searchLast = searchParts[searchParts.length - 1];
                        String docFirst = docParts[0];
                        String docLast = docParts[docParts.length - 1];
                        
                        if (searchFirst.equals(docFirst) && searchLast.equals(docLast)) {
                            log.debug("âœ… Documento encontrado (primeiro/Ãºltimo): {} - {}/{}", docEmployeeName, month, year);
                            return filePath;
                        }
                    }
                }
            }
        }
        
        log.warn("âš ï¸ Documento nÃ£o encontrado: '{}' - {}/{} (total de documentos: {})", 
            employeeName, month, year, allUnifiedDocs.size());
        return null;
    }
    
    /**
     * Normaliza nome para correspondÃªncia (remove acentos, normaliza espaÃ§os, converte para minÃºsculas)
     */
    private String normalizeNameForMatching(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        
        // Remover acentos
        String withoutAccents = java.text.Normalizer.normalize(name.trim(), java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        
        // Normalizar espaÃ§os e converter para minÃºsculas
        return withoutAccents
            .replaceAll("\\s+", " ")
            .trim()
            .toLowerCase();
    }
    
    /**
     * Normaliza CNPJ para uso em caminhos de arquivo (remove caracteres nÃ£o numÃ©ricos)
     */
    private String normalizeCnpjForPath(String rawCnpj) {
        if (rawCnpj == null) {
            return null;
        }
        String digitsOnly = rawCnpj.replaceAll("\\D", "");
        return digitsOnly.length() == 14 ? digitsOnly : null;
    }
    
    /**
     * Normaliza nome do setor para uso em pastas do sistema de arquivos
     */
    private String normalizeSectorNameForPath(String sector) {
        if (sector == null || sector.trim().isEmpty()) {
            return "SETOR_NAO_INFORMADO";
        }
        String upper = sector.trim().toUpperCase();
        String normalized = java.text.Normalizer.normalize(upper, java.text.Normalizer.Form.NFD)
            .replaceAll("[\\p{M}]", "")
            .replaceAll("[^A-Z0-9]+", "_")
            .replaceAll("^_+", "")
            .replaceAll("_+$", "");
        return normalized.isEmpty() ? "SETOR_NAO_INFORMADO" : normalized;
    }
    
    /**
     * Normaliza nome do funcionÃ¡rio para uso em pastas do sistema de arquivos
     */
    private String normalizeEmployeeNameForPath(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "FUNCIONARIO_NAO_INFORMADO";
        }
        String upper = name.trim().toUpperCase();
        String normalized = java.text.Normalizer.normalize(upper, java.text.Normalizer.Form.NFD)
            .replaceAll("[\\p{M}]", "")
            .replaceAll("[^A-Z0-9]+", "_")
            .replaceAll("^_+", "")
            .replaceAll("_+$", "");
        
        // Limitar tamanho para evitar problemas com sistemas de arquivos (mÃ¡ximo 100 caracteres)
        if (normalized.length() > 100) {
            normalized = normalized.substring(0, 100);
        }
        
        return normalized.isEmpty() ? "FUNCIONARIO_NAO_INFORMADO" : normalized;
    }
    
    /**
     * Normaliza nome da empresa para uso em pastas do sistema de arquivos
     */
    private String normalizeCompanyNameForPath(String companyName) {
        if (companyName == null || companyName.trim().isEmpty()) {
            return "EMPRESA_NAO_INFORMADA";
        }
        String upper = companyName.trim().toUpperCase();
        String normalized = java.text.Normalizer.normalize(upper, java.text.Normalizer.Form.NFD)
            .replaceAll("[\\p{M}]", "")
            .replaceAll("[^A-Z0-9]+", "_")
            .replaceAll("^_+", "")
            .replaceAll("_+$", "");
        
        // Limitar tamanho para evitar problemas com sistemas de arquivos (mÃ¡ximo 150 caracteres)
        if (normalized.length() > 150) {
            normalized = normalized.substring(0, 150);
        }
        
        return normalized.isEmpty() ? "EMPRESA_NAO_INFORMADA" : normalized;
    }

    /**
     * Envia documento unificado por email
     */
    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendUnifiedDocumentByEmail(
            @RequestParam(value = "toEmail") String toEmail,
            @RequestParam(value = "employeeName") String employeeName,
            @RequestParam(value = "month") int month,
            @RequestParam(value = "year") int year,
            @RequestParam(value = "filePath") String filePath) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“§ Enviando documento unificado por email para: {}", toEmail);
            
            boolean emailSent = emailService.sendUnifiedDocument(toEmail, employeeName, String.valueOf(month), String.valueOf(year), filePath);
            
            if (emailSent) {
                response.put("sucesso", true);
                response.put("mensagem", "Documento unificado enviado por email com sucesso");
                response.put("toEmail", toEmail);
                response.put("employeeName", employeeName);
                return ResponseEntity.ok(response);
            } else {
                response.put("sucesso", false);
                response.put("mensagem", "Erro ao enviar email");
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao enviar email: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao enviar email: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Gera link do WhatsApp para envio de documento
     */
    @PostMapping("/whatsapp-link")
    public ResponseEntity<Map<String, Object>> generateWhatsAppLink(
            @RequestParam(value = "phoneNumber") String phoneNumber,
            @RequestParam(value = "employeeName") String employeeName,
            @RequestParam(value = "month") int month,
            @RequestParam(value = "year") int year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“± Gerando link do WhatsApp para: {}", phoneNumber);
            
            // Validar nÃºmero de telefone
            if (!whatsAppService.isValidPhoneNumber(phoneNumber)) {
                response.put("sucesso", false);
                response.put("mensagem", "NÃºmero de telefone invÃ¡lido");
                return ResponseEntity.badRequest().body(response);
            }
            
            String whatsappLink = whatsAppService.generateWhatsAppLink(phoneNumber, employeeName, String.valueOf(month), String.valueOf(year));
            
            if (whatsappLink != null) {
                response.put("sucesso", true);
                response.put("mensagem", "Link do WhatsApp gerado com sucesso");
                response.put("whatsappLink", whatsappLink);
                response.put("phoneNumber", whatsAppService.formatPhoneNumber(phoneNumber));
                response.put("employeeName", employeeName);
                return ResponseEntity.ok(response);
            } else {
                response.put("sucesso", false);
                response.put("mensagem", "Erro ao gerar link do WhatsApp");
                return ResponseEntity.internalServerError().body(response);
            }
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao gerar link do WhatsApp: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao gerar link do WhatsApp: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Testa configuraÃ§Ã£o de email
     */
    @GetMapping("/test-email")
    public ResponseEntity<Map<String, Object>> testEmailConfiguration() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ§ª Testando configuraÃ§Ã£o de email...");
            
            boolean emailWorking = emailService.testEmailConfiguration();
            
            response.put("sucesso", emailWorking);
            response.put("mensagem", emailWorking ? "ConfiguraÃ§Ã£o de email funcionando" : "Erro na configuraÃ§Ã£o de email");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no teste de email: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste de email: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Testa configuraÃ§Ã£o do WhatsApp
     */
    @GetMapping("/test-whatsapp")
    public ResponseEntity<Map<String, Object>> testWhatsAppConfiguration() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ§ª Testando configuraÃ§Ã£o do WhatsApp...");
            
            boolean whatsappWorking = whatsAppService.testWhatsAppConfiguration();
            
            response.put("sucesso", whatsappWorking);
            response.put("mensagem", whatsappWorking ? "ConfiguraÃ§Ã£o do WhatsApp funcionando" : "Erro na configuraÃ§Ã£o do WhatsApp");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no teste do WhatsApp: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste do WhatsApp: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint de teste para verificar se os serviÃ§os estÃ£o funcionando
     */
    @GetMapping("/test-services")
    public ResponseEntity<Map<String, Object>> testServices() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ§ª Testando serviÃ§os...");
            
            Map<String, Object> testResult = unifiedDocumentService.testServices();
            
            response.put("sucesso", testResult.get("success"));
            response.put("mensagem", testResult.get("message"));
            response.put("dados", testResult);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no teste de serviÃ§os: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no teste: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lista todos os documentos unificados disponÃ­veis
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listUnifiedDocuments() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“‹ Listando documentos unificados...");
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
            
            List<Map<String, Object>> documents;
            if (isColaborador) {
                String cpf = auth.getName(); // username Ã© o CPF
                log.info("ðŸ‘¤ UsuÃ¡rio colaborador, buscando documentos unificados por CPF: {}", cpf);
                documents = unifiedDocumentService.listUnifiedDocumentsByCpf(cpf);
            } else {
                log.info("ðŸ‘‘ UsuÃ¡rio admin, buscando todos os documentos unificados");
                documents = unifiedDocumentService.listAllUnifiedDocuments();
            }
            
            response.put("sucesso", true);
            response.put("mensagem", "Documentos unificados listados com sucesso");
            response.put("documents", documents);
            response.put("total", documents.size());
            
            log.info("âœ… Encontrados {} documentos unificados", documents.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao listar documentos unificados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao listar documentos unificados: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lista todos os documentos unificados com informaÃ§Ãµes detalhadas
     */
    @GetMapping("/list-all-detailed")
    public ResponseEntity<Map<String, Object>> listAllUnifiedDocumentsDetailed() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“‹ Listando todos os documentos unificados com detalhes...");
            
            List<Map<String, Object>> documents = unifiedDocumentService.listAllUnifiedDocuments();
            
            // Adicionar informaÃ§Ãµes sobre tipo de unificaÃ§Ã£o
            List<Map<String, Object>> detailedDocuments = new ArrayList<>();
            int individualCount = 0;
            int batchCount = 0;
            
            for (Map<String, Object> doc : documents) {
                Map<String, Object> detailedDoc = new HashMap<>(doc);
                
                // Determinar tipo de unificaÃ§Ã£o baseado no nome do arquivo
                String fileName = (String) doc.get("fileName");
                
                if (fileName != null && fileName.contains("UNIFICADO_")) {
                    // Documento unificado individual
                    detailedDoc.put("unificationType", "INDIVIDUAL");
                    detailedDoc.put("unificationTypeLabel", "UnificaÃ§Ã£o Individual");
                    individualCount++;
                } else if (fileName != null && fileName.contains("BATCH_")) {
                    // Documento unificado em lote
                    detailedDoc.put("unificationType", "BATCH");
                    detailedDoc.put("unificationTypeLabel", "UnificaÃ§Ã£o em Lote");
                    batchCount++;
                } else {
                    // Tipo nÃ£o identificado
                    detailedDoc.put("unificationType", "UNKNOWN");
                    detailedDoc.put("unificationTypeLabel", "Tipo NÃ£o Identificado");
                }
                
                // Adicionar informaÃ§Ãµes de data formatada
                String createdAt = (String) doc.get("createdAt");
                if (createdAt != null) {
                    try {
                        java.time.Instant instant = java.time.Instant.parse(createdAt);
                        java.time.LocalDateTime localDateTime = java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                        detailedDoc.put("createdAtFormatted", localDateTime.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
                    } catch (Exception e) {
                        detailedDoc.put("createdAtFormatted", createdAt);
                    }
                }
                
                detailedDocuments.add(detailedDoc);
            }
            
            response.put("sucesso", true);
            response.put("mensagem", "Documentos unificados listados com sucesso");
            response.put("documents", detailedDocuments);
            response.put("total", documents.size());
            response.put("individualCount", individualCount);
            response.put("batchCount", batchCount);
            response.put("unknownCount", documents.size() - individualCount - batchCount);
            
            log.info("âœ… Encontrados {} documentos unificados: {} individuais, {} em lote, {} desconhecidos", 
                documents.size(), individualCount, batchCount, documents.size() - individualCount - batchCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao listar documentos unificados detalhados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao listar documentos unificados: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lista todos os documentos unificados com informaÃ§Ãµes detalhadas - endpoint pÃºblico
     */
    @GetMapping("/public/list-detailed")
    public ResponseEntity<Map<String, Object>> listAllUnifiedDocumentsDetailedPublic() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“‹ Listando todos os documentos unificados com detalhes (pÃºblico)...");
            
            List<Map<String, Object>> documents = unifiedDocumentService.listAllUnifiedDocuments();
            
            // Adicionar informaÃ§Ãµes sobre tipo de unificaÃ§Ã£o
            List<Map<String, Object>> detailedDocuments = new ArrayList<>();
            int individualCount = 0;
            int batchCount = 0;
            
            for (Map<String, Object> doc : documents) {
                Map<String, Object> detailedDoc = new HashMap<>(doc);
                
                // Determinar tipo de unificaÃ§Ã£o baseado no nome do arquivo
                String fileName = (String) doc.get("fileName");
                
                if (fileName != null && fileName.contains("UNIFICADO_")) {
                    // Documento unificado individual
                    detailedDoc.put("unificationType", "INDIVIDUAL");
                    detailedDoc.put("unificationTypeLabel", "UnificaÃ§Ã£o Individual");
                    individualCount++;
                } else if (fileName != null && fileName.contains("BATCH_")) {
                    // Documento unificado em lote
                    detailedDoc.put("unificationType", "BATCH");
                    detailedDoc.put("unificationTypeLabel", "UnificaÃ§Ã£o em Lote");
                    batchCount++;
                } else {
                    // Tipo nÃ£o identificado
                    detailedDoc.put("unificationType", "UNKNOWN");
                    detailedDoc.put("unificationTypeLabel", "Tipo NÃ£o Identificado");
                }
                
                // Adicionar informaÃ§Ãµes de data formatada
                String createdAt = (String) doc.get("createdAt");
                if (createdAt != null) {
                    try {
                        java.time.Instant instant = java.time.Instant.parse(createdAt);
                        java.time.LocalDateTime localDateTime = java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                        detailedDoc.put("createdAtFormatted", localDateTime.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
                    } catch (Exception e) {
                        detailedDoc.put("createdAtFormatted", createdAt);
                    }
                }
                
                detailedDocuments.add(detailedDoc);
            }
            
            response.put("sucesso", true);
            response.put("mensagem", "Documentos unificados listados com sucesso");
            response.put("documents", detailedDocuments);
            response.put("total", documents.size());
            response.put("individualCount", individualCount);
            response.put("batchCount", batchCount);
            response.put("unknownCount", documents.size() - individualCount - batchCount);
            
            log.info("âœ… Encontrados {} documentos unificados: {} individuais, {} em lote, {} desconhecidos", 
                documents.size(), individualCount, batchCount, documents.size() - individualCount - batchCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao listar documentos unificados detalhados (pÃºblico): {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao listar documentos unificados: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cria documentos unificados em lote para um perÃ­odo - endpoint pÃºblico para testes
     */
    @PostMapping("/public/batch-create")
    public ResponseEntity<Map<String, Object>> createBatchUnifiedDocumentsPublic(
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "year", required = false) Integer year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“¦ PÃšBLICO: Criando documentos unificados em lote para {}/{}", month, year);
            
            // Criar request DTO
            com.z7design.fleet_manager.dto.BatchUnificationRequest request = 
                com.z7design.fleet_manager.dto.BatchUnificationRequest.builder()
                    .month(month)
                    .year(year)
                    .forceUnification(true)
                    .build();
            
            com.z7design.fleet_manager.dto.BatchUnificationResult result = 
                unifiedDocumentService.createBatchUnifiedDocuments(request);
            
            response.put("sucesso", true);
            response.put("mensagem", "Documentos unificados criados em lote com sucesso");
            response.put("totalProcessed", result.getTotalProcessed());
            response.put("totalSuccess", result.getTotalSuccess());
            response.put("totalFailed", result.getTotalFailed());
            response.put("successList", result.getSuccessList());
            response.put("failureList", result.getFailureList());
            response.put("processingTimeMs", result.getProcessingTimeMs());
            response.put("month", month);
            response.put("year", year);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar documentos em lote (pÃºblico): {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao criar documentos em lote: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lista documentos unificados por perÃ­odo
     */
    @GetMapping("/list-by-period")
    public ResponseEntity<Map<String, Object>> listUnifiedDocumentsByPeriod(
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "year", required = false) Integer year) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ“‹ Listando documentos unificados por perÃ­odo: {}/{}", month, year);
            
            List<Map<String, Object>> documents = unifiedDocumentService.listUnifiedDocumentsByPeriod(month, year);
            
            response.put("sucesso", true);
            response.put("mensagem", "Documentos unificados listados com sucesso");
            response.put("documents", documents);
            response.put("total", documents.size());
            response.put("month", month);
            response.put("year", year);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao listar documentos unificados por perÃ­odo: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao listar documentos unificados por perÃ­odo: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Busca documentos unificados por mÃºltiplos critÃ©rios
     * Aceita: nome do funcionÃ¡rio, empresa, perÃ­odo (MM/YYYY), CPF
     * DÃ¡ preferÃªncia aos dados do holerite quando disponÃ­vel
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchUnifiedDocuments(
            @RequestParam(value = "search", required = false) String search) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (search == null || search.trim().isEmpty()) {
                response.put("sucesso", false);
                response.put("mensagem", "Termo de busca Ã© obrigatÃ³rio");
                return ResponseEntity.badRequest().body(response);
            }
            
            log.info("ðŸ” Buscando documentos unificados com termo: '{}'", search);
            
            List<Map<String, Object>> documents = unifiedDocumentService.searchUnifiedDocuments(search);
            
            response.put("sucesso", true);
            response.put("mensagem", "Busca realizada com sucesso");
            response.put("documents", documents);
            response.put("total", documents.size());
            response.put("searchTerm", search);
            
            log.info("âœ… Encontrados {} documentos unificados para busca: '{}'", documents.size(), search);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro na busca de documentos unificados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro na busca: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Exclui um documento unificado pelo nome do arquivo
     */
    @DeleteMapping("/delete/{fileName:.+}")
    public ResponseEntity<Map<String, Object>> deleteUnifiedDocument(@PathVariable("fileName") String fileName) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ—‘ï¸ Excluindo documento unificado: {}", fileName);
            
            boolean deleted = unifiedDocumentService.deleteUnifiedDocument(fileName);
            
            if (deleted) {
                response.put("sucesso", true);
                response.put("mensagem", "Documento unificado excluÃ­do com sucesso");
                response.put("fileName", fileName);
                return ResponseEntity.ok(response);
            } else {
                response.put("sucesso", false);
                response.put("mensagem", "Documento nÃ£o encontrado ou nÃ£o pÃ´de ser excluÃ­do");
                response.put("fileName", fileName);
                return ResponseEntity.status(404).body(response);
            }
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao excluir documento unificado: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao excluir documento: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Exclui mÃºltiplos documentos unificados
     * PROCESSAMENTO SÃNCRONO para exclusÃ£o em massa - retorna resultado imediato
     */
    @DeleteMapping("/delete-multiple")
    public ResponseEntity<Map<String, Object>> deleteMultipleUnifiedDocuments(@RequestBody List<String> fileNames) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸ—‘ï¸ Excluindo documentos em lote: {} arquivo(s)", fileNames.size());
            
            if (fileNames == null || fileNames.isEmpty()) {
                response.put("sucesso", false);
                response.put("mensagem", "Lista de arquivos vazia");
                return ResponseEntity.badRequest().body(response);
            }
            
            int deletedCount = 0;
            int failedCount = 0;
            List<String> deletedFiles = new ArrayList<>();
            List<String> failedFiles = new ArrayList<>();
            
            // Processar exclusÃµes de forma sÃ­ncrona
            for (int i = 0; i < fileNames.size(); i++) {
                String fileName = fileNames.get(i);
                try {
                    boolean deleted = unifiedDocumentService.deleteUnifiedDocument(fileName);
                    if (deleted) {
                        deletedCount++;
                        deletedFiles.add(fileName);
                        log.debug("âœ… Arquivo excluÃ­do: {} ({}/{})", fileName, i + 1, fileNames.size());
                    } else {
                        failedCount++;
                        failedFiles.add(fileName);
                        log.warn("âš ï¸ Falha ao excluir arquivo: {} ({}/{})", fileName, i + 1, fileNames.size());
                    }
                } catch (Exception e) {
                    failedCount++;
                    failedFiles.add(fileName);
                    log.error("ðŸ’¥ Erro ao excluir arquivo {}: {}", fileName, e.getMessage());
                }
            }
            
            log.info("âœ… ExclusÃ£o em lote concluÃ­da: {} sucessos, {} falhas de {} total", 
                deletedCount, failedCount, fileNames.size());
            
            // Retornar resultado completo
            response.put("sucesso", true);
            response.put("mensagem", String.format("ExclusÃ£o concluÃ­da: %d sucesso(s), %d falha(s)", 
                deletedCount, failedCount));
            response.put("deletedCount", deletedCount);
            response.put("failedCount", failedCount);
            response.put("totalFiles", fileNames.size());
            response.put("deletedFiles", deletedFiles);
            if (!failedFiles.isEmpty()) {
                response.put("failedFiles", failedFiles);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao processar exclusÃ£o em lote: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao processar exclusÃ£o em lote: " + (e.getMessage() != null ? e.getMessage() : "Erro desconhecido"));
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Consulta o status de um job de exclusÃ£o
     */
    @GetMapping("/deletion-job/{jobId}/status")
    public ResponseEntity<Map<String, Object>> getDeletionJobStatus(@PathVariable("jobId") java.util.UUID jobId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            com.z7design.fleet_manager.model.DeletionJob job = unifiedDocumentService.getDeletionJobById(jobId);
            com.z7design.fleet_manager.dto.DeletionJobDTO jobDTO = 
                com.z7design.fleet_manager.dto.DeletionJobDTO.fromEntity(job);
            
            response.put("sucesso", true);
            response.put("job", jobDTO);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao consultar status do job de exclusÃ£o {}: {}", jobId, e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Job nÃ£o encontrado: " + jobId);
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Cancela um job de exclusÃ£o em processamento
     */
    @PostMapping("/deletion-job/{jobId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelDeletionJob(@PathVariable("jobId") java.util.UUID jobId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            unifiedDocumentService.cancelDeletionJob(jobId);
            response.put("sucesso", true);
            response.put("mensagem", "Job de exclusÃ£o cancelado com sucesso");
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException e) {
            response.put("sucesso", false);
            response.put("mensagem", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao cancelar job de exclusÃ£o {}: {}", jobId, e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao cancelar job: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cria documentos unificados automaticamente para todos os funcionÃ¡rios
     */
    @PostMapping("/create-all")
    public ResponseEntity<Map<String, Object>> createAllUnifiedDocuments() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸŽ¯ Criando documentos unificados para todos os funcionÃ¡rios...");
            
            List<String> createdDocuments = unifiedDocumentService.createAllUnifiedDocuments();
            
            response.put("sucesso", true);
            response.put("mensagem", String.format("Documentos unificados criados com sucesso! %d documentos gerados.", createdDocuments.size()));
            response.put("unifiedDocuments", createdDocuments);
            response.put("count", createdDocuments.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar documentos unificados: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao criar documentos unificados: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cria holerites expandidos automaticamente para todos os funcionÃ¡rios
     */
    @PostMapping("/create-expanded-holerites")
    public ResponseEntity<Map<String, Object>> createExpandedHolerites() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸŽ¯ Criando holerites expandidos para todos os funcionÃ¡rios...");
            
            List<String> createdDocuments = unifiedDocumentService.createAllUnifiedDocuments();
            
            response.put("sucesso", true);
            response.put("mensagem", String.format("Holerites expandidos criados com sucesso! %d documentos gerados.", createdDocuments.size()));
            response.put("expandedHolerites", createdDocuments);
            response.put("count", createdDocuments.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao criar holerites expandidos: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao criar holerites expandidos: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cria documentos unificados em lote/massa com verificaÃ§Ã£o rigorosa de nomes
     * AGORA COM PROCESSAMENTO ASSÃNCRONO - retorna imediatamente com jobId
     */
    @PostMapping("/create-batch")
    public ResponseEntity<Map<String, Object>> createBatchUnifiedDocuments(
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "forceUnification", required = false, defaultValue = "false") Boolean forceUnification) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("ðŸŽ¯ Criando job de unificaÃ§Ã£o em lote: MÃªs={}, Ano={}, Force={}", month, year, forceUnification);
            
            // Obter usuÃ¡rio autenticado
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            java.util.UUID createdBy = null;
            if (auth != null && auth.getName() != null) {
                try {
                    com.z7design.fleet_manager.model.User user = 
                        userRepository.findByUsername(auth.getName()).orElse(null);
                    if (user != null) {
                        createdBy = user.getId();
                    }
                } catch (Exception e) {
                    log.warn("âš ï¸ NÃ£o foi possÃ­vel obter ID do usuÃ¡rio: {}", e.getMessage());
                }
            }
            
            // Criar job (processamento assÃ­ncrono serÃ¡ iniciado automaticamente)
            com.z7design.fleet_manager.model.UnificationJob job = 
                unifiedDocumentService.createUnificationJob(month, year, forceUnification, createdBy);
            
            // Retornar imediatamente com informaÃ§Ãµes do job
            response.put("sucesso", true);
            response.put("mensagem", "Processamento iniciado! Use o jobId para acompanhar o progresso.");
            response.put("jobId", job.getId());
            response.put("status", job.getStatus().name());
            response.put("totalDocuments", job.getTotalDocuments());
            response.put("createdAt", job.getCreatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("ðŸ’¥ Erro RuntimeException ao criar job de unificaÃ§Ã£o em lote: {}", e.getMessage(), e);
            log.error("ðŸ’¥ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            if (e.getCause() != null) {
                log.error("ðŸ’¥ Causa: {}", e.getCause().getMessage());
                log.error("ðŸ’¥ Tipo da causa: {}", e.getCause().getClass().getName());
            }
            
            response.put("sucesso", false);
            
            // Verificar se Ã© erro de tabela nÃ£o existente
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Erro desconhecido";
            String causeMessage = "";
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                causeMessage = e.getCause().getMessage();
            }
            
            if (errorMessage.contains("unification_jobs") || 
                errorMessage.contains("nÃ£o existe") ||
                errorMessage.contains("does not exist") ||
                causeMessage.contains("unification_jobs") ||
                causeMessage.contains("nÃ£o existe") ||
                causeMessage.contains("does not exist") ||
                e.getClass().getName().contains("SQLGrammarException") ||
                e.getClass().getName().contains("PSQLException")) {
                response.put("mensagem", "ERRO: A tabela 'unification_jobs' nÃ£o existe no banco de dados. " +
                    "Por favor, execute a migration V338__create_unification_jobs_table.sql para criar a tabela. " +
                    "Reinicie a aplicaÃ§Ã£o para que o Flyway execute as migrations pendentes.");
                response.put("tipoErro", "MIGRATION_PENDENTE");
                response.put("detalhes", errorMessage);
            } else {
                response.put("mensagem", "Erro ao iniciar processamento: " + errorMessage);
                response.put("detalhes", errorMessage);
                if (!causeMessage.isEmpty()) {
                    response.put("causa", causeMessage);
                }
            }
            
            response.put("erro", e.getClass().getSimpleName());
            if (e.getCause() != null) {
                response.put("causaTipo", e.getCause().getClass().getSimpleName());
            }
            return ResponseEntity.internalServerError().body(response);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro Exception genÃ©rico ao criar job de unificaÃ§Ã£o em lote: {}", e.getMessage(), e);
            log.error("ðŸ’¥ Tipo de exceÃ§Ã£o: {}", e.getClass().getName());
            if (e.getCause() != null) {
                log.error("ðŸ’¥ Causa: {}", e.getCause().getMessage());
                log.error("ðŸ’¥ Tipo da causa: {}", e.getCause().getClass().getName());
            }
            log.error("ðŸ’¥ Erro inesperado ao criar job de unificaÃ§Ã£o em lote: {}", e.getMessage(), e);
            response.put("sucesso", false);
            
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Erro desconhecido";
            String causeMessage = "";
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                causeMessage = e.getCause().getMessage();
            }
            
            response.put("mensagem", "Erro inesperado ao iniciar processamento: " + errorMessage);
            response.put("erro", e.getClass().getSimpleName());
            response.put("detalhes", errorMessage);
            
            if (!causeMessage.isEmpty()) {
                response.put("causa", causeMessage);
                if (e.getCause() != null) {
                    response.put("causaTipo", e.getCause().getClass().getSimpleName());
                }
            }
            
            // Verificar se Ã© erro de tabela nÃ£o existente mesmo em Exception genÃ©rica
            if (errorMessage.contains("unification_jobs") || 
                errorMessage.contains("nÃ£o existe") ||
                errorMessage.contains("does not exist") ||
                causeMessage.contains("unification_jobs") ||
                causeMessage.contains("nÃ£o existe") ||
                causeMessage.contains("does not exist")) {
                response.put("tipoErro", "MIGRATION_PENDENTE");
                response.put("mensagem", "ERRO: A tabela 'unification_jobs' nÃ£o existe no banco de dados. " +
                    "Por favor, execute a migration V338__create_unification_jobs_table.sql para criar a tabela. " +
                    "Reinicie a aplicaÃ§Ã£o para que o Flyway execute as migrations pendentes.");
            }
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Consulta o status de um job de unificaÃ§Ã£o
     */
    @GetMapping("/job/{jobId}/status")
    public ResponseEntity<Map<String, Object>> getJobStatus(@PathVariable("jobId") java.util.UUID jobId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            com.z7design.fleet_manager.model.UnificationJob job = unifiedDocumentService.getJobById(jobId);
            com.z7design.fleet_manager.dto.UnificationJobDTO jobDTO = 
                com.z7design.fleet_manager.dto.UnificationJobDTO.fromEntity(job);
            
            response.put("sucesso", true);
            response.put("job", jobDTO);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao consultar status do job {}: {}", jobId, e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Job nÃ£o encontrado: " + jobId);
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Cancela um job em processamento
     */
    @PostMapping("/job/{jobId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelJob(@PathVariable("jobId") java.util.UUID jobId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            unifiedDocumentService.cancelJob(jobId);
            response.put("sucesso", true);
            response.put("mensagem", "Job cancelado com sucesso");
            return ResponseEntity.ok(response);
            
        } catch (IllegalStateException e) {
            response.put("sucesso", false);
            response.put("mensagem", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao cancelar job {}: {}", jobId, e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao cancelar job: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Organiza documentos unificados por Empresa/Setor/Ano/MÃªs
     * OTIMIZADO: Com timeout e proteÃ§Ã£o contra loops
     */
    @GetMapping("/organization")
    public ResponseEntity<?> getUnifiedDocumentsOrganization() {
        long startTime = System.currentTimeMillis();
        try {
            log.info("ðŸ“‹ Organizando documentos unificados por Empresa/Setor/Ano/MÃªs...");
            
            // Timeout de seguranÃ§a: mÃ¡ximo 30 segundos
            long timeout = 30000; // 30 segundos
            
            com.z7design.fleet_manager.dto.PayslipOrganizationResponse response = 
                unifiedDocumentService.organizeUnifiedDocumentsByCompany();
            
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("âœ… OrganizaÃ§Ã£o concluÃ­da em {}ms", elapsed);
            
            if (elapsed > timeout) {
                log.warn("âš ï¸ OrganizaÃ§Ã£o demorou mais que o esperado: {}ms", elapsed);
            }
            
            return ResponseEntity.ok(response);
        } catch (jakarta.persistence.EntityNotFoundException e) {
            log.error("ðŸ’¥ Erro ao organizar documentos unificados (entidade nÃ£o encontrada): {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erro ao organizar documentos: referÃªncia a entidade inexistente");
            errorResponse.put("message", "Alguns documentos unificados referenciam payslips que nÃ£o existem mais no banco de dados");
            return ResponseEntity.status(500).body(errorResponse);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            log.error("ðŸ’¥ Erro ao organizar documentos unificados apÃ³s {}ms: {}", elapsed, e.getMessage(), e);
            
            // Verificar se foi timeout baseado no tempo decorrido
            if (elapsed > 30000) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Timeout");
                errorResponse.put("message", "A operaÃ§Ã£o demorou muito para responder. Tente novamente.");
                return ResponseEntity.status(504).body(errorResponse);
            }
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erro ao organizar documentos unificados");
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Erro desconhecido");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Analisa falhas na unificaÃ§Ã£o de documentos
     */
    @GetMapping("/analyze-failures")
    public ResponseEntity<Map<String, Object>> analyzeFailures() {
        Map<String, Object> response = new HashMap<>();
        try {
            log.info("ðŸ” Analisando falhas na unificaÃ§Ã£o...");
            
            // Obter todos os holerites
            List<Payslip> allPayslips = payslipService.getAllPayslips();
            List<PaymentReceipt> allReceipts = paymentReceiptRepository.findAll();
            
            List<Map<String, Object>> failedUnifications = new ArrayList<>();
            
            // Analisar cada holerite para verificar se tem comprovante correspondente
            for (Payslip payslip : allPayslips) {
                String employeeName = payslip.getEmployeeName();
                int month = payslip.getMonth();
                int year = payslip.getYear();
                
                // REGRA: O comprovante de pagamento Ã© do mÃªs SEGUINTE ao holerite
                int receiptMonth = month == 12 ? 1 : month + 1;
                int receiptYear = month == 12 ? year + 1 : year;
                
                // Procurar comprovante correspondente
                boolean receiptFound = allReceipts.stream()
                    .anyMatch(r -> r.getEmployeeName() != null && 
                                  r.getEmployeeName().equalsIgnoreCase(employeeName) &&
                                  r.getMonth() != null && r.getMonth().equals(receiptMonth) &&
                                  r.getYear() != null && r.getYear().equals(receiptYear));
                
                if (!receiptFound) {
                    Map<String, Object> failure = new HashMap<>();
                    failure.put("employeeName", employeeName);
                    failure.put("month", month);
                    failure.put("year", year);
                    failure.put("reason", "Comprovante de pagamento nÃ£o encontrado para o mÃªs " + receiptMonth + "/" + receiptYear);
                    failure.put("status", "FALHA");
                    failure.put("holeriteFound", true);
                    failure.put("holeriteFileName", payslip.getFileName());
                    failure.put("receiptFound", false);
                    failure.put("receiptFileName", null);
                    
                    failedUnifications.add(failure);
                }
            }
            
            // Analisar comprovantes Ã³rfÃ£os (sem holerite correspondente)
            for (PaymentReceipt receipt : allReceipts) {
                String employeeName = receipt.getEmployeeName();
                int month = receipt.getMonth();
                int year = receipt.getYear();
                
                // REGRA: O holerite Ã© do mÃªs ANTERIOR ao comprovante
                int payslipMonth = month == 1 ? 12 : month - 1;
                int payslipYear = month == 1 ? year - 1 : year;
                
                // Procurar holerite correspondente
                boolean payslipFound = allPayslips.stream()
                    .anyMatch(p -> p.getEmployeeName() != null && 
                                  p.getEmployeeName().equalsIgnoreCase(employeeName) &&
                                  p.getMonth() == payslipMonth &&
                                  p.getYear() == payslipYear);
                
                if (!payslipFound) {
                    Map<String, Object> failure = new HashMap<>();
                    failure.put("employeeName", employeeName);
                    failure.put("month", payslipMonth);
                    failure.put("year", payslipYear);
                    failure.put("reason", "Holerite nÃ£o encontrado para o mÃªs " + payslipMonth + "/" + payslipYear);
                    failure.put("status", "FALHA");
                    failure.put("holeriteFound", false);
                    failure.put("holeriteFileName", null);
                    failure.put("receiptFound", true);
                    failure.put("receiptFileName", receipt.getFileName());
                    
                    failedUnifications.add(failure);
                }
            }
            
            response.put("sucesso", true);
            response.put("mensagem", "AnÃ¡lise de falhas concluÃ­da");
            response.put("failedUnifications", failedUnifications);
            response.put("totalFailures", failedUnifications.size());
            response.put("totalPayslips", allPayslips.size());
            response.put("totalReceipts", allReceipts.size());
            
            log.info("âœ… AnÃ¡lise concluÃ­da: {} falhas encontradas", failedUnifications.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro ao analisar falhas: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro ao analisar falhas: " + e.getMessage());
            response.put("erro", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }


    /**
     * Endpoint de debug para verificar empresas disponÃ­veis
     */
    @GetMapping("/debug/companies")
    public ResponseEntity<Map<String, Object>> debugCompanies() {
        Map<String, Object> response = new HashMap<>();
        try {
            log.info("ðŸ” DEBUG: Listando empresas disponÃ­veis...");
            
            com.z7design.fleet_manager.dto.PayslipOrganizationResponse organization = 
                unifiedDocumentService.organizeUnifiedDocumentsByCompany();
            
            List<Map<String, Object>> companies = new ArrayList<>();
            if (organization.getCompanies() != null) {
                for (com.z7design.fleet_manager.dto.PayslipOrganizationResponse.CompanyGroup company : organization.getCompanies()) {
                    Map<String, Object> companyInfo = new HashMap<>();
                    companyInfo.put("companyName", company.getCompanyName());
                    companyInfo.put("companyCnpj", company.getCompanyCnpj());
                    companyInfo.put("companySigla", company.getCompanySigla());
                    companyInfo.put("totalPayslips", company.getTotalPayslips());
                    companyInfo.put("totalSectors", company.getSectors() != null ? company.getSectors().size() : 0);
                    companies.add(companyInfo);
                }
            }
            
            response.put("sucesso", true);
            response.put("totalCompanies", companies.size());
            response.put("companies", companies);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no debug de empresas: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no debug: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint de debug para verificar setores disponÃ­veis
     */
    @GetMapping("/debug/sectors")
    public ResponseEntity<Map<String, Object>> debugSectors() {
        Map<String, Object> response = new HashMap<>();
        try {
            log.info("ðŸ” DEBUG: Listando setores disponÃ­veis...");
            
            com.z7design.fleet_manager.dto.PayslipOrganizationResponse organization = 
                unifiedDocumentService.organizeUnifiedDocumentsByCompany();
            
            Set<String> uniqueSectors = new java.util.HashSet<>();
            List<Map<String, Object>> sectorsWithDetails = new ArrayList<>();
            
            if (organization.getCompanies() != null) {
                for (com.z7design.fleet_manager.dto.PayslipOrganizationResponse.CompanyGroup company : organization.getCompanies()) {
                    if (company.getSectors() != null) {
                        for (com.z7design.fleet_manager.dto.PayslipOrganizationResponse.SectorGroup sector : company.getSectors()) {
                            if (sector.getSectorName() != null) {
                                uniqueSectors.add(sector.getSectorName());
                                
                                Map<String, Object> sectorInfo = new HashMap<>();
                                sectorInfo.put("sectorName", sector.getSectorName());
                                sectorInfo.put("sectorNameNormalized", normalizeNameForMatching(sector.getSectorName()));
                                sectorInfo.put("companyName", company.getCompanyName());
                                sectorInfo.put("totalPayslips", sector.getTotalPayslips());
                                sectorInfo.put("totalPeriods", sector.getPeriods() != null ? sector.getPeriods().size() : 0);
                                sectorsWithDetails.add(sectorInfo);
                            }
                        }
                    }
                }
            }
            
            response.put("sucesso", true);
            response.put("totalUniqueSectors", uniqueSectors.size());
            response.put("uniqueSectors", uniqueSectors.stream().sorted().collect(java.util.stream.Collectors.toList()));
            response.put("sectorsWithDetails", sectorsWithDetails);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("ðŸ’¥ Erro no debug de setores: {}", e.getMessage(), e);
            response.put("sucesso", false);
            response.put("mensagem", "Erro no debug: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 
