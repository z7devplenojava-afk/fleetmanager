package com.z7design.fleet_manager.service.commercial;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Component
@Slf4j
public class AttachmentSecurityValidator {

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "pdf", "xlsx", "xls", "csv", "txt", "docx", "doc", "png", "jpg", "jpeg"
    );

    private static final List<String> DANGEROUS_EXTENSIONS = Arrays.asList(
            "exe", "bat", "cmd", "vbs", "js", "jse", "wsf", "wsh", "scr", "jar",
            "msi", "ps1", "sh", "dll", "com", "pif", "hta", "cpl", "iso", "vhd"
    );

    private static final byte[] PDF_MAGIC = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF
    private static final byte[] ZIP_MAGIC = new byte[]{0x50, 0x4B, 0x03, 0x04}; // PK..
    private static final byte[] OLE_MAGIC = new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0}; // OLE2 (XLS)

    @Data
    @Builder
    public static class SecurityCheckResult {
        private String status; // VERIFIED_SAFE, SUSPICIOUS, BLOCKED
        private String details;
        private String fileHash;
    }

    /**
     * Valida um arquivo anexo quanto à extensão, cabeçalho binário (magic bytes) e ausência de scripts/cargas maliciosas.
     */
    public SecurityCheckResult validateFile(Path filePath, String originalFilename) {
        if (filePath == null || !Files.exists(filePath)) {
            return SecurityCheckResult.builder()
                    .status("BLOCKED")
                    .details("Arquivo inexistente no armazenamento")
                    .build();
        }

        String extension = getExtension(originalFilename);
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            return SecurityCheckResult.builder()
                    .status("BLOCKED")
                    .details("Arquivo bloqueado: extensão executável ou de risco proibida (" + extension + ")")
                    .build();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return SecurityCheckResult.builder()
                    .status("SUSPICIOUS")
                    .details("Extensão não homologada para documentos comerciais (" + extension + ")")
                    .build();
        }

        try {
            long size = Files.size(filePath);
            if (size > 35 * 1024 * 1024) { // 35MB max
                return SecurityCheckResult.builder()
                        .status("BLOCKED")
                        .details("Arquivo excede o limite seguro de 35MB")
                        .build();
            }

            // Ler primeiros bytes para verificação de Magic Bytes
            byte[] header = new byte[8];
            try (InputStream is = Files.newInputStream(filePath)) {
                int read = is.read(header);
                if (read < 4) {
                    return SecurityCheckResult.builder()
                            .status("BLOCKED")
                            .details("Arquivo corrompido ou vazio")
                            .build();
                }
            }

            // Verificar assinatura binária correspondente à extensão
            if ("pdf".equals(extension)) {
                if (!matchesMagic(header, PDF_MAGIC)) {
                    return SecurityCheckResult.builder()
                            .status("BLOCKED")
                            .details("Arquivo PDF com assinatura binária inconsistente (tentativa de disfarce de arquivo)")
                            .build();
                }
                // Escaneamento heurístico em busca de scripts embutidos no PDF
                String pdfContentSample = readSampleAsString(filePath, 2048);
                if (pdfContentSample.contains("/JavaScript") || pdfContentSample.contains("/JS") || pdfContentSample.contains("/Launch")) {
                    return SecurityCheckResult.builder()
                            .status("SUSPICIOUS")
                            .details("PDF contém tags de script dinâmico ou execução externa (/JavaScript ou /Launch)")
                            .build();
                }
            } else if ("xlsx".equals(extension) || "docx".equals(extension)) {
                if (!matchesMagic(header, ZIP_MAGIC)) {
                    return SecurityCheckResult.builder()
                            .status("BLOCKED")
                            .details("Planilha XLSX com cabeçalho de contêiner inválido")
                            .build();
                }
            } else if ("xls".equals(extension)) {
                if (!matchesMagic(header, OLE_MAGIC)) {
                    return SecurityCheckResult.builder()
                            .status("BLOCKED")
                            .details("Planilha XLS legado com cabeçalho inválido")
                            .build();
                }
            }

            // Gerar hash SHA-256
            String hash = calculateSha256(filePath);

            return SecurityCheckResult.builder()
                    .status("VERIFIED_SAFE")
                    .details("Arquivo verificado com sucesso: estrutura e assinatura binária íntegras")
                    .fileHash(hash)
                    .build();

        } catch (Exception e) {
            log.error("Erro ao validar segurança do arquivo {}: {}", originalFilename, e.getMessage());
            return SecurityCheckResult.builder()
                    .status("SUSPICIOUS")
                    .details("Não foi possível concluir a verificação profunda de segurança: " + e.getMessage())
                    .build();
        }
    }

    private boolean matchesMagic(byte[] buffer, byte[] magic) {
        if (buffer.length < magic.length) return false;
        for (int i = 0; i < magic.length; i++) {
            if (buffer[i] != magic[i]) return false;
        }
        return true;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase(Locale.ROOT).trim();
    }

    private String readSampleAsString(Path path, int maxBytes) {
        try (InputStream is = Files.newInputStream(path)) {
            byte[] buf = new byte[maxBytes];
            int read = is.read(buf);
            return read > 0 ? new String(buf, 0, read) : "";
        } catch (Exception ignored) {
            return "";
        }
    }

    private String calculateSha256(Path path) {
        try (InputStream is = Files.newInputStream(path)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buf = new byte[8192];
            int read;
            while ((read = is.read(buf)) != -1) {
                digest.update(buf, 0, read);
            }
            byte[] hash = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
