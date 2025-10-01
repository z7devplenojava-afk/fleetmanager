package br.com.fleetmanager.controller;

import br.com.fleetmanager.service.BankReconciliationService;

import br.com.fleetmanager.dto.BankAccountDTO;
import br.com.fleetmanager.dto.BankFileDTO;
import br.com.fleetmanager.dto.BankTransactionDTO;
import br.com.fleetmanager.model.BankTransaction;

import br.com.fleetmanager.service.BankReconciliationReportService;
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
@Tag(name = "Conciliação Bancária", description = "Endpoints para gestão de conciliação bancária")
public class BankReconciliationController {
    
    private final BankReconciliationService bankReconciliationService;
    private final BankReconciliationReportService bankReconciliationReportService;
    
    // ===== BANK ACCOUNTS =====
    
    @GetMapping("/accounts")
    @Operation(summary = "Listar contas bancárias", description = "Retorna uma lista de todas as contas bancárias")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de contas bancárias retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<List<BankAccountDTO>> getAllBankAccounts() {
        log.info("GET /api/bank-reconciliation/accounts - Buscando todas as contas bancárias");
        return ResponseEntity.ok(bankReconciliationService.getAllBankAccounts());
    }
    
    @GetMapping("/accounts/{id}")
    @Operation(summary = "Buscar conta bancária por ID", description = "Retorna uma conta bancária específica pelo seu ID")
    public ResponseEntity<BankAccountDTO> getBankAccountById(@PathVariable UUID id) {
        log.info("GET /api/bank-reconciliation/accounts/{} - Buscando conta bancária", id);
        return ResponseEntity.ok(bankReconciliationService.getBankAccountById(id));
    }
    
    @PostMapping("/accounts")
    @Operation(summary = "Criar conta bancária", description = "Cria uma nova conta bancária")
    public ResponseEntity<BankAccountDTO> createBankAccount(@RequestBody BankAccountDTO dto) {
        log.info("POST /api/bank-reconciliation/accounts - Criando conta bancária: {}", dto.getBankName());
        return ResponseEntity.ok(bankReconciliationService.createBankAccount(dto));
    }
    
    // ===== BANK FILES =====
    
    @GetMapping("/files")
    @Operation(summary = "Listar arquivos bancários", description = "Retorna uma lista paginada de arquivos bancários")
    public ResponseEntity<Page<BankFileDTO>> getAllBankFiles(
            @Parameter(description = "Parâmetros de paginação") Pageable pageable) {
        log.info("GET /api/bank-reconciliation/files - Buscando arquivos bancários com paginação");
        return ResponseEntity.ok(bankReconciliationService.getAllBankFiles(pageable));
    }
    
    @GetMapping("/files/all")
    @Operation(summary = "Listar todos os arquivos bancários", description = "Retorna uma lista completa de arquivos bancários")
    public ResponseEntity<List<BankFileDTO>> getAllBankFilesWithoutPagination() {
        log.info("GET /api/bank-reconciliation/files/all - Buscando todos os arquivos bancários");
        return ResponseEntity.ok(bankReconciliationService.getAllBankFiles());
    }
    
    @GetMapping("/files/{id}")
    @Operation(summary = "Buscar arquivo bancário por ID", description = "Retorna um arquivo bancário específico pelo seu ID")
    public ResponseEntity<BankFileDTO> getBankFileById(@PathVariable UUID id) {
        log.info("GET /api/bank-reconciliation/files/{} - Buscando arquivo bancário", id);
        return ResponseEntity.ok(bankReconciliationService.getBankFileById(id));
    }
    
    @PostMapping("/files/upload")
    @Operation(summary = "Upload de arquivo bancário", description = "Faz upload de um arquivo bancário para processamento")
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
    @Operation(summary = "Remover arquivo bancário", description = "Remove um arquivo bancário e suas transações associadas")
    public ResponseEntity<Void> deleteBankFile(@PathVariable UUID id) {
        log.info("DELETE /api/bank-reconciliation/files/{} - Removendo arquivo bancário", id);
        bankReconciliationService.deleteBankFile(id);
        return ResponseEntity.noContent().build();
    }
    
