package com.z7design.fleet_manager.controller;

import com.z7design.fleet_manager.service.PdfService;
import com.z7design.fleet_manager.service.OcrService;
import com.z7design.fleet_manager.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/holerites")
public class HoleriteController {
    private static final Logger logger = LoggerFactory.getLogger(HoleriteController.class);
    private static final int BUFFER_SIZE = 8192;

    @Autowired
    private PdfService pdfService;

    @Autowired
    private OcrService ocrService;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/process")
    public ResponseEntity<StreamingResponseBody> processHolerites(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "useOcr", defaultValue = "false") boolean useOcr) {
        
        try {
            // Processar arquivos em background
            CompletableFuture<Map<String, List<byte[]>>> processingFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    return useOcr ? 
                        ocrService.processScannedPdfs(files) : 
                        pdfService.processPdfFiles(files);
                } catch (Exception e) {
                    logger.error("Erro no processamento dos holerites", e);
                    throw new RuntimeException("Erro no processamento dos holerites", e);
                }
            });

            // Criar streaming response
            StreamingResponseBody responseBody = outputStream -> {
                try (ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(outputStream, BUFFER_SIZE))) {
                    // Aguardar processamento
                    Map<String, List<byte[]>> holeritesPorCpf = processingFuture.get();

                    // Escrever arquivos no ZIP
                    for (Map.Entry<String, List<byte[]>> entry : holeritesPorCpf.entrySet()) {
                        String cpf = entry.getKey();
                        List<byte[]> holerites = entry.getValue();

                        for (int i = 0; i < holerites.size(); i++) {
                            String fileName = String.format("%s_holerite_%d.pdf", cpf, i + 1);
                            ZipEntry zipEntry = new ZipEntry(fileName);
                            zos.putNextEntry(zipEntry);

                            // Escrever em chunks para economizar memÃ³ria
                            byte[] holerite = holerites.get(i);
                            int offset = 0;
                            while (offset < holerite.length) {
                                int length = Math.min(BUFFER_SIZE, holerite.length - offset);
                                zos.write(holerite, offset, length);
                                offset += length;
                            }
                            zos.closeEntry();
                        }
                    }
                } catch (Exception e) {
                    logger.error("Erro ao gerar arquivo ZIP", e);
                    throw new RuntimeException("Erro ao gerar arquivo ZIP", e);
                } finally {
                    // fileStorageService.cleanup(); // Removido: mÃ©todo nÃ£o existe mais
                }
            };

            // Configurar headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "holerites.zip");

            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .body(responseBody);

        } catch (Exception e) {
            logger.error("Erro no processamento dos holerites", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable("fileName") String fileName) throws IOException {
        String userHome = System.getProperty("user.home");
        Path filePath = Paths.get(userHome, "temp_holerites").resolve(fileName);
        Resource resource = new UrlResource(filePath.toUri());

        if (resource.exists() && resource.isReadable()) {
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        // TODO: Implementar status do processamento
        return ResponseEntity.ok(Map.of(
            "status", "active",
            "processedFiles", 0,
            "pendingFiles", 0
        ));
    }
} 
