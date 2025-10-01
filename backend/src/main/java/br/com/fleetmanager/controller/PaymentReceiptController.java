package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.PaymentReceiptService;
import br.com.fleetmanager.service.ReceiptProcessingService;

import br.com.fleetmanager.dto.CreatePaymentReceiptDTO;
import br.com.fleetmanager.dto.PaymentReceiptDTO;
import br.com.fleetmanager.model.PaymentReceipt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "*")
public class PaymentReceiptController {
    
    @Autowired
    private PaymentReceiptService paymentReceiptService;
    
    @Autowired
    private ReceiptProcessingService receiptProcessingService;
    
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
    public ResponseEntity<List<PaymentReceiptDTO>> getAllPaymentReceipts() {
        try {
            List<PaymentReceiptDTO> receipts = paymentReceiptService.findAll();
            return ResponseEntity.ok(receipts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar comprovantes por ano e mês
    @GetMapping("/year/{year}/month/{month}")
    public ResponseEntity<List<PaymentReceiptDTO>> getPaymentReceiptsByYearAndMonth(
            @PathVariable Integer year, 
            @PathVariable Integer month) {
        try {
            List<PaymentReceiptDTO> receipts = paymentReceiptService.findByYearAndMonth(year, month);
            return ResponseEntity.ok(receipts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar todos os anos únicos
    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getDistinctYears() {
        try {
            List<Integer> years = paymentReceiptService.findDistinctYears();
            return ResponseEntity.ok(years);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar todos os meses únicos para um ano
    @GetMapping("/years/{year}/months")
    public ResponseEntity<List<Integer>> getDistinctMonthsByYear(@PathVariable Integer year) {
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
    
    // Download de comprovante
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String id) {
        try {
            return paymentReceiptService.downloadReceiptFile(id);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Visualizar PDF do comprovante
    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> viewReceipt(@PathVariable String id) {
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
            List<PaymentReceiptDTO> receipts = paymentReceiptService.findByStatus(br.com.fleetmanager.model.PaymentReceiptStatus.PROCESSED);
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
    
    // Processamento automático de comprovantes (NOVO ENDPOINT)
    @PostMapping("/process-automatic")
    public ResponseEntity<List<PaymentReceiptDTO>> processReceiptsAutomatic(@RequestParam("file") MultipartFile file) {
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            String contentType = file.getContentType();
            if (contentType == null || !contentType.equals("application/pdf")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            // Processar arquivo automaticamente
            List<PaymentReceipt> processedReceipts = receiptProcessingService.processReceiptFile(file);
            
            // Converter para DTOs
            List<PaymentReceiptDTO> receiptDTOs = processedReceipts.stream()
                .map(receipt -> {
                    PaymentReceiptDTO dto = new PaymentReceiptDTO();
                    dto.setId(receipt.getId());
                    dto.setEmployeeName(receipt.getEmployeeName());
                    dto.setMonth(receipt.getMonth());
                    dto.setYear(receipt.getYear());
                    dto.setGrossSalary(receipt.getGrossSalary());
                    dto.setNetSalary(receipt.getNetSalary());
                    dto.setFileName(receipt.getFileName());
                    dto.setFilePath(receipt.getFilePath());
                    dto.setStatus(receipt.getStatus());
                    dto.setCreatedAt(receipt.getCreatedAt());
                    dto.setProcessedAt(receipt.getProcessedAt());
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(receiptDTOs);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Excluir comprovante individual
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaymentReceipt(@PathVariable String id) {
        try {
            paymentReceiptService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Excluir múltiplos comprovantes
    @PostMapping("/delete-multiple")
    public ResponseEntity<Map<String, Object>> deleteMultiplePaymentReceipts(@RequestBody Map<String, List<String>> body) {
        try {
            List<String> idStrings = body.get("ids");
            if (idStrings == null || idStrings.isEmpty()) {
                Map<String, Object> result = new HashMap<>();
                result.put("deleted", 0);
                result.put("failed", 0);
                result.put("errors", List.of());
                return ResponseEntity.ok(result);
            }
            
            Map<String, Object> result = paymentReceiptService.deleteMultiplePaymentReceipts(idStrings);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("deleted", 0);
            errorResult.put("failed", 0);
            errorResult.put("errors", List.of("Erro interno: " + e.getMessage()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResult);
        }
    }
}
