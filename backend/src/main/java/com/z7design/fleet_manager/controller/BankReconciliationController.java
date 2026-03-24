package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.BankAccountDTO;
import com.z7design.fleet_manager.dto.BankFileDTO;
import com.z7design.fleet_manager.dto.BankTransactionDTO;
import com.z7design.fleet_manager.model.BankTransaction;
import com.z7design.fleet_manager.service.BankReconciliationService;
import com.z7design.fleet_manager.service.BankReconciliationReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bank-reconciliation")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "ConciliaÃ§Ã£o BancÃ¡ria", description = "Endpoints para gestÃ£o de conciliaÃ§Ã£o bancÃ¡ria")
public class BankReconciliationController {
    
    private final BankReconciliationService bankReconciliationService;
    private final BankReconciliationReportService bankReconciliationReportService;
    
    // ===== BANK ACCOUNTS =====
    
    @GetMapping("/accounts")
    @Operation(summary = "Listar contas bancÃ¡rias", description = "Retorna uma lista de todas as contas bancÃ¡rias")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de contas bancÃ¡rias retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<BankAccountDTO>> getAllBankAccounts() {
        log.info("GET /api/bank-reconciliation/accounts - Buscando todas as contas bancÃ¡rias");
        return ResponseEntity.ok(bankReconciliationService.getAllBankAccounts());
    }
    
    @GetMapping("/accounts/{id}")
    @Operation(summary = "Buscar conta bancÃ¡ria por ID", description = "Retorna uma conta bancÃ¡ria especÃ­fica pelo seu ID")
    public ResponseEntity<BankAccountDTO> getBankAccountById(@PathVariable UUID id) {
        log.info("GET /api/bank-reconciliation/accounts/{} - Buscando conta bancÃ¡ria", id);
        return ResponseEntity.ok(bankReconciliationService.getBankAccountById(id));
    }
    
    @PostMapping("/accounts")
    @Operation(summary = "Criar conta bancÃ¡ria", description = "Cria uma nova conta bancÃ¡ria")
    public ResponseEntity<BankAccountDTO> createBankAccount(@RequestBody BankAccountDTO dto) {
        log.info("POST /api/bank-reconciliation/accounts - Criando conta bancÃ¡ria: {}", dto.getBankName());
        return ResponseEntity.ok(bankReconciliationService.createBankAccount(dto));
    }
    
    // ===== BANK FILES =====
    
    @GetMapping("/files")
    @Operation(summary = "Listar arquivos bancÃ¡rios", description = "Retorna uma lista paginada de arquivos bancÃ¡rios")
    public ResponseEntity<Page<BankFileDTO>> getAllBankFiles(
            @Parameter(description = "ParÃ¢metros de paginaÃ§Ã£o") Pageable pageable) {
        log.info("GET /api/bank-reconciliation/files - Buscando arquivos bancÃ¡rios com paginaÃ§Ã£o");
        return ResponseEntity.ok(bankReconciliationService.getAllBankFiles(pageable));
    }
    
    @GetMapping("/files/all")
    @Operation(summary = "Listar todos os arquivos bancÃ¡rios", description = "Retorna uma lista completa de arquivos bancÃ¡rios")
    public ResponseEntity<List<BankFileDTO>> getAllBankFilesWithoutPagination() {
        log.info("GET /api/bank-reconciliation/files/all - Buscando todos os arquivos bancÃ¡rios");
        return ResponseEntity.ok(bankReconciliationService.getAllBankFiles());
    }
    
    @GetMapping("/files/{id}")
    @Operation(summary = "Buscar arquivo bancÃ¡rio por ID", description = "Retorna um arquivo bancÃ¡rio especÃ­fico pelo seu ID")
    public ResponseEntity<BankFileDTO> getBankFileById(@PathVariable UUID id) {
        log.info("GET /api/bank-reconciliation/files/{} - Buscando arquivo bancÃ¡rio", id);
        return ResponseEntity.ok(bankReconciliationService.getBankFileById(id));
    }
    
