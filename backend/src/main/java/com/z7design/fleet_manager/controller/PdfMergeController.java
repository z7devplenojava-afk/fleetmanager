package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.PdfMergeResultDTO;
import com.z7design.fleet_manager.service.PdfMergeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller para gerenciar uniÃ£o de documentos PDF (holerites + comprovantes)
 */
@RestController
@RequestMapping("/api/pdf-merge")
@RequiredArgsConstructor
@Slf4j
public class PdfMergeController {

    private final PdfMergeService pdfMergeService;

    /**
     * Une um holerite e um comprovante em um Ãºnico PDF
     */
    @PostMapping("/payslip-receipt")
    public ResponseEntity<PdfMergeResultDTO> mergePayslipAndReceipt(
            @RequestParam("payslipFile") MultipartFile payslipFile,
            @RequestParam("receiptFile") MultipartFile receiptFile,
            @RequestParam("employeeName") String employeeName,
            @RequestParam("month") Integer month,
            @RequestParam("year") Integer year) {
        
        try {
            log.info("ðŸ”„ Iniciando merge de holerite e comprovante para: {} - {}/{}", 
                employeeName, month, year);
            
            // Validar arquivos
            pdfMergeService.validatePdfFiles(new MultipartFile[]{payslipFile, receiptFile});
            
            // Realizar merge
            String filePath = pdfMergeService.mergePayslipAndReceipt(
                payslipFile, receiptFile, employeeName, month, year);
            
            // Obter informaÃ§Ãµes do arquivo
            Path path = Paths.get(filePath);
            long fileSize = Files.size(path);
            String fileName = path.getFileName().toString();
            
            // Criar DTO de resposta
            PdfMergeResultDTO result = new PdfMergeResultDTO(
                fileName, filePath, employeeName, month, year, fileSize);
            
            // Adicionar URLs
            result.setDownloadUrl("/api/pdf-merge/download/" + fileName);
            result.setViewUrl("/api/pdf-merge/view/" + fileName);
            
            log.info("âœ… Merge concluÃ­do com sucesso: {}", fileName);
            
            return ResponseEntity.ok(result);
            
        } catch (IllegalArgumentException e) {
            log.error("âŒ Erro de validaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            log.error("âŒ Erro ao realizar merge: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Une mÃºltiplos documentos em um Ãºnico PDF
     */
    @PostMapping("/multiple")
    public ResponseEntity<PdfMergeResultDTO> mergeMultipleDocuments(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("employeeName") String employeeName,
            @RequestParam("month") Integer month,
            @RequestParam("year") Integer year) {
        
        try {
            log.info("ðŸ”„ Iniciando merge de {} documentos para: {} - {}/{}", 
                files.length, employeeName, month, year);
            
            // Validar arquivos
            pdfMergeService.validatePdfFiles(files);
            
            // Realizar merge
            String filePath = pdfMergeService.mergeMultipleDocuments(
                files, employeeName, month, year);
            
            // Obter informaÃ§Ãµes do arquivo
            Path path = Paths.get(filePath);
            long fileSize = Files.size(path);
            String fileName = path.getFileName().toString();
            
            // Criar DTO de resposta
            PdfMergeResultDTO result = new PdfMergeResultDTO(
                fileName, filePath, employeeName, month, year, fileSize);
            
            // Adicionar URLs
            result.setDownloadUrl("/api/pdf-merge/download/" + fileName);
            result.setViewUrl("/api/pdf-merge/view/" + fileName);
            
            log.info("âœ… Merge de {} documentos concluÃ­do: {}", files.length, fileName);
            
            return ResponseEntity.ok(result);
            
        } catch (IllegalArgumentException e) {
            log.error("âŒ Erro de validaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            log.error("âŒ Erro ao realizar merge: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Cria um PDF unificado em memÃ³ria e retorna os bytes
     */
    @PostMapping("/merge-to-bytes")
    public ResponseEntity<byte[]> mergeToBytes(@RequestParam("files") MultipartFile[] files) {
        try {
            log.info("ðŸ”„ Criando PDF unificado em memÃ³ria com {} arquivos", files.length);
            
            // Validar arquivos
            pdfMergeService.validatePdfFiles(files);
            
            // Realizar merge em memÃ³ria
            byte[] mergedPdf = pdfMergeService.mergePdfToBytes(files);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "documentos-unidos.pdf");
            headers.setContentLength(mergedPdf.length);
            
            log.info("âœ… PDF unificado criado em memÃ³ria com {} bytes", mergedPdf.length);
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(mergedPdf);
                
        } catch (IllegalArgumentException e) {
            log.error("âŒ Erro de validaÃ§Ã£o: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            log.error("âŒ Erro ao criar PDF unificado: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Download de arquivo unificado
     */
    @GetMapping("/download/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable("fileName") String fileName) {
        try {
            Path filePath = Paths.get("uploads/merged-documents/" + fileName);
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(filePath);
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=\"" + fileName + "\"")
                .body(resource);
                
        } catch (Exception e) {
            log.error("âŒ Erro ao fazer download do arquivo {}: {}", fileName, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Visualizar arquivo unificado
     */
    @GetMapping("/view/{fileName}")
    public ResponseEntity<Resource> viewFile(@PathVariable("fileName") String fileName) {
        try {
            Path filePath = Paths.get("uploads/merged-documents/" + fileName);
            
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(filePath);
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "inline; filename=\"" + fileName + "\"")
                .body(resource);
                
        } catch (Exception e) {
            log.error("âŒ Erro ao visualizar arquivo {}: {}", fileName, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * InformaÃ§Ãµes sobre arquivos unificados disponÃ­veis
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listMergedFiles() {
        try {
            Path mergeDir = Paths.get("uploads/merged-documents/");
            
            if (!Files.exists(mergeDir)) {
                return ResponseEntity.ok(Map.of(
                    "files", new Object[0],
                    "totalFiles", 0,
                    "totalSize", 0
                ));
            }
            
            // Listar arquivos (implementaÃ§Ã£o simplificada)
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lista de arquivos unificados");
            response.put("directory", mergeDir.toString());
            response.put("note", "ImplementaÃ§Ã£o de listagem serÃ¡ adicionada conforme necessÃ¡rio");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("âŒ Erro ao listar arquivos unificados: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}

