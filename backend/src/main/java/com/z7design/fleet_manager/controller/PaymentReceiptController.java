package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.CreatePaymentReceiptDTO;
import com.z7design.fleet_manager.dto.PaymentReceiptDTO;
import com.z7design.fleet_manager.service.PaymentReceiptService;
import com.z7design.fleet_manager.dto.ReceiptProcessingResponse;
import com.z7design.fleet_manager.service.ReceiptProcessingService;
import com.z7design.fleet_manager.util.AuthenticatedCpfResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import jakarta.validation.Valid;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "*")
@Slf4j
public class PaymentReceiptController {
    
    @Autowired
    private PaymentReceiptService paymentReceiptService;
    
    @Autowired
    private ReceiptProcessingService receiptProcessingService;
    
    @Autowired
    private AuthenticatedCpfResolver authenticatedCpfResolver;
    
    // Criar novo comprovante
    @PostMapping
    public ResponseEntity<PaymentReceiptDTO> createPaymentReceipt(@Valid @RequestBody CreatePaymentReceiptDTO createDTO) {
        try {
            PaymentReceiptDTO createdReceipt = paymentReceiptService.createPaymentReceipt(createDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdReceipt);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    // Buscar todos os comprovantes
    @GetMapping
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'RH', 'FINANCEIRO', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'ROLE_FINANCEIRO', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN', 'ROLE_COLABORADOR')")
    public ResponseEntity<List<PaymentReceiptDTO>> getAllPaymentReceipts(
            @RequestParam(value = "search", required = false) String search) {
        try {
            // Se houver termo de busca, usar busca filtrada
            if (search != null && !search.trim().isEmpty() && search.trim().length() >= 4) {
                log.info("ðŸ” Buscando comprovantes com termo: '{}'", search);
                List<PaymentReceiptDTO> receipts = paymentReceiptService.search(search.trim());
                return ResponseEntity.ok(receipts);
            }
            
            log.info("ðŸ” Iniciando busca de todos os comprovantes...");
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isColaborador = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COLABORADOR"));
            
            List<PaymentReceiptDTO> receipts;
            if (isColaborador) {
                var resolvedCpf = authenticatedCpfResolver.resolve(auth);
                if (resolvedCpf.isEmpty()) {
                    log.warn("âš ï¸ NÃ£o foi possÃ­vel determinar o CPF do colaborador {}", auth.getName());
                    receipts = Collections.emptyList();
                } else {
                    log.info("ðŸ‘¤ UsuÃ¡rio colaborador, buscando comprovantes por CPF: {}", resolvedCpf.get());
                    receipts = paymentReceiptService.findByUserCpf(resolvedCpf.get());
                }
            } else {
                log.info("ðŸ‘‘ UsuÃ¡rio admin, buscando todos os comprovantes");
                receipts = paymentReceiptService.findAll();
            }
            
            log.info("âœ… Comprovantes encontrados: {} registros", receipts.size());
            return ResponseEntity.ok(receipts);
        } catch (Exception e) {
            log.error("âŒ Erro ao buscar comprovantes: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar comprovantes por ano e mÃªs
    @GetMapping("/year/{year}/month/{month}")
    public ResponseEntity<List<PaymentReceiptDTO>> getPaymentReceiptsByYearAndMonth(
            @PathVariable("year") Integer year, 
            @PathVariable("month") Integer month) {
        try {
            List<PaymentReceiptDTO> receipts = paymentReceiptService.findByYearAndMonth(year, month);
            return ResponseEntity.ok(receipts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar todos os anos Ãºnicos
    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getDistinctYears() {
        try {
            List<Integer> years = paymentReceiptService.findDistinctYears();
            return ResponseEntity.ok(years);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar todos os meses Ãºnicos para um ano
    @GetMapping("/years/{year}/months")
    public ResponseEntity<List<Integer>> getDistinctMonthsByYear(@PathVariable("year") Integer year) {
        try {
            List<Integer> months = paymentReceiptService.findDistinctMonthsByYear(year);
            return ResponseEntity.ok(months);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Contar total de comprovantes
    @GetMapping("/count")
    public ResponseEntity<Long> getTotalCount() {
        try {
            long count = paymentReceiptService.count();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Contar comprovantes processados hoje
    @GetMapping("/count/processed-today")
    public ResponseEntity<Long> getProcessedTodayCount() {
        try {
            long count = paymentReceiptService.countProcessedToday();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Download de comprovante individual
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable("id") String id) {
        try {
            log.info("ðŸ“¥ Download individual de comprovante: {}", id);
            return paymentReceiptService.downloadReceiptFile(id);
        } catch (Exception e) {
            log.error("âŒ Erro ao fazer download individual: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Download em lote de comprovantes (ZIP) - ALTA PERFORMANCE
    @PostMapping("/download-batch")
    public ResponseEntity<StreamingResponseBody> downloadBatch(@RequestBody(required = false) Map<String, Object> body) {
        try {
            log.info("ðŸ“¦ Recebida requisiÃ§Ã£o para download em lote");
            
            if (body == null) {
                log.warn("âš ï¸ Request body Ã© nulo");
                return ResponseEntity.badRequest().build();
            }
            
            Object idsObj = body.get("ids");
            if (idsObj == null) {
                log.warn("âš ï¸ Campo 'ids' nÃ£o encontrado no body");
                return ResponseEntity.badRequest().build();
            }
            
            // Converter para List<String>
            List<String> idStrings;
            try {
                if (idsObj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> idsList = (List<Object>) idsObj;
                    idStrings = idsList.stream()
                        .map(id -> id != null ? id.toString() : null)
                        .filter(id -> id != null && !id.trim().isEmpty())
                        .collect(java.util.stream.Collectors.toList());
                } else {
                    log.warn("âš ï¸ Campo 'ids' nÃ£o Ã© uma lista: {}", idsObj.getClass().getSimpleName());
                    return ResponseEntity.badRequest().build();
                }
            } catch (Exception e) {
                log.error("âŒ Erro ao converter lista de IDs: {}", e.getMessage(), e);
                return ResponseEntity.badRequest().build();
            }
            
            if (idStrings.isEmpty()) {
                log.info("ðŸ“‹ Lista de IDs vazia");
                return ResponseEntity.badRequest().build();
            }
            
            log.info("ðŸ“¦ Iniciando download em lote de {} comprovante(s)", idStrings.size());
            return paymentReceiptService.downloadBatch(idStrings);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao processar download em lote: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Visualizar PDF do comprovante
    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> viewReceipt(@PathVariable("id") String id) {
        try {
            return paymentReceiptService.viewReceiptFile(id);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar arquivos processados
    @GetMapping("/processed-files")
    public ResponseEntity<List<PaymentReceiptDTO>> getProcessedFiles() {
        try {
            List<PaymentReceiptDTO> receipts = paymentReceiptService.findByStatus(com.z7design.fleet_manager.model.PaymentReceiptStatus.PROCESSED);
            return ResponseEntity.ok(receipts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Upload de arquivo
    @PostMapping("/upload")
    public ResponseEntity<PaymentReceiptDTO> uploadPaymentReceipt(
            @RequestParam("file") MultipartFile file,
            @RequestParam("employeeName") String employeeName,
            @RequestParam("month") Integer month,
            @RequestParam("year") Integer year) {
        try {
            PaymentReceiptDTO receipt = paymentReceiptService.processUploadedFile(file, employeeName, month, year);
            return ResponseEntity.status(HttpStatus.CREATED).body(receipt);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    // Processamento automÃ¡tico de comprovantes (NOVO ENDPOINT)
    @PostMapping("/process-automatic")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN', 'RH', 'FINANCEIRO', 'COMPANY_ADMIN', 'FLEX_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'ROLE_FINANCEIRO', 'ROLE_COMPANY_ADMIN', 'ROLE_FLEX_ADMIN')")
    public ResponseEntity<ReceiptProcessingResponse> processReceiptsAutomatic(@RequestParam("file") MultipartFile file) {
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            String contentType = file.getContentType();
            if (contentType == null || !contentType.equals("application/pdf")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            // Processar arquivo automaticamente com resumo detalhado
            ReceiptProcessingResponse response = receiptProcessingService.processReceiptFileWithSummary(file);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Erro ao processar comprovantes: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Excluir comprovante individual
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePaymentReceipt(@PathVariable("id") String id) {
        try {
            log.info("ðŸ—‘ï¸ Excluindo comprovante individual: {}", id);
            
            if (id == null || id.trim().isEmpty()) {
                log.warn("âš ï¸ ID nulo ou vazio fornecido");
                Map<String, Object> error = new HashMap<>();
                error.put("error", "ID nÃ£o pode ser nulo ou vazio");
                return ResponseEntity.badRequest().body(error);
            }
            
            paymentReceiptService.deleteById(id.trim());
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Comprovante excluÃ­do com sucesso");
            result.put("id", id);
            
            log.info("âœ… Comprovante excluÃ­do com sucesso: {}", id);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.error("âŒ ID invÃ¡lido: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "ID invÃ¡lido: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("âŒ Erro ao excluir comprovante {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Erro ao excluir comprovante: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Excluir mÃºltiplos comprovantes
    @PostMapping("/delete-multiple")
    public ResponseEntity<Map<String, Object>> deleteMultiplePaymentReceipts(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("ðŸ“¥ Recebida requisiÃ§Ã£o para excluir mÃºltiplos comprovantes");
            
            if (body == null) {
                log.warn("âš ï¸ Request body Ã© nulo");
                result.put("deleted", 0);
                result.put("failed", 0);
                result.put("errors", List.of("Request body nÃ£o pode ser nulo"));
                return ResponseEntity.badRequest().body(result);
            }
            
            Object idsObj = body.get("ids");
            if (idsObj == null) {
                log.warn("âš ï¸ Campo 'ids' nÃ£o encontrado no body");
                result.put("deleted", 0);
                result.put("failed", 0);
                result.put("errors", List.of("Campo 'ids' nÃ£o encontrado no request body"));
                return ResponseEntity.badRequest().body(result);
            }
            
            // Converter para List<String>
            List<String> idStrings;
            try {
                if (idsObj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> idsList = (List<Object>) idsObj;
                    idStrings = idsList.stream()
                        .map(id -> id != null ? id.toString() : null)
                        .filter(id -> id != null && !id.trim().isEmpty())
                        .collect(java.util.stream.Collectors.toList());
                } else {
                    log.warn("âš ï¸ Campo 'ids' nÃ£o Ã© uma lista: {}", idsObj.getClass().getSimpleName());
                    result.put("deleted", 0);
                    result.put("failed", 0);
                    result.put("errors", List.of("Campo 'ids' deve ser uma lista"));
                    return ResponseEntity.badRequest().body(result);
                }
            } catch (Exception e) {
                log.error("âŒ Erro ao converter lista de IDs: {}", e.getMessage(), e);
                result.put("deleted", 0);
                result.put("failed", 0);
                result.put("errors", List.of("Erro ao processar lista de IDs: " + e.getMessage()));
                return ResponseEntity.badRequest().body(result);
            }
            
            if (idStrings.isEmpty()) {
                log.info("ðŸ“‹ Lista de IDs vazia apÃ³s processamento");
                result.put("deleted", 0);
                result.put("failed", 0);
                result.put("errors", new ArrayList<>());
                return ResponseEntity.ok(result);
            }
            
            log.info("ðŸ—‘ï¸ Iniciando exclusÃ£o de {} comprovantes", idStrings.size());
            
            try {
                result = paymentReceiptService.deleteMultiplePaymentReceipts(idStrings);
                
                // Garantir que o resultado sempre tenha os campos necessÃ¡rios
                if (!result.containsKey("deleted")) {
                    result.put("deleted", 0);
                }
                if (!result.containsKey("failed")) {
                    result.put("failed", 0);
                }
                if (!result.containsKey("errors")) {
                    result.put("errors", new ArrayList<>());
                }
                
                log.info("âœ… ExclusÃ£o concluÃ­da: {} excluÃ­dos, {} falharam", result.get("deleted"), result.get("failed"));
                return ResponseEntity.ok(result);
            } catch (Exception e) {
                log.error("âŒ Erro ao executar exclusÃ£o mÃºltipla: {}", e.getMessage(), e);
                result = new HashMap<>();
                result.put("deleted", 0);
                result.put("failed", idStrings.size());
                String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                result.put("errors", List.of("Erro ao excluir comprovantes: " + errorMsg));
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
            
        } catch (org.springframework.http.converter.HttpMessageNotReadableException e) {
            log.error("âŒ Erro ao ler request body: {}", e.getMessage(), e);
            result = new HashMap<>();
            result.put("deleted", 0);
            result.put("failed", 0);
            result.put("errors", List.of("Erro ao processar request body: " + e.getMessage()));
            return ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("âŒ Erro inesperado ao processar exclusÃ£o mÃºltipla: {}", e.getMessage(), e);
            result = new HashMap<>();
            result.put("deleted", 0);
            result.put("failed", 0);
            String errorMessage = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            result.put("errors", List.of("Erro interno: " + errorMessage));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}

