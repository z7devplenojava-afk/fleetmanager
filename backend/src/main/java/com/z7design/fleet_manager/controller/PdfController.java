package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.PdfService;
import com.z7design.fleet_manager.service.OcrService;
import com.z7design.fleet_manager.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.util.List;
import java.util.Collections;
import java.io.BufferedOutputStream;
import java.io.OutputStream;
import java.util.zip.ZipOutputStream;
import java.util.zip.ZipEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import java.util.HashMap;
import org.apache.pdfbox.pdmodel.PDDocument;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/pdf")
@Tag(name = "Processamento de PDF", description = "Endpoints para processamento de arquivos PDF.")
@SecurityRequirement(name = "bearerAuth")
public class PdfController {
    private static final Logger logger = LoggerFactory.getLogger(PdfController.class);
    private static final int BUFFER_SIZE = 8192;

    @Autowired
    private PdfService pdfService;
    @Autowired
    private OcrService ocrService;
    @Autowired
    private FileStorageService fileStorageService;

    @Operation(summary = "Processa holerites em PDF",
               description = "Processa um ou mais arquivos PDF de holerites, extraindo informaÃ§Ãµes e retornando um arquivo ZIP com os resultados.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivos processados com sucesso",
                    content = @Content(mediaType = "application/octet-stream")),
            @ApiResponse(responseCode = "400", description = "RequisiÃ§Ã£o invÃ¡lida",
                    content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "401", description = "NÃ£o autorizado",
                    content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "403", description = "Acesso negado",
                    content = @Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json"))
    })
    @PostMapping("/process-holerite")
    public ResponseEntity<StreamingResponseBody> processHolerite(
            @Parameter(description = "Arquivo PDF Ãºnico") @RequestParam(value = "file", required = false) MultipartFile singleFile,
            @Parameter(description = "Lista de arquivos PDF") @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @Parameter(description = "Usar OCR para processamento") @RequestParam(value = "useOcr", defaultValue = "false") boolean useOcr) {
        try {
            logger.info("Iniciando processamento de holerites. useOcr: {}", useOcr);
            if (singleFile != null && (files == null || files.isEmpty())) {
                logger.info("Processando arquivo Ãºnico: {}", singleFile.getOriginalFilename());
                files = Collections.singletonList(singleFile);
            }
            if (files == null || files.isEmpty()) {
                logger.error("Nenhum arquivo foi enviado");
                throw new RuntimeException("Nenhum arquivo foi enviado. Use o campo 'file' para um Ãºnico arquivo ou 'files' para mÃºltiplos arquivos.");
            }
            logger.info("Processando {} arquivos", files.size());
            Map<String, List<byte[]>> processedFiles = useOcr ? 
                ocrService.processScannedPdfs(files) : 
                pdfService.processPdfFiles(files);
            if (processedFiles.isEmpty()) {
                logger.warn("Nenhum arquivo foi processado com sucesso");
                throw new RuntimeException("Nenhum arquivo foi processado com sucesso. Verifique se os arquivos sÃ£o PDFs vÃ¡lidos.");
            }
            logger.info("Arquivos processados com sucesso. Gerando PDF Ãºnico");
            StreamingResponseBody responseBody = outputStream -> {
                try (org.apache.pdfbox.pdmodel.PDDocument combinedDoc = new org.apache.pdfbox.pdmodel.PDDocument()) {
                    for (List<byte[]> holerites : processedFiles.values()) {
                        for (byte[] holerite : holerites) {
                            try (org.apache.pdfbox.pdmodel.PDDocument pageDoc = org.apache.pdfbox.pdmodel.PDDocument.load(holerite)) {
                                combinedDoc.addPage(pageDoc.getPage(0));
                            }
                        }
                    }
                    combinedDoc.save(outputStream);
                } catch (Exception e) {
                    logger.error("Erro ao gerar PDF Ãºnico", e);
                    throw new RuntimeException("Erro ao gerar PDF Ãºnico: " + e.getMessage(), e);
                } finally {
                    // fileStorageService.cleanup(); // Removido: mÃ©todo nÃ£o existe mais
                }
            };
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "holerites.pdf");
            logger.info("Retornando PDF Ãºnico com os holerites processados");
            return ResponseEntity.ok().headers(headers).body(responseBody);
        } catch (Exception e) {
            logger.error("Erro no processamento dos holerites", e);
            throw new RuntimeException("Erro no processamento dos holerites: " + e.getMessage());
        }
    }
} 
