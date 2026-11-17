package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.dto.StockNfeParsedDTO;
import com.z7design.fleet_manager.dto.StockNfeProcessRequestDTO;
import com.z7design.fleet_manager.dto.StockNfeProcessResponseDTO;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.service.StockNfeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/stock/nfe")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Estoque - NF-e XML", description = "Endpoints para importação de NF-e em XML para o estoque e módulo financeiro")
public class StockNfeController {

    private final StockNfeService stockNfeService;
    private final java.util.concurrent.ConcurrentHashMap<String, java.util.Map<Integer, byte[]>> pdfChunkStore = new java.util.concurrent.ConcurrentHashMap<>();

    @PostMapping(value = "/parse-xml", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Realiza parse do arquivo XML de NF-e para conferência prévia de itens e financeiro")
    public ResponseEntity<StockNfeParsedDTO> parseXml(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        log.info("POST /api/stock/nfe/parse-xml - Arquivo: {}, Tamanho: {} bytes", 
                file.getOriginalFilename(), file.getSize());
        return ResponseEntity.ok(stockNfeService.parseXml(file, user != null ? user.getCompanyId() : null));
    }

    @PostMapping(value = "/parse-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Realiza parse do arquivo PDF (DANFE) de NF-e para conferência prévia de itens e financeiro")
    public ResponseEntity<StockNfeParsedDTO> parsePdf(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        log.info("POST /api/stock/nfe/parse-pdf - Arquivo: {}, Tamanho: {} bytes",
                file.getOriginalFilename(), file.getSize());
        return ResponseEntity.ok(stockNfeService.parsePdf(file, user != null ? user.getCompanyId() : null));
    }

    @PostMapping("/parse-pdf-chunk")
    @Operation(summary = "Recebe blocos (chunks) em Base64 de um PDF (DANFE) para evitar erro 413 em proxies reversos")
    public ResponseEntity<Object> parsePdfChunk(
            @RequestBody java.util.Map<String, Object> payload,
            @AuthenticationPrincipal User user) {
        String uploadId = String.valueOf(payload.getOrDefault("uploadId", "default"));
        int chunkIndex = ((Number) payload.getOrDefault("chunkIndex", 0)).intValue();
        int totalChunks = ((Number) payload.getOrDefault("totalChunks", 1)).intValue();
        String dataBase64 = String.valueOf(payload.getOrDefault("dataBase64", ""));
        String fileName = String.valueOf(payload.getOrDefault("fileName", "danfe.pdf"));

        byte[] chunkBytes = java.util.Base64.getDecoder().decode(dataBase64);
        java.util.Map<Integer, byte[]> chunks = pdfChunkStore.computeIfAbsent(
                uploadId, k -> new java.util.concurrent.ConcurrentHashMap<>());
        chunks.put(chunkIndex, chunkBytes);

        if (chunks.size() < totalChunks) {
            return ResponseEntity.ok(java.util.Map.of("received", chunkIndex, "total", totalChunks));
        }

        pdfChunkStore.remove(uploadId);
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        for (int i = 0; i < totalChunks; i++) {
            byte[] part = chunks.get(i);
            if (part != null) {
                baos.write(part, 0, part.length);
            }
        }
        final byte[] fullBytes = baos.toByteArray();
        MultipartFile inMemoryFile = new MultipartFile() {
            @Override public String getName() { return "file"; }
            @Override public String getOriginalFilename() { return fileName; }
            @Override public String getContentType() { return "application/pdf"; }
            @Override public boolean isEmpty() { return fullBytes.length == 0; }
            @Override public long getSize() { return fullBytes.length; }
            @Override public byte[] getBytes() { return fullBytes; }
            @Override public java.io.InputStream getInputStream() { return new java.io.ByteArrayInputStream(fullBytes); }
            @Override public void transferTo(java.io.File dest) throws java.io.IOException { java.nio.file.Files.write(dest.toPath(), fullBytes); }
        };

        log.info("POST /api/stock/nfe/parse-pdf-chunk concluído - Arquivo: {}, Tamanho total: {} bytes ({} chunks)",
                fileName, fullBytes.length, totalChunks);
        StockNfeParsedDTO parsed = stockNfeService.parsePdf(inMemoryFile, user != null ? user.getCompanyId() : null);
        return ResponseEntity.ok(parsed);
    }

    @PostMapping("/process")
    @Operation(summary = "Processa e grava os itens no estoque e as parcelas no Contas a Pagar")
    public ResponseEntity<StockNfeProcessResponseDTO> processNfe(
            @RequestBody StockNfeProcessRequestDTO request,
            @AuthenticationPrincipal User user) {
        log.info("POST /api/stock/nfe/process - NF-e nº: {}, Itens: {}, Usuário: {}", 
                request.getInvoiceNumber(), request.getItems() != null ? request.getItems().size() : 0,
                user != null ? user.getUsername() : "null");
        try {
            return ResponseEntity.ok(stockNfeService.processNfe(request, user));
        } catch (com.z7design.fleet_manager.exception.BusinessException be) {
            log.warn("Erro de negócio ao processar NF-e nº {}: {}", request.getInvoiceNumber(), be.getMessage());
            throw be;
        } catch (Exception e) {
            log.error("Erro inesperado ao processar NF-e nº {}: {}", request.getInvoiceNumber(), e.getMessage(), e);
            throw new com.z7design.fleet_manager.exception.BusinessException("Falha no processamento da NF-e: " + e.getMessage());
        }
    }
}