    // ===== BANK TRANSACTIONS =====
    
    @GetMapping("/files/{fileId}/transactions")
    @Operation(summary = "Listar transações de um arquivo", description = "Retorna todas as transações de um arquivo bancário específico")
    public ResponseEntity<List<BankTransactionDTO>> getTransactionsByFileId(@PathVariable UUID fileId) {
        log.info("GET /api/bank-reconciliation/files/{}/transactions - Buscando transações do arquivo", fileId);
        return ResponseEntity.ok(bankReconciliationService.getTransactionsByFileId(fileId));
    }
    
    @GetMapping("/transactions/status/{status}")
    @Operation(summary = "Listar transações por status", description = "Retorna transações filtradas por status de conciliação")
    public ResponseEntity<List<BankTransactionDTO>> getTransactionsByStatus(@PathVariable BankTransaction.ReconciliationStatus status) {
        log.info("GET /api/bank-reconciliation/transactions/status/{} - Buscando transações por status", status);
        return ResponseEntity.ok(bankReconciliationService.getTransactionsByStatus(status));
    }
    
    // ===== STATISTICS =====
    
    @GetMapping("/statistics/files")
    @Operation(summary = "Estatísticas de arquivos", description = "Retorna estatísticas dos arquivos bancários")
    public ResponseEntity<Object> getFileStatistics() {
        log.info("GET /api/bank-reconciliation/statistics/files - Buscando estatísticas de arquivos");
        
        return ResponseEntity.ok(new Object() {
            public final Long totalFiles = bankReconciliationService.getTotalFilesCount();
            public final Long completedFiles = bankReconciliationService.getCompletedFilesCount();
            public final Long processingFiles = bankReconciliationService.getProcessingFilesCount();
            public final Long errorFiles = bankReconciliationService.getErrorFilesCount();
        });
    }
    
    @GetMapping("/statistics/transactions")
    @Operation(summary = "Estatísticas de transações", description = "Retorna estatísticas das transações bancárias")
    public ResponseEntity<Object> getTransactionStatistics() {
        log.info("GET /api/bank-reconciliation/statistics/transactions - Buscando estatísticas de transações");
        
        return ResponseEntity.ok(new Object() {
            public final Long totalTransactions = bankReconciliationService.getTotalTransactionsCount();
            public final Long matchedTransactions = bankReconciliationService.getMatchedTransactionsCount();
            public final Long unmatchedTransactions = bankReconciliationService.getUnmatchedTransactionsCount();
        });
    }
    
    // ===== REPORTS =====
    
    @GetMapping("/reports/file/{fileId}")
    @Operation(summary = "Gerar relatório de arquivo", description = "Gera relatório PDF de conciliação para um arquivo específico")
    public ResponseEntity<byte[]> generateFileReport(
            @PathVariable UUID fileId,
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String statusFilter) {
        log.info("GET /api/bank-reconciliation/reports/file/{} - Gerando relatório de arquivo com filtro: {}", fileId, statusFilter);
        
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
            log.error("Erro ao gerar relatório de arquivo: {}", fileId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/reports/summary")
    @Operation(summary = "Gerar relatório de resumo", description = "Gera relatório PDF de resumo de conciliação bancária")
    public ResponseEntity<byte[]> generateSummaryReport(
            @RequestParam(value = "startDate", required = false) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) LocalDate endDate,
            @RequestParam(value = "bankName", required = false) String bankName) {
        log.info("GET /api/bank-reconciliation/reports/summary - Gerando relatório de resumo para período: {} a {}, banco: {}", 
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
            log.error("Erro ao gerar relatório de resumo", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
