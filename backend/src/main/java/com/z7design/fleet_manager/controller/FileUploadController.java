package com.z7design.fleet_manager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import com.z7design.fleet_manager.model.StoredUpload;
import com.z7design.fleet_manager.service.StoredUploadService;
import org.springframework.core.io.ByteArrayResource;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping({"/api/uploads", "/uploads"})
@RequiredArgsConstructor
@Tag(name = "Upload de Arquivos", description = "Endpoints para upload e download de comprovantes e documentos")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);
    private final StoredUploadService storedUploadService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.file.upload-dir:./uploads/maintenance}")
    private String maintenanceUploadDir;

    @PostMapping("/atestados")
    @Operation(summary = "Upload de atestado mÃ©dico", description = "Faz upload de atestado mÃ©dico para registro de falta")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Map<String, String>> uploadAtestado(
            @Parameter(description = "Arquivo do atestado")
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo nÃ£o pode estar vazio"));
            }

            // Validar tipo de arquivo (PDF, JPG, JPEG, PNG)
            String contentType = file.getContentType();
            if (contentType == null || !isValidFileType(contentType)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de arquivo nÃ£o permitido. Use PDF, JPG, JPEG ou PNG"));
            }

            // Validar tamanho (mÃ¡ximo 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo muito grande. MÃ¡ximo 10MB"));
            }

            // Gerar nome Ãºnico para o arquivo
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;

            // Criar diretório se não existir
            Path primaryDir = Paths.get(uploadDir, "atestados").toAbsolutePath().normalize();
            Path fallbackDir = Paths.get("uploads", "atestados").toAbsolutePath().normalize();

            // Salvar arquivo em banco + disco (com fallback)
            byte[] fileBytes = file.getBytes();
            storedUploadService.saveWithDiskFallback(
                    primaryDir, fallbackDir, "atestados", uniqueFilename, contentType, fileBytes);

            // Retornar informaÃ§Ãµes do arquivo
            Map<String, String> response = new HashMap<>();
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("path", "atestados/" + uniqueFilename);
            response.put("size", String.valueOf(file.getSize()));
            response.put("contentType", contentType);
            response.put("url", "/api/uploads/atestados/" + uniqueFilename);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao salvar arquivo: " + e.getMessage()));
        }
    }

    @PostMapping("/comprovantes")
    @Operation(summary = "Upload de comprovante de pagamento", description = "Faz upload de comprovante de pagamento para conta a pagar")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invÃ¡lido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    public ResponseEntity<Map<String, String>> uploadComprovante(
            @Parameter(description = "Arquivo do comprovante")
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Validar arquivo
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo nÃ£o pode estar vazio"));
            }

            // Validar tipo de arquivo (PDF, JPG, JPEG, PNG)
            String contentType = file.getContentType();
            if (contentType == null || !isValidFileType(contentType)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de arquivo nÃ£o permitido. Use PDF, JPG, JPEG ou PNG"));
            }

            // Validar tamanho (mÃ¡ximo 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo muito grande. MÃ¡ximo 10MB"));
            }

            // Gerar nome Ãºnico para o arquivo
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;

            // Criar diretório se não existir
            Path primaryDir = Paths.get(uploadDir, "comprovantes").toAbsolutePath().normalize();
            Path fallbackDir = Paths.get("uploads", "comprovantes").toAbsolutePath().normalize();

            // Salvar arquivo em banco + disco (com fallback)
            byte[] fileBytes = file.getBytes();
            storedUploadService.saveWithDiskFallback(
                    primaryDir, fallbackDir, "comprovantes", uniqueFilename, contentType, fileBytes);

            // Retornar informaÃ§Ãµes do arquivo
            Map<String, String> response = new HashMap<>();
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("path", "comprovantes/" + uniqueFilename);
            response.put("size", String.valueOf(file.getSize()));
            response.put("contentType", contentType);
            response.put("url", "/api/uploads/comprovantes/" + uniqueFilename);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao salvar arquivo: " + e.getMessage()));
        }
    }

    @GetMapping("/atestados/{filename:.+}")
    @Operation(summary = "Download de atestado médico", description = "Retorna atestado de disco ou banco de dados")
    public ResponseEntity<Resource> downloadAtestado(@PathVariable("filename") String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            return ResponseEntity.notFound().build();
        }
        return serveUploadedFile(
                buildDiskCandidates("atestados", filename),
                "atestados",
                filename,
                Paths.get("uploads", "atestados"),
                false);
    }

    @GetMapping({"/comprovantes/{filename:.+}", "/comprovantes/{filename}"})
    @Operation(summary = "Download de comprovante", description = "Faz download de um comprovante de pagamento")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Arquivo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Resource> downloadComprovante(
            @Parameter(description = "Nome do arquivo")
            @PathVariable("filename") String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            return ResponseEntity.notFound().build();
        }
        return serveUploadedFile(
                buildDiskCandidates("comprovantes", filename),
                "comprovantes",
                filename,
                Paths.get("uploads", "comprovantes"),
                false);
    }

    @DeleteMapping("/comprovantes/{filename}")
    @Operation(summary = "Excluir comprovante", description = "Exclui um comprovante de pagamento")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Arquivo excluÃ­do com sucesso"),
            @ApiResponse(responseCode = "404", description = "Arquivo nÃ£o encontrado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado")
    })
    public ResponseEntity<Map<String, String>> deleteComprovante(
            @Parameter(description = "Nome do arquivo")
            @PathVariable("filename") String filename) {
        
        try {
            Path filePath = Paths.get(uploadDir, "comprovantes").resolve(filename);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return ResponseEntity.ok(Map.of("message", "Arquivo excluÃ­do com sucesso"));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao excluir arquivo: " + e.getMessage()));
        }
    }
    
    /**
     * Download de arquivo do chat
     */
    @GetMapping({"/chat/{subDir}/{filename:.+}", "/chat/{subDir}/{filename}"})
    public ResponseEntity<Resource> downloadChatFile(
            @PathVariable("subDir") String subDir,
            @PathVariable("filename") String filename) {
        if (subDir == null || subDir.contains("..") || filename == null || filename.isBlank() || filename.contains("..")) {
            return ResponseEntity.notFound().build();
        }
        String category = "chat/" + subDir;
        return serveUploadedFile(
                buildDiskCandidates(category, filename),
                category,
                filename,
                Paths.get("uploads", "chat", subDir),
                false);
    }

    @PostMapping({"/companies/logo", "/companies/logos"})
    @Operation(summary = "Upload de logo da empresa", description = "Faz upload de logo da empresa (PNG, JPG, JPEG, SVG, WEBP, ICO)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logo enviado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo inválido"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor")
    })
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'SUPER_ADMIN', 'ADMIN', 'HR', 'HR_WRITE', 'COMPANY_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_GESTOR', 'GESTOR', 'ROLE_FLEX_ADMIN', 'FLEX_ADMIN', 'ROLE_TI_SUPORTE', 'TI_SUPORTE')")
    public ResponseEntity<Map<String, String>> uploadCompanyLogo(
            @Parameter(description = "Arquivo do logo (PNG, JPG, JPEG, SVG, WEBP, ICO)")
            @RequestParam("file") MultipartFile file) {
        
        try {
            log.info("📤 Iniciando upload de logo da empresa - Nome original: {}, Tamanho: {} bytes", 
                    file != null ? file.getOriginalFilename() : "null", file != null ? file.getSize() : 0);
            
            // Validar arquivo
            if (file == null || file.isEmpty()) {
                log.warn("❌ Arquivo vazio recebido");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo não pode estar vazio"));
            }

            // Sanitizar nome original com segurança (evitar IllegalArgumentException)
            String rawFilename = file.getOriginalFilename();
            String originalFilename = (rawFilename != null && !rawFilename.trim().isEmpty())
                    ? StringUtils.cleanPath(rawFilename)
                    : "logo.png";

            // Validar tipo de arquivo (PNG, JPG, JPEG, SVG, WEBP, ICO)
            String contentType = file.getContentType();
            if (contentType != null) {
                contentType = contentType.split(";")[0].trim().toLowerCase();
            }
            log.info("📄 Content-Type recebido: {}, Nome: {}", contentType, originalFilename);
            
            boolean validContentType = isValidImageType(contentType);
            boolean validExtension = isAllowedImageExtension(originalFilename);

            if (!validContentType && !validExtension) {
                log.warn("❌ Tipo de arquivo inválido: contentType={}, filename={}", contentType, originalFilename);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de arquivo não permitido. Use PNG, JPG, JPEG, SVG, WEBP ou ICO"));
            }

            // Validar tamanho (máximo 50MB para logos)
            if (file.getSize() > 50 * 1024 * 1024) {
                log.warn("❌ Arquivo muito grande: {} bytes", file.getSize());
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo muito grande. Máximo 50MB"));
            }

            // Obter extensão
            String fileExtension = getFileExtension(originalFilename);
            if (fileExtension.isEmpty()) {
                if (contentType != null && (contentType.equals("image/jpeg") || contentType.equals("image/jpg"))) {
                    fileExtension = "jpg";
                } else if (contentType != null && contentType.equals("image/webp")) {
                    fileExtension = "webp";
                } else if (contentType != null && contentType.equals("image/svg+xml")) {
                    fileExtension = "svg";
                } else if (contentType != null && (contentType.equals("image/x-icon") || contentType.equals("image/vnd.microsoft.icon"))) {
                    fileExtension = "ico";
                } else {
                    fileExtension = "png";
                }
            }
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;
            
            log.info("📄 Nome único gerado: {}", uniqueFilename);

            // Salvar em banco (PostgreSQL) + disco com fallback resiliente
            Path primaryDir = Paths.get(uploadDir, "companies", "logos").toAbsolutePath().normalize();
            Path fallbackDir = Paths.get("uploads", "companies", "logos").toAbsolutePath().normalize();
            String resolvedCt = contentType != null ? contentType : "image/" + fileExtension;

            byte[] logoBytes = file.getBytes();
            storedUploadService.saveWithDiskFallback(
                    primaryDir, fallbackDir, "companies/logos", uniqueFilename, resolvedCt, logoBytes);

            // Retornar informações do arquivo
            String relativeUrl = "/api/uploads/companies/logos/" + uniqueFilename;

            Map<String, String> response = new HashMap<>();
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("path", "companies/logos/" + uniqueFilename);
            response.put("size", String.valueOf(file.getSize()));
            response.put("contentType", resolvedCt);
            response.put("url", relativeUrl);

            log.info("✅ Upload de logo concluído com sucesso ({} bytes). URL: {}", logoBytes.length, relativeUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("❌ Erro ao salvar arquivo de logo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao salvar arquivo: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erro inesperado ao fazer upload de logo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro inesperado: " + e.getMessage()));
        }
    }

    @GetMapping({
        "/companies/logos/{filename:.+}",
        "/companies/logos/{filename}",
        "/companies/logo/{filename:.+}",
        "/companies/logo/{filename}",
        "/companies/logos",
        "/companies/logo"
    })
    @Operation(summary = "Obter logo da empresa", description = "Retorna o arquivo de logo da empresa")
    public ResponseEntity<Resource> getCompanyLogo(
            @Parameter(description = "Nome do arquivo")
            @PathVariable(value = "filename", required = false) String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..") ||
            filename.contains("e9654118-53a8-4dd8-b57c-bc50997f081b") ||
            "logo".equalsIgnoreCase(filename) || "logos".equalsIgnoreCase(filename)) {
            return ResponseEntity.noContent().build();
        }
        return serveUploadedFile(
                buildDiskCandidates("companies/logos", filename),
                "companies/logos",
                filename,
                Paths.get("uploads", "companies", "logos"),
                true);
    }

    @GetMapping({
        "/companies/banners/{filename:.+}",
        "/companies/banners/{filename}",
        "/companies/banner/{filename:.+}",
        "/companies/banner/{filename}",
        "/companies/banners",
        "/companies/banner"
    })
    @Operation(summary = "Obter banner da empresa", description = "Retorna o arquivo de banner da empresa")
    public ResponseEntity<Resource> getCompanyBanner(
            @Parameter(description = "Nome do arquivo")
            @PathVariable(value = "filename", required = false) String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..") ||
            "banner".equalsIgnoreCase(filename) || "banners".equalsIgnoreCase(filename)) {
            return ResponseEntity.noContent().build();
        }
        return serveUploadedFile(
                buildDiskCandidates("companies/banners", filename),
                "companies/banners",
                filename,
                Paths.get("uploads", "companies", "banners"),
                true);
    }

    @GetMapping({
        "/maintenance/{filename:.+}",
        "/maintenance/{filename}",
        "/uploads/maintenance/{filename:.+}"
    })
    @Operation(summary = "Obter foto/evidência de manutenção", description = "Retorna foto de evidência de OS de disco ou banco de dados")
    public ResponseEntity<Resource> getMaintenancePhoto(@PathVariable("filename") String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            return ResponseEntity.notFound().build();
        }
        Path[] candidates = new Path[] {
            Paths.get(maintenanceUploadDir).resolve(filename).toAbsolutePath().normalize(),
            Paths.get(uploadDir, "maintenance").resolve(filename).toAbsolutePath().normalize(),
            Paths.get("uploads", "maintenance").resolve(filename).toAbsolutePath().normalize(),
            Paths.get("receipts").resolve(filename).toAbsolutePath().normalize(),
            Paths.get(uploadDir, "receipts").resolve(filename).toAbsolutePath().normalize(),
            Paths.get("..", "uploads", "maintenance").resolve(filename).toAbsolutePath().normalize(),
            Paths.get("/app/uploads/maintenance").resolve(filename).toAbsolutePath().normalize(),
            Paths.get("/app/receipts").resolve(filename).toAbsolutePath().normalize(),
            Paths.get("/var/www/fluxbus/uploads/maintenance").resolve(filename).toAbsolutePath().normalize()
        };
        return serveUploadedFile(candidates, "maintenance", filename, Paths.get(maintenanceUploadDir), false);
    }

    @GetMapping("/vehicle-gate-checklists/odometer-photos/{filename:.+}")
    @Operation(summary = "Obter foto do odômetro do checklist de portaria")
    public ResponseEntity<Resource> getGateOdometerPhoto(@PathVariable("filename") String filename) {
        return serveSubDirPhoto("vehicle-gate-checklists/odometer-photos", filename);
    }

    @GetMapping("/client-checklists/odometer-photos/{filename:.+}")
    @Operation(summary = "Obter foto do odômetro do checklist de cliente")
    public ResponseEntity<Resource> getClientChecklistOdometerPhoto(@PathVariable("filename") String filename) {
        return serveSubDirPhoto("client-checklists/odometer-photos", filename);
    }

    @GetMapping("/transport-mobilizations/odometer-photos/{filename:.+}")
    @Operation(summary = "Obter foto do odômetro da mobilização de transporte")
    public ResponseEntity<Resource> getTransportMobilizationOdometerPhoto(@PathVariable("filename") String filename) {
        return serveSubDirPhoto("transport-mobilizations/odometer-photos", filename);
    }

    @GetMapping("/km-controls/dashboard-photos/{filename:.+}")
    @Operation(summary = "Obter foto do painel de controle de KM")
    public ResponseEntity<Resource> getKmControlDashboardPhoto(@PathVariable("filename") String filename) {
        return serveSubDirPhoto("km-controls/dashboard-photos", filename);
    }

    @GetMapping("/lavajato/{filename:.+}")
    @Operation(summary = "Obter foto do checklist de lavajato")
    public ResponseEntity<Resource> getLavajatoPhoto(@PathVariable("filename") String filename) {
        return serveSubDirPhoto("lavajato", filename);
    }

    @GetMapping("/vehicle-cleaning/{filename:.+}")
    @Operation(summary = "Obter foto de higienização/limpeza de veículo")
    public ResponseEntity<Resource> getVehicleCleaningPhoto(@PathVariable("filename") String filename) {
        return serveSubDirPhoto("vehicle-cleaning", filename);
    }

    @GetMapping("/vehicles/{vehicleId}/{filename:.+}")
    @Operation(summary = "Obter foto da galeria/checklist do veículo")
    public ResponseEntity<Resource> getVehicleGalleryPhoto(
            @PathVariable("vehicleId") String vehicleId,
            @PathVariable("filename") String filename) {
        if (vehicleId == null || vehicleId.contains("..") || filename == null || filename.isBlank() || filename.contains("..")) {
            return ResponseEntity.notFound().build();
        }
        return serveSubDirPhoto("vehicles/" + vehicleId, filename);
    }

    private ResponseEntity<Resource> serveSubDirPhoto(String subDir, String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            return ResponseEntity.notFound().build();
        }
        return serveUploadedFile(
                buildDiskCandidates(subDir, filename),
                subDir,
                filename,
                Paths.get("uploads", subDir),
                false);
    }

    private Path[] buildDiskCandidates(String subDir, String filename) {
        String cleanSub = subDir.replace("\\", "/").replaceFirst("^/+", "");
        return new Path[] {
            Paths.get(uploadDir, cleanSub, filename).toAbsolutePath().normalize(),
            Paths.get("uploads", cleanSub, filename).toAbsolutePath().normalize(),
            Paths.get("..", "uploads", cleanSub, filename).toAbsolutePath().normalize(),
            Paths.get("/app/uploads", cleanSub, filename).toAbsolutePath().normalize(),
            Paths.get("/var/www/fluxbus/uploads", cleanSub, filename).toAbsolutePath().normalize()
        };
    }

    private ResponseEntity<Resource> serveUploadedFile(
            Path[] candidates,
            String dbCategory,
            String filename,
            Path cacheDir,
            boolean returnNoContentWhenMissing) {
        try {
            String lowerName = filename.toLowerCase();
            String fallbackCt = lowerName.endsWith(".pdf") ? "application/pdf"
                    : lowerName.endsWith(".xml") ? "application/xml"
                    : lowerName.endsWith(".png") ? "image/png"
                    : lowerName.endsWith(".webp") ? "image/webp"
                    : lowerName.endsWith(".svg") ? "image/svg+xml"
                    : lowerName.endsWith(".ico") ? "image/x-icon"
                    : "image/jpeg";
            for (Path candidate : candidates) {
                if (Files.exists(candidate) && Files.isRegularFile(candidate) && Files.isReadable(candidate)) {
                    String contentType = Files.probeContentType(candidate);
                    return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType != null ? contentType : fallbackCt))
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                        .body(new UrlResource(candidate.toUri()));
                }
            }

            Optional<StoredUpload> dbPhoto = storedUploadService.find(dbCategory, filename);
            if (dbPhoto.isPresent() && dbPhoto.get().getData() != null && dbPhoto.get().getData().length > 0) {
                StoredUpload stored = dbPhoto.get();
                try {
                    Path absCache = cacheDir.toAbsolutePath().normalize();
                    Files.createDirectories(absCache);
                    Files.write(absCache.resolve(filename), stored.getData());
                } catch (Exception ignored) {}
                String ct = stored.getContentType() != null && !stored.getContentType().isBlank()
                        ? stored.getContentType()
                        : fallbackCt;
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(ct))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(new ByteArrayResource(stored.getData()));
            }
            return returnNoContentWhenMissing ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return returnNoContentWhenMissing ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        }
    }

    @PostMapping({"/companies/banner-upload", "/companies/banners", "/companies/banner"})
    @Operation(summary = "Upload de banner da empresa", description = "Faz upload de banner motivacional da empresa (PNG, JPG, JPEG, SVG, WEBP)")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_RH', 'SUPER_ADMIN', 'ADMIN', 'HR', 'HR_WRITE', 'COMPANY_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_GESTOR', 'GESTOR', 'ROLE_FLEX_ADMIN', 'FLEX_ADMIN', 'ROLE_TI_SUPORTE', 'TI_SUPORTE')")
    public ResponseEntity<Map<String, String>> uploadCompanyBanner(
            @Parameter(description = "Arquivo do banner (PNG, JPG, JPEG, SVG, WEBP)")
            @RequestParam("file") MultipartFile file) {
        
        try {
            log.info("📥 Iniciando upload de banner da empresa - Nome original: {}, Tamanho: {} bytes", 
                    file != null ? file.getOriginalFilename() : "null", file != null ? file.getSize() : 0);
            
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo não pode estar vazio"));
            }

            String contentType = file.getContentType();
            if (contentType != null) {
                contentType = contentType.split(";")[0].trim().toLowerCase();
            }
            String rawFilename = file.getOriginalFilename();
            String originalFilename = StringUtils.cleanPath(rawFilename != null && !rawFilename.trim().isEmpty() ? rawFilename : "banner.png");
            
            if (!isValidImageType(contentType) && !isAllowedImageExtension(originalFilename)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de arquivo não permitido. Use PNG, JPG, JPEG, SVG ou WEBP"));
            }

            // Máximo 10MB para banners
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Arquivo muito grande. Máximo 10MB"));
            }

            String fileExtension = getFileExtension(originalFilename);
            if (fileExtension.isEmpty()) {
                if (contentType != null && (contentType.equals("image/jpeg") || contentType.equals("image/jpg"))) {
                    fileExtension = "jpg";
                } else if (contentType != null && contentType.equals("image/webp")) {
                    fileExtension = "webp";
                } else {
                    fileExtension = "png";
                }
            }
            String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;
            
            Path primaryDir = Paths.get(uploadDir, "companies", "banners").toAbsolutePath().normalize();
            Path fallbackDir = Paths.get("uploads", "companies", "banners").toAbsolutePath().normalize();
            String resolvedCt = contentType != null ? contentType : "image/" + fileExtension;

            byte[] bannerBytes = file.getBytes();
            storedUploadService.saveWithDiskFallback(
                    primaryDir, fallbackDir, "companies/banners", uniqueFilename, resolvedCt, bannerBytes);

            String relativeUrl = "/api/uploads/companies/banners/" + uniqueFilename;

            Map<String, String> response = new HashMap<>();
            response.put("filename", uniqueFilename);
            response.put("originalName", originalFilename);
            response.put("path", "companies/banners/" + uniqueFilename);
            response.put("size", String.valueOf(file.getSize()));
            response.put("contentType", resolvedCt);
            response.put("url", relativeUrl);

            log.info("✅ Upload de banner concluído com sucesso ({} bytes). URL: {}", bannerBytes.length, relativeUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("❌ Erro ao salvar arquivo de banner: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao salvar banner: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erro inesperado ao fazer upload de banner: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro inesperado: " + e.getMessage()));
        }
    }

    // Métodos auxiliares
    private boolean isValidFileType(String contentType) {
        return contentType != null && (
            contentType.equals("application/pdf") ||
            contentType.equals("image/jpeg") ||
            contentType.equals("image/jpg") ||
            contentType.equals("image/png")
        );
    }

    private boolean isValidImageType(String contentType) {
        return contentType != null && (
            contentType.equals("image/jpeg") ||
            contentType.equals("image/jpg") ||
            contentType.equals("image/png") ||
            contentType.equals("image/webp") ||
            contentType.equals("image/svg+xml") ||
            contentType.equals("image/x-icon") ||
            contentType.equals("image/vnd.microsoft.icon")
        );
    }

    private boolean isAllowedImageExtension(String filename) {
        if (filename == null) return false;
        String ext = getFileExtension(filename).toLowerCase();
        return ext.equals("png") || ext.equals("jpg") || ext.equals("jpeg") || 
               ext.equals("svg") || ext.equals("webp") || ext.equals("ico");
    }

    private String getFileExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        }
        return "";
    }
}
