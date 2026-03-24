package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.BankAccountDTO;
import com.z7design.fleet_manager.dto.BankFileDTO;
import com.z7design.fleet_manager.dto.BankTransactionDTO;
import com.z7design.fleet_manager.model.BankAccount;
import com.z7design.fleet_manager.model.BankFile;
import com.z7design.fleet_manager.model.BankTransaction;
import com.z7design.fleet_manager.repository.BankAccountRepository;
import com.z7design.fleet_manager.repository.BankFileRepository;
import com.z7design.fleet_manager.repository.BankTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BankReconciliationService {
    
    private final BankAccountRepository bankAccountRepository;
    private final BankFileRepository bankFileRepository;
    private final BankTransactionRepository bankTransactionRepository;
    
    // ===== BANK ACCOUNTS =====
    
    @Transactional(readOnly = true)
    public List<BankAccountDTO> getAllBankAccounts() {
        log.info("Buscando todas as contas bancÃ¡rias");
        List<BankAccount> accounts = bankAccountRepository.findAll();
        return accounts.stream()
                .map(BankAccountDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public BankAccountDTO getBankAccountById(UUID id) {
        log.info("Buscando conta bancÃ¡ria por ID: {}", id);
        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conta bancÃ¡ria nÃ£o encontrada com ID: " + id));
        return BankAccountDTO.fromEntity(account);
    }
    
    public BankAccountDTO createBankAccount(BankAccountDTO dto) {
        log.info("Criando nova conta bancÃ¡ria: {} - {}", dto.getBankName(), dto.getAccountNumber());
        
        // Verificar se jÃ¡ existe conta com mesmo banco e nÃºmero
        if (bankAccountRepository.findByBankNameAndAccountNumber(dto.getBankName(), dto.getAccountNumber()).isPresent()) {
            throw new RuntimeException("JÃ¡ existe uma conta com este banco e nÃºmero de conta");
        }
        
        BankAccount account = BankAccount.builder()
                .bankName(dto.getBankName())
                .accountNumber(dto.getAccountNumber())
                .accountType(dto.getAccountType())
                .balance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO)
                .status(dto.getStatus() != null ? dto.getStatus() : BankAccount.BankAccountStatus.ACTIVE)
                .description(dto.getDescription())
                .build();
        
        BankAccount savedAccount = bankAccountRepository.save(account);
        log.info("Conta bancÃ¡ria criada com sucesso: {}", savedAccount.getId());
        
        return BankAccountDTO.fromEntity(savedAccount);
    }
    
    // ===== BANK FILES =====
    
    @Transactional(readOnly = true)
    public Page<BankFileDTO> getAllBankFiles(Pageable pageable) {
        log.info("Buscando arquivos bancÃ¡rios com paginaÃ§Ã£o");
        Page<BankFile> files = bankFileRepository.findAllOrderByCreatedAtDesc(pageable);
        return files.map(BankFileDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<BankFileDTO> getAllBankFiles() {
        log.info("Buscando todos os arquivos bancÃ¡rios");
        List<BankFile> files = bankFileRepository.findAll();
        return files.stream()
                .map(BankFileDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public BankFileDTO getBankFileById(UUID id) {
        log.info("Buscando arquivo bancÃ¡rio por ID: {}", id);
        BankFile file = bankFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Arquivo bancÃ¡rio nÃ£o encontrado com ID: " + id));
        return BankFileDTO.fromEntity(file);
    }
    
    public BankFileDTO uploadBankFile(MultipartFile file, String bankName, String accountNumber, 
                                     String period, String description) {
        log.info("Fazendo upload de arquivo bancÃ¡rio: {} - {}", file.getOriginalFilename(), bankName);
        
        try {
            // Determinar tipo de arquivo
            BankFile.FileType fileType = determineFileType(file.getOriginalFilename());
            
            // Criar registro do arquivo
            BankFile bankFile = BankFile.builder()
                    .fileName(file.getOriginalFilename())
                    .fileType(fileType)
                    .bankName(bankName)
                    .accountNumber(accountNumber)
                    .period(period)
                    .status(BankFile.ProcessingStatus.UPLOADED)
                    .fileSize(formatFileSize(file.getSize()))
                    .description(description)
                    .filePath("/uploads/bank-files/" + file.getOriginalFilename())
                    .build();
            
            BankFile savedFile = bankFileRepository.save(bankFile);
            log.info("Arquivo bancÃ¡rio salvo com sucesso: {}", savedFile.getId());
            
            // Simular processamento (em produÃ§Ã£o, aqui seria o processamento real do arquivo)
            processBankFile(savedFile.getId());
            
            return BankFileDTO.fromEntity(savedFile);
            
        } catch (Exception e) {
            log.error("Erro ao fazer upload do arquivo bancÃ¡rio", e);
            throw new RuntimeException("Erro ao fazer upload do arquivo: " + e.getMessage());
        }
    }
    
    public void deleteBankFile(UUID id) {
        log.info("Removendo arquivo bancÃ¡rio: {}", id);
        
        BankFile file = bankFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Arquivo bancÃ¡rio nÃ£o encontrado com ID: " + id));
        
        // Remover transaÃ§Ãµes associadas
        List<BankTransaction> transactions = bankTransactionRepository.findByBankFileId(id);
        bankTransactionRepository.deleteAll(transactions);
        
        // Remover arquivo
        bankFileRepository.delete(file);
        
        log.info("Arquivo bancÃ¡rio removido com sucesso: {}", id);
    }
    
    // ===== BANK TRANSACTIONS =====
    
    @Transactional(readOnly = true)
    public List<BankTransactionDTO> getTransactionsByFileId(UUID fileId) {
        log.info("Buscando transaÃ§Ãµes do arquivo: {}", fileId);
        List<BankTransaction> transactions = bankTransactionRepository.findByBankFileIdOrderByTransactionDateDesc(fileId);
        return transactions.stream()
                .map(BankTransactionDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BankTransactionDTO> getTransactionsByStatus(BankTransaction.ReconciliationStatus status) {
        log.info("Buscando transaÃ§Ãµes por status: {}", status);
        List<BankTransaction> transactions = bankTransactionRepository.findByStatus(status);
        return transactions.stream()
                .map(BankTransactionDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    // ===== STATISTICS =====
    
    @Transactional(readOnly = true)
    public Long getTotalFilesCount() {
        return bankFileRepository.count();
    }
    
    @Transactional(readOnly = true)
    public Long getCompletedFilesCount() {
        return bankFileRepository.countByStatus(BankFile.ProcessingStatus.COMPLETED);
    }
    
    @Transactional(readOnly = true)
    public Long getProcessingFilesCount() {
        return bankFileRepository.countByStatus(BankFile.ProcessingStatus.PROCESSING);
    }
    
    @Transactional(readOnly = true)
    public Long getErrorFilesCount() {
        return bankFileRepository.countByStatus(BankFile.ProcessingStatus.ERROR);
    }
    
    @Transactional(readOnly = true)
    public Long getTotalTransactionsCount() {
        return bankTransactionRepository.count();
    }
    
    @Transactional(readOnly = true)
    public Long getMatchedTransactionsCount() {
        return bankTransactionRepository.countByStatus(BankTransaction.ReconciliationStatus.MATCHED);
    }
    
    @Transactional(readOnly = true)
    public Long getUnmatchedTransactionsCount() {
        return bankTransactionRepository.countByStatus(BankTransaction.ReconciliationStatus.UNMATCHED);
    }
    
    // ===== PRIVATE METHODS =====
    
    private BankFile.FileType determineFileType(String fileName) {
        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        switch (extension) {
            case "pdf":
                return BankFile.FileType.PDF;
            case "csv":
                return BankFile.FileType.CSV;
            case "xlsx":
            case "xls":
                return BankFile.FileType.EXCEL;
            default:
                throw new RuntimeException("Tipo de arquivo nÃ£o suportado: " + extension);
        }
    }
    
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
    
    private void processBankFile(UUID fileId) {
        log.info("Iniciando processamento do arquivo: {}", fileId);
        
        try {
            BankFile file = bankFileRepository.findById(fileId)
                    .orElseThrow(() -> new RuntimeException("Arquivo nÃ£o encontrado"));
            
            // Atualizar status para processando
            file.setStatus(BankFile.ProcessingStatus.PROCESSING);
            bankFileRepository.save(file);
            
            // Simular processamento (em produÃ§Ã£o, aqui seria o processamento real)
            Thread.sleep(2000);
            
            // Simular dados processados
            file.setStatus(BankFile.ProcessingStatus.COMPLETED);
            file.setTotalRecords(150);
            file.setMatchedRecords(145);
            file.setUnmatchedRecords(5);
            bankFileRepository.save(file);
            
            // Criar transaÃ§Ãµes de exemplo
            createSampleTransactions(fileId);
            
            log.info("Processamento do arquivo concluÃ­do: {}", fileId);
            
        } catch (Exception e) {
            log.error("Erro ao processar arquivo: {}", fileId, e);
            
            BankFile file = bankFileRepository.findById(fileId).orElse(null);
            if (file != null) {
                file.setStatus(BankFile.ProcessingStatus.ERROR);
                file.setErrorMessage(e.getMessage());
                bankFileRepository.save(file);
            }
        }
    }
    
    private void createSampleTransactions(UUID fileId) {
        log.info("Criando transaÃ§Ãµes de exemplo para arquivo: {}", fileId);
        
        // Criar algumas transaÃ§Ãµes de exemplo
        BankTransaction transaction1 = BankTransaction.builder()
                .bankFile(bankFileRepository.findById(fileId).orElse(null))
                .transactionDate(java.time.LocalDate.now().minusDays(1))
                .description("PIX Recebido - JoÃ£o Silva")
                .amount(new BigDecimal("1500.00"))
                .balance(new BigDecimal("125000.50"))
                .status(BankTransaction.ReconciliationStatus.MATCHED)
                .referenceNumber("PIX001")
                .category("Recebimento")
                .systemTransactionId(UUID.randomUUID())
                .systemTransactionType("ACCOUNTS_RECEIVABLE")
                .reconciliationDate(java.time.LocalDate.now())
                .reconciliationUser("Sistema")
                .build();
        
        BankTransaction transaction2 = BankTransaction.builder()
                .bankFile(bankFileRepository.findById(fileId).orElse(null))
                .transactionDate(java.time.LocalDate.now().minusDays(2))
                .description("TransferÃªncia - Fornecedor ABC")
                .amount(new BigDecimal("-2500.00"))
                .balance(new BigDecimal("123500.50"))
                .status(BankTransaction.ReconciliationStatus.MATCHED)
                .referenceNumber("TED001")
                .category("Pagamento")
                .systemTransactionId(UUID.randomUUID())
                .systemTransactionType("ACCOUNTS_PAYABLE")
                .reconciliationDate(java.time.LocalDate.now())
                .reconciliationUser("Sistema")
                .build();
        
        BankTransaction transaction3 = BankTransaction.builder()
                .bankFile(bankFileRepository.findById(fileId).orElse(null))
                .transactionDate(java.time.LocalDate.now().minusDays(3))
                .description("TED Recebido - Cliente XYZ")
                .amount(new BigDecimal("3000.00"))
                .balance(new BigDecimal("126000.50"))
                .status(BankTransaction.ReconciliationStatus.UNMATCHED)
                .referenceNumber("TED002")
                .category("Recebimento")
                .build();
        
        bankTransactionRepository.saveAll(List.of(transaction1, transaction2, transaction3));
        log.info("TransaÃ§Ãµes de exemplo criadas para arquivo: {}", fileId);
    }
}

