package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.CreatePaymentReceiptDTO;
import br.com.fleetmanager.dto.PaymentReceiptDTO;
import br.com.fleetmanager.model.PaymentReceipt;
import br.com.fleetmanager.model.PaymentReceiptStatus;
import br.com.fleetmanager.repository.PaymentReceiptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class PaymentReceiptService {

    @Autowired
    private PaymentReceiptRepository paymentReceiptRepository;
    
    public PaymentReceiptDTO createPaymentReceipt(CreatePaymentReceiptDTO createDTO) {
        PaymentReceipt paymentReceipt = new PaymentReceipt(
            createDTO.getEmployeeId(),
            createDTO.getEmployeeName(),
            createDTO.getMonth(),
            createDTO.getYear(),
            createDTO.getFileName(),
            createDTO.getFilePath(),
            PaymentReceiptStatus.PENDING
        );
        
        // Definir campos adicionais
        paymentReceipt.setReceiptNumber(createDTO.getReceiptNumber());
        paymentReceipt.setPaymentDate(createDTO.getPaymentDate());
        paymentReceipt.setGrossSalary(createDTO.getGrossSalary());
        paymentReceipt.setNetSalary(createDTO.getNetSalary());
        paymentReceipt.setFileSize(createDTO.getFileSize());
        paymentReceipt.setNotes(createDTO.getNotes());
        paymentReceipt.setCreatedBy(createDTO.getCreatedBy());
        
        // Campos bancários
        paymentReceipt.setDebitedAgency(createDTO.getDebitedAgency());
        paymentReceipt.setDebitedAccount(createDTO.getDebitedAccount());
        paymentReceipt.setDebitedName(createDTO.getDebitedName());
        paymentReceipt.setCreditedAgency(createDTO.getCreditedAgency());
        paymentReceipt.setCreditedAccount(createDTO.getCreditedAccount());
        paymentReceipt.setCreditedName(createDTO.getCreditedName());
        paymentReceipt.setControlNumber(createDTO.getControlNumber());
        paymentReceipt.setAuthenticationCode(createDTO.getAuthenticationCode());
        paymentReceipt.setTransferDate(createDTO.getTransferDate());
        paymentReceipt.setTransferTime(createDTO.getTransferTime());
        paymentReceipt.setBankName(createDTO.getBankName());
        paymentReceipt.setTransactionType(createDTO.getTransactionType());
        paymentReceipt.setStatementIdentification(createDTO.getStatementIdentification());
        
        PaymentReceipt savedReceipt = paymentReceiptRepository.save(paymentReceipt);
        return convertToDTO(savedReceipt);
    }
    
    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findAll() {
        return paymentReceiptRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findByYearAndMonth(Integer year, Integer month) {
        return paymentReceiptRepository.findByYearAndMonth(year, month)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<Integer> findDistinctYears() {
        return paymentReceiptRepository.findDistinctYears();
    }
    
    @Transactional(readOnly = true)
    public List<Integer> findDistinctMonthsByYear(Integer year) {
        return paymentReceiptRepository.findDistinctMonthsByYear(year);
    }
    
    @Transactional(readOnly = true)
    public long count() {
        return paymentReceiptRepository.count();
    }
    
    @Transactional(readOnly = true)
    public long countProcessedToday() {
        return paymentReceiptRepository.countProcessedToday();
    }
    
    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findByStatus(PaymentReceiptStatus status) {
        List<PaymentReceipt> receipts = paymentReceiptRepository.findByStatus(status);
        return receipts.stream()
                .map(this::convertToDTO)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<PaymentReceiptDTO> findByIds(List<UUID> ids) {
        return paymentReceiptRepository.findByIdIn(ids)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public PaymentReceiptDTO processUploadedFile(MultipartFile file, String employeeName, Integer month, Integer year) {
        try {
            // Validar arquivo
        if (file.isEmpty()) {
                throw new IllegalArgumentException("Arquivo não pode estar vazio");
            }
            
            if (!file.getContentType().equals("application/pdf")) {
                throw new IllegalArgumentException("Apenas arquivos PDF são aceitos");
            }
            
            // Criar diretório de upload se não existir
            String uploadDir = "uploads/payment-receipts/" + year + "/" + month;
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Gerar nome único para o arquivo
            String originalFileName = file.getOriginalFilename();
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String uniqueFileName = employeeName.toLowerCase().replaceAll("\\s+", "_") + "_" + 
                                  year + "_" + month + "_" + System.currentTimeMillis() + fileExtension;
            
            // Salvar arquivo
            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Criar registro no banco
            PaymentReceipt paymentReceipt = new PaymentReceipt();
            paymentReceipt.setEmployeeName(employeeName);
            paymentReceipt.setMonth(month);
            paymentReceipt.setYear(year);
            paymentReceipt.setFileName(uniqueFileName);
            paymentReceipt.setFilePath(filePath.toString());
            paymentReceipt.setFileSize(file.getSize());
            paymentReceipt.setStatus(PaymentReceiptStatus.PENDING);
            
            // Salvar no banco
            PaymentReceipt savedReceipt = paymentReceiptRepository.save(paymentReceipt);
            
            // TODO: Implementar processamento de PDF para extrair dados bancários
            // Por enquanto, marcar como processado
            savedReceipt.setStatus(PaymentReceiptStatus.PROCESSED);
            savedReceipt.setNetSalary(java.math.BigDecimal.ZERO); // Será preenchido após processamento
            savedReceipt.setGrossSalary(java.math.BigDecimal.ZERO);
            
            PaymentReceipt finalReceipt = paymentReceiptRepository.save(savedReceipt);
            
            return convertToDTO(finalReceipt);
            
        } catch (IOException e) {
            throw new RuntimeException("Erro ao processar arquivo: " + e.getMessage(), e);
        }
    }
    
    public void deletePaymentReceipt(UUID id) {
        paymentReceiptRepository.deleteById(id);
    }
    
    public ResponseEntity<byte[]> downloadReceiptFile(String id) {
        try {
            UUID receiptId = UUID.fromString(id);
            Optional<PaymentReceipt> receiptOpt = paymentReceiptRepository.findById(receiptId);
            
            if (receiptOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            PaymentReceipt receipt = receiptOpt.get();
            Path filePath = Paths.get(receipt.getFilePath());
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] fileContent = Files.readAllBytes(filePath);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", receipt.getFileName());
            headers.setContentLength(fileContent.length);
            
            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    public ResponseEntity<byte[]> viewReceiptFile(String id) {
        try {
            UUID receiptId = UUID.fromString(id);
            Optional<PaymentReceipt> receiptOpt = paymentReceiptRepository.findById(receiptId);
            
            if (receiptOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            PaymentReceipt receipt = receiptOpt.get();
            Path filePath = Paths.get(receipt.getFilePath());
            
            if (!Files.exists(filePath)) {
                log.warn("Arquivo não encontrado: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            byte[] fileContent = Files.readAllBytes(filePath);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", receipt.getFileName());
            headers.setContentLength(fileContent.length);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0);
            
            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("Erro ao visualizar arquivo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    private PaymentReceiptDTO convertToDTO(PaymentReceipt paymentReceipt) {
        PaymentReceiptDTO dto = new PaymentReceiptDTO();
        dto.setId(paymentReceipt.getId());
        dto.setEmployeeId(paymentReceipt.getEmployeeId());
        dto.setEmployeeName(paymentReceipt.getEmployeeName());
        dto.setMonth(paymentReceipt.getMonth());
        dto.setYear(paymentReceipt.getYear());
        dto.setReceiptNumber(paymentReceipt.getReceiptNumber());
        dto.setPaymentDate(paymentReceipt.getPaymentDate());
        dto.setGrossSalary(paymentReceipt.getGrossSalary());
        dto.setNetSalary(paymentReceipt.getNetSalary());
        dto.setFilePath(paymentReceipt.getFilePath());
        dto.setFileName(paymentReceipt.getFileName());
        dto.setFileSize(paymentReceipt.getFileSize());
        dto.setStatus(paymentReceipt.getStatus());
        dto.setNotes(paymentReceipt.getNotes());
        dto.setCreatedAt(paymentReceipt.getCreatedAt());
        dto.setUpdatedAt(paymentReceipt.getUpdatedAt());
        dto.setProcessedAt(paymentReceipt.getProcessedAt());
        dto.setCreatedBy(paymentReceipt.getCreatedBy());
        dto.setUpdatedBy(paymentReceipt.getUpdatedBy());
        
        // Campos bancários
        dto.setDebitedAgency(paymentReceipt.getDebitedAgency());
        dto.setDebitedAccount(paymentReceipt.getDebitedAccount());
        dto.setDebitedName(paymentReceipt.getDebitedName());
        dto.setCreditedAgency(paymentReceipt.getCreditedAgency());
        dto.setCreditedAccount(paymentReceipt.getCreditedAccount());
        dto.setCreditedName(paymentReceipt.getCreditedName());
        dto.setControlNumber(paymentReceipt.getControlNumber());
        dto.setAuthenticationCode(paymentReceipt.getAuthenticationCode());
        dto.setTransferDate(paymentReceipt.getTransferDate());
        dto.setTransferTime(paymentReceipt.getTransferTime());
        dto.setBankName(paymentReceipt.getBankName());
        dto.setTransactionType(paymentReceipt.getTransactionType());
        dto.setStatementIdentification(paymentReceipt.getStatementIdentification());
        
        return dto;
    }
    
    // Excluir comprovante por ID
    public void deleteById(String id) {
        try {
            UUID receiptId = UUID.fromString(id);
            Optional<PaymentReceipt> receiptOpt = paymentReceiptRepository.findById(receiptId);
            
            if (receiptOpt.isPresent()) {
                PaymentReceipt receipt = receiptOpt.get();
                
                // Excluir arquivo físico se existir
                if (receipt.getFilePath() != null) {
                    try {
                        Path filePath = Paths.get(receipt.getFilePath());
                        if (Files.exists(filePath)) {
                            Files.delete(filePath);
                            log.info("Arquivo físico excluído: {}", filePath);
                        }
                    } catch (Exception e) {
                        log.warn("Erro ao excluir arquivo físico: {}", e.getMessage());
                    }
                }
                
                // Excluir do banco de dados
                paymentReceiptRepository.deleteById(receiptId);
                log.info("Comprovante excluído do banco: {}", id);
            } else {
                log.warn("Comprovante não encontrado para exclusão: {}", id);
            }
        } catch (Exception e) {
            log.error("Erro ao excluir comprovante: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao excluir comprovante", e);
        }
    }
    
    // Excluir múltiplos comprovantes
    public Map<String, Object> deleteMultiplePaymentReceipts(List<String> ids) {
        Map<String, Object> result = new HashMap<>();
        int deleted = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();
        
        for (String id : ids) {
            try {
                deleteById(id);
                deleted++;
                log.info("Comprovante excluído com sucesso: {}", id);
            } catch (Exception e) {
                failed++;
                String error = "Erro ao excluir comprovante " + id + ": " + e.getMessage();
                errors.add(error);
                log.error(error, e);
            }
        }
        
        result.put("deleted", deleted);
        result.put("failed", failed);
        result.put("errors", errors);
        
        log.info("Exclusão múltipla concluída: {} excluídos, {} falharam", deleted, failed);
        return result;
    }
}
