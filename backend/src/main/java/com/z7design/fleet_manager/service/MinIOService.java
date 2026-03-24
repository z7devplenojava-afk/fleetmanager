package com.z7design.fleet_manager.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetObjectArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Service
public class MinIOService {
    
    private final MinioClient minioClient;
    private final String pagesBucket;
    private final String unifiedBucket;
    private final boolean enabled;
    
    public MinIOService(
            @Value("${minio.url}") String url,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey,
            @Value("${minio.bucket.pages}") String pagesBucket,
            @Value("${minio.bucket.unified}") String unifiedBucket,
            @Value("${minio.enabled:false}") boolean enabled) {
        this.pagesBucket = pagesBucket;
        this.unifiedBucket = unifiedBucket;
        this.enabled = enabled;
        
        if (enabled) {
            this.minioClient = MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
            initializeBuckets();
        } else {
            this.minioClient = null;
            log.warn("MinIO estÃ¡ desabilitado. Arquivos serÃ£o armazenados localmente.");
        }
    }
    
    private void initializeBuckets() {
        if (!enabled) return;
        // Buckets serÃ£o criados automaticamente no primeiro upload
    }
    
    public String uploadPage(byte[] imageBytes, String jobId, int pageIndex) {
        if (!enabled) {
            // Fallback: salvar localmente no sistema de arquivos
            try {
                Path baseDir = Paths.get("uploads", "pages", jobId);
                Files.createDirectories(baseDir);
                
                Path filePath = baseDir.resolve("page-" + pageIndex + ".png");
                Files.write(filePath, imageBytes);
                
                log.info("âœ… Arquivo salvo localmente: {} (tamanho: {} bytes)", filePath.toAbsolutePath(), imageBytes.length);
                return "local://pages/" + jobId + "/page-" + pageIndex + ".png";
            } catch (Exception e) {
                log.error("âŒ Erro ao salvar arquivo localmente", e);
                throw new RuntimeException("Erro ao salvar arquivo localmente: " + e.getMessage(), e);
            }
        }
        
        try {
            String objectName = jobId + "/page-" + pageIndex + ".png";
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(pagesBucket)
                    .object(objectName)
                    .stream(new ByteArrayInputStream(imageBytes), imageBytes.length, -1)
                    .contentType("image/png")
                    .build()
            );
            return "s3://" + pagesBucket + "/" + objectName;
        } catch (Exception e) {
            log.error("Erro ao fazer upload para MinIO", e);
            throw new RuntimeException("Erro ao fazer upload para MinIO", e);
        }
    }
    
    public byte[] downloadBytes(String s3Url) {
        if (!enabled || s3Url.startsWith("local://")) {
            // Fallback: ler do sistema de arquivos local
            try {
                if (s3Url.startsWith("local://")) {
                    // Remover prefixo "local://" e construir caminho
                    String relativePath = s3Url.replace("local://", "");
                    Path filePath = Paths.get("uploads", relativePath);
                    
                    if (Files.exists(filePath)) {
                        byte[] bytes = Files.readAllBytes(filePath);
                        log.debug("âœ… Arquivo local lido: {} (tamanho: {} bytes)", filePath.toAbsolutePath(), bytes.length);
                        return bytes;
                    } else {
                        log.error("âŒ Arquivo local NÃƒO encontrado: {}", filePath.toAbsolutePath());
                        // Verificar se o diretÃ³rio existe
                        Path parentDir = filePath.getParent();
                        if (parentDir != null && Files.exists(parentDir)) {
                            log.warn("DiretÃ³rio existe mas arquivo nÃ£o: {}", parentDir.toAbsolutePath());
                        } else {
                            log.warn("DiretÃ³rio nÃ£o existe: {}", parentDir != null ? parentDir.toAbsolutePath() : "null");
                        }
                        return new byte[0];
                    }
                } else {
                    // Tentar ler do diretÃ³rio padrÃ£o
                    Path filePath = Paths.get("uploads", s3Url);
                    if (Files.exists(filePath)) {
                        return Files.readAllBytes(filePath);
                    }
                    return new byte[0];
                }
            } catch (Exception e) {
                log.error("Erro ao ler arquivo local: {}", s3Url, e);
                return new byte[0];
            }
        }
        
        try {
            String[] parts = s3Url.replace("s3://", "").split("/", 2);
            String bucket = parts[0];
            String objectName = parts[1];
            
            InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .build()
            );
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            stream.transferTo(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao fazer download do MinIO", e);
            throw new RuntimeException("Erro ao fazer download do MinIO", e);
        }
    }
    
    public String uploadUnifiedPdf(byte[] pdfBytes, String fileName) {
        if (!enabled) {
            return "local://unified/" + fileName;
        }
        
        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(unifiedBucket)
                    .object(fileName)
                    .stream(new ByteArrayInputStream(pdfBytes), pdfBytes.length, -1)
                    .contentType("application/pdf")
                    .build()
            );
            return "s3://" + unifiedBucket + "/" + fileName;
        } catch (Exception e) {
            log.error("Erro ao fazer upload do PDF unificado", e);
            throw new RuntimeException("Erro ao fazer upload do PDF unificado", e);
        }
    }
}


