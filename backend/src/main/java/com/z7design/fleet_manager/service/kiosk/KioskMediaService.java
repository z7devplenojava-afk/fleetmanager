package com.z7design.fleet_manager.service.kiosk;

import com.z7design.fleet_manager.dto.kiosk.KioskMediaAssetDTO;
import com.z7design.fleet_manager.model.Company;
import com.z7design.fleet_manager.model.kiosk.KioskMediaAsset;
import com.z7design.fleet_manager.repository.CompanyRepository;
import com.z7design.fleet_manager.repository.kiosk.KioskMediaAssetRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class KioskMediaService {

    private final KioskMediaAssetRepository mediaAssetRepository;
    private final CompanyRepository companyRepository;

    @Value("${app.kiosk.media-dir:./uploads/kiosk-media}")
    private String mediaUploadDir;

    private Path rootStorageLocation;

    private static final Set<String> ALLOWED_IMAGE_EXT = Set.of("jpg", "jpeg", "png", "webp", "gif", "svg");
    private static final Set<String> ALLOWED_VIDEO_EXT = Set.of("mp4", "webm");
    private static final Set<String> ALLOWED_AUDIO_EXT = Set.of("mp3", "wav", "ogg");
    private static final Set<String> ALLOWED_DOC_EXT = Set.of("pdf");

    @PostConstruct
    public void init() {
        this.rootStorageLocation = Paths.get(mediaUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootStorageLocation);
            log.info("Kiosk Media Storage inicializado em: {}", this.rootStorageLocation);
        } catch (IOException e) {
            log.error("Falha ao inicializar o diretório de armazenamento de mídia dos totens", e);
            throw new RuntimeException("Não foi possível criar o diretório de mídia de totens", e);
        }
    }

    private UUID getResolvedCompanyId() {
        UUID companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            // Fallback para primeira empresa se contexto não tiver
            List<Company> companies = companyRepository.findAll();
            if (!companies.isEmpty()) {
                companyId = companies.get(0).getId();
            } else {
                throw new IllegalStateException("Nenhuma empresa encontrada no sistema para associar a mídia.");
            }
        }
        return companyId;
    }

    @Transactional(readOnly = true)
    public List<KioskMediaAssetDTO> findAll() {
        UUID companyId = getResolvedCompanyId();
        return mediaAssetRepository.findByCompanyId(companyId).stream()
                .map(KioskMediaAssetDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<KioskMediaAssetDTO> findAllPaged(String mediaType, Pageable pageable) {
        UUID companyId = getResolvedCompanyId();
        if (StringUtils.hasText(mediaType) && !"ALL".equalsIgnoreCase(mediaType)) {
            return mediaAssetRepository.findByCompanyIdAndMediaType(companyId, mediaType.toUpperCase(), pageable)
                    .map(KioskMediaAssetDTO::fromEntity);
        }
        return mediaAssetRepository.findByCompanyId(companyId, pageable)
                .map(KioskMediaAssetDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public KioskMediaAssetDTO findById(UUID id) {
        KioskMediaAsset asset = getMediaAssetEntity(id);
        return KioskMediaAssetDTO.fromEntity(asset);
    }

    public KioskMediaAsset getMediaAssetEntity(UUID id) {
        return mediaAssetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Arquivo de mídia não encontrado: " + id));
    }

    @Transactional
    public KioskMediaAssetDTO uploadMedia(MultipartFile file, String customName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de upload está vazio.");
        }

        UUID companyId = getResolvedCompanyId();
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "media"));
        
        // Proteção Path Traversal
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new SecurityException("Nome de arquivo inválido.");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        String mediaType = detectMediaType(extension);
        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        String assetName = StringUtils.hasText(customName) ? customName.trim() : originalFilename;

        // Calcular SHA-256 e salvar arquivo
        try {
            byte[] fileBytes = file.getBytes();
            String sha256 = calculateSha256(fileBytes);

            // Subpasta por tenant e data: {companyId}/{year}/{month}/
            LocalDateTime now = LocalDateTime.now();
            String subDir = String.format("%s/%s", companyId, now.format(DateTimeFormatter.ofPattern("yyyy/MM")));
            Path targetDir = this.rootStorageLocation.resolve(subDir).normalize();
            Files.createDirectories(targetDir);

            String savedFileName = String.format("%s_%s.%s", sha256.substring(0, 16), UUID.randomUUID().toString().substring(0, 8), extension);
            Path targetFilePath = targetDir.resolve(savedFileName).normalize();
            Files.write(targetFilePath, fileBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            String relativeStorageKey = subDir + "/" + savedFileName;

            // Extrair dimensões se for imagem
            Integer width = null;
            Integer height = null;
            String thumbnailRelativeKey = null;

            if ("IMAGE".equals(mediaType) && !"svg".equals(extension)) {
                try {
                    BufferedImage bimg = ImageIO.read(new ByteArrayInputStream(fileBytes));
                    if (bimg != null) {
                        width = bimg.getWidth();
                        height = bimg.getHeight();

                        // Gerar thumbnail (max 300x300)
                        String thumbFileName = "thumb_" + savedFileName;
                        Path thumbFilePath = targetDir.resolve(thumbFileName);
                        generateThumbnail(bimg, thumbFilePath, extension);
                        thumbnailRelativeKey = subDir + "/" + thumbFileName;
                    }
                } catch (Exception ex) {
                    log.warn("Não foi possível extrair dimensões/thumbnail da imagem: {}", ex.getMessage());
                }
            }

            KioskMediaAsset asset = KioskMediaAsset.builder()
                    .companyId(companyId)
                    .name(assetName)
                    .mediaType(mediaType)
                    .mimeType(mimeType)
                    .fileSizeBytes(file.getSize())
                    .storageKey(relativeStorageKey)
                    .checksumSha256(sha256)
                    .width(width)
                    .height(height)
                    .thumbnailStorageKey(thumbnailRelativeKey)
                    .processingStatus("READY")
                    .build();

            KioskMediaAsset saved = mediaAssetRepository.save(asset);
            log.info("Mídia cadastrada com sucesso: {} ({}) para tenant {}", saved.getName(), saved.getId(), companyId);

            return KioskMediaAssetDTO.fromEntity(saved);

        } catch (IOException e) {
            log.error("Erro ao salvar arquivo de mídia", e);
            throw new RuntimeException("Erro ao processar e salvar arquivo de mídia: " + e.getMessage(), e);
        }
    }

    public Resource loadFileAsResource(UUID assetId) {
        KioskMediaAsset asset = getMediaAssetEntity(assetId);
        try {
            Path filePath = this.rootStorageLocation.resolve(asset.getStorageKey()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileNotFoundException("Arquivo de mídia não encontrado no disco: " + asset.getStorageKey());
            }
        } catch (MalformedURLException | FileNotFoundException e) {
            throw new RuntimeException("Arquivo não encontrado: " + asset.getStorageKey(), e);
        }
    }

    public Resource loadThumbnailAsResource(UUID assetId) {
        KioskMediaAsset asset = getMediaAssetEntity(assetId);
        if (asset.getThumbnailStorageKey() == null) {
            return loadFileAsResource(assetId);
        }

        try {
            Path thumbPath = this.rootStorageLocation.resolve(asset.getThumbnailStorageKey()).normalize();
            Resource resource = new UrlResource(thumbPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                return loadFileAsResource(assetId);
            }
        } catch (MalformedURLException e) {
            return loadFileAsResource(assetId);
        }
    }

    @Transactional
    public void delete(UUID id) {
        KioskMediaAsset asset = getMediaAssetEntity(id);
        
        // Remove do banco
        mediaAssetRepository.delete(asset);

        // Exclui arquivos físicos
        try {
            Path mainFile = this.rootStorageLocation.resolve(asset.getStorageKey()).normalize();
            Files.deleteIfExists(mainFile);

            if (asset.getThumbnailStorageKey() != null) {
                Path thumbFile = this.rootStorageLocation.resolve(asset.getThumbnailStorageKey()).normalize();
                Files.deleteIfExists(thumbFile);
            }
            log.info("Arquivo de mídia excluído com sucesso: {}", id);
        } catch (IOException e) {
            log.warn("Erro ao excluir arquivo físico de mídia do disco: {}", e.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        int lastIndex = filename.lastIndexOf('.');
        if (lastIndex == -1 || lastIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastIndex + 1);
    }

    private String detectMediaType(String extension) {
        if (ALLOWED_IMAGE_EXT.contains(extension)) return "IMAGE";
        if (ALLOWED_VIDEO_EXT.contains(extension)) return "VIDEO";
        if (ALLOWED_AUDIO_EXT.contains(extension)) return "AUDIO";
        if (ALLOWED_DOC_EXT.contains(extension)) return "DOCUMENT";
        throw new IllegalArgumentException("Extensão de arquivo não permitida para totens: ." + extension);
    }

    private String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao calcular checksum SHA-256", e);
        }
    }

    private void generateThumbnail(BufferedImage originalImage, Path targetPath, String format) throws IOException {
        int targetWidth = 320;
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();
        int targetHeight = (int) (((double) originalHeight / originalWidth) * targetWidth);

        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(originalImage, 0, 0, targetWidth, targetHeight, Color.WHITE, null);
        g2d.dispose();

        String saveFormat = "png".equalsIgnoreCase(format) ? "png" : "jpg";
        ImageIO.write(resized, saveFormat, targetPath.toFile());
    }
}