    @PostMapping("/files/upload")
    @Operation(summary = "Upload de arquivo bancÃ¡rio", description = "Faz upload de um arquivo bancÃ¡rio para processamento")
    public ResponseEntity<BankFileDTO> uploadBankFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("bankName") String bankName,
            @RequestParam("accountNumber") String accountNumber,
            @RequestParam("period") String period,
            @RequestParam(value = "description", required = false) String description) {
        log.info("POST /api/bank-reconciliation/files/upload - Upload de arquivo: {} - {}", 
                file.getOriginalFilename(), bankName);
        return ResponseEntity.ok(bankReconciliationService.uploadBankFile(file, bankName, accountNumber, period, description));
    }
    
    @DeleteMapping("/files/{id}")
    @Operation(summary = "Remover arquivo bancÃ¡rio", description = "Remove um arquivo bancÃ¡rio e suas transaÃ§Ãµes associadas")
    public ResponseEntity<Void> deleteBankFile(@PathVariable UUID id) {
        log.info("DELETE /api/bank-reconciliation/files/{} - Removendo arquivo bancÃ¡rio", id);
        bankReconciliationService.deleteBankFile(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== BANK TRANSACTIONS =====
    
    @GetMapping("/files/{fileId}/transactions")
    @Operation(summary = "Listar transaÃ§Ãµes de um arquivo", description = "Retorna todas as transaÃ§Ãµes de um arquivo bancÃ¡rio especÃ­fico")
    public ResponseEntity<List<BankTransactionDTO>> getTransactionsByFileId(@PathVariable UUID fileId) {
        log.info("GET /api/bank-reconciliation/files/{}/transactions - Buscando transaÃ§Ãµes do arquivo", fileId);
        return ResponseEntity.ok(bankReconciliationService.getTransactionsByFileId(fileId));
    }
    
    @GetMapping("/transactions/status/{status}")
    @Operation(summary = "Listar transaÃ§Ãµes por status", description = "Retorna transaÃ§Ãµes filtradas por status de conciliaÃ§Ã£o")
    public ResponseEntity<List<BankTransactionDTO>> getTransactionsByStatus(@PathVariable BankTransaction.ReconciliationStatus status) {
        log.info("GET /api/bank-reconciliation/transactions/status/{} - Buscando transaÃ§Ãµes por status", status);
        return ResponseEntity.ok(bankReconciliationService.getTransactionsByStatus(status));
    }
    
    // ===== STATISTICS =====
    
    @GetMapping("/statistics/files")
    @Operation(summary = "EstatÃ­sticas de arquivos", description = "Retorna estatÃ­sticas dos arquivos bancÃ¡rios")
    public ResponseEntity<Object> getFileStatistics() {
        log.info("GET /api/bank-reconciliation/statistics/files - Buscando estatÃ­sticas de arquivos");
        
        return ResponseEntity.ok(new Object() {
            public final Long totalFiles = bankReconciliationService.getTotalFilesCount();
            public final Long completedFiles = bankReconciliationService.getCompletedFilesCount();
            public final Long processingFiles = bankReconciliationService.getProcessingFilesCount();
            public final Long errorFiles = bankReconciliationService.getErrorFilesCount();
        });
    }
    
    @GetMapping("/statistics/transactions")
    @Operation(summary = "EstatÃ­sticas de transaÃ§Ãµes", description = "Retorna estatÃ­sticas das transaÃ§Ãµes bancÃ¡rias")
    public ResponseEntity<Object> getTransactionStatistics() {
        log.info("GET /api/bank-reconciliation/statistics/transactions - Buscando estatÃ­sticas de transaÃ§Ãµes");
        
        return ResponseEntity.ok(new Object() {
            public final Long totalTransactions = bankReconciliationService.getTotalTransactionsCount();
            public final Long matchedTransactions = bankReconciliationService.getMatchedTransactionsCount();
            public final Long unmatchedTransactions = bankReconciliationService.getUnmatchedTransactionsCount();
        });
    }
    
    // ===== REPORTS =====
    
    @GetMapping("/reports/file/{fileId}")
    @Operation(summary = "Gerar relatÃ³rio de arquivo", description = "Gera relatÃ³rio PDF de conciliaÃ§Ã£o para um arquivo especÃ­fico")
    public ResponseEntity<byte[]> generateFileReport(
            @PathVariable UUID fileId,
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String statusFilter) {
        log.info("GET /api/bank-reconciliation/reports/file/{} - Gerando relatÃ³rio de arquivo com filtro: {}", fileId, statusFilter);
        
        try {
            byte[] reportBytes = bankReconciliationReportService.generateBankReconciliationReportPDF(fileId, statusFilter);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-conciliacao-bancaria-" + fileId + ".pdf");
            headers.setContentLength(reportBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(reportBytes);
                    
        } catch (IOException e) {
            log.error("Erro ao gerar relatÃ³rio de arquivo: {}", fileId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/reports/summary")
    @Operation(summary = "Gerar relatÃ³rio de resumo", description = "Gera relatÃ³rio PDF de resumo de conciliaÃ§Ã£o bancÃ¡ria")
    public ResponseEntity<byte[]> generateSummaryReport(
            @RequestParam(value = "startDate", required = false) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) LocalDate endDate,
            @RequestParam(value = "bankName", required = false) String bankName) {
        log.info("GET /api/bank-reconciliation/reports/summary - Gerando relatÃ³rio de resumo para perÃ­odo: {} a {}, banco: {}", 
                startDate, endDate, bankName);
        
        try {
            byte[] reportBytes = bankReconciliationReportService.generateBankReconciliationSummaryReportPDF(startDate, endDate, bankName);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-resumo-conciliacao-bancaria.pdf");
            headers.setContentLength(reportBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(reportBytes);
                    
        } catch (IOException e) {
            log.error("Erro ao gerar relatÃ³rio de resumo", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

