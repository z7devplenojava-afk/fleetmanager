package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.StoredUpload;
import com.z7design.fleet_manager.repository.StoredUploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoredUploadService {

    private final StoredUploadRepository repository;

    @Transactional
    public void save(String category, String fileName, String contentType, byte[] data) {
        saveInternal(category, fileName, contentType, data);
    }

    @Transactional
    public boolean saveWithDiskFallback(
            Path primaryDir,
            Path fallbackDir,
            String category,
            String fileName,
            String contentType,
            byte[] data) throws IOException {
        if (fileName == null || fileName.isBlank() || data == null || data.length == 0) {
            throw new IOException("Arquivo vazio ou nome inválido para armazenamento.");
        }

        boolean savedInDb = saveInternal(category, fileName, contentType, data);
        boolean savedOnDisk = tryWriteDisk(primaryDir, fileName, data);
        if (!savedOnDisk && fallbackDir != null && !fallbackDir.equals(primaryDir)) {
            savedOnDisk = tryWriteDisk(fallbackDir, fileName, data);
        }

        if (!savedInDb && !savedOnDisk) {
            throw new IOException("Falha ao armazenar '" + fileName + "' tanto no disco quanto no banco de dados.");
        }
        return savedInDb || savedOnDisk;
    }

    private boolean saveInternal(String category, String fileName, String contentType, byte[] data) {
        if (category == null || category.isBlank() || fileName == null || fileName.isBlank() || data == null || data.length == 0) {
            return false;
        }
        try {
            String cleanCat = category.trim();
            String cleanName = fileName.trim();
            StoredUpload entity = repository.findByCategoryAndFileName(cleanCat, cleanName)
                    .orElseGet(StoredUpload::new);
            entity.setCategory(cleanCat);
            entity.setFileName(cleanName);
            entity.setContentType(contentType);
            entity.setFileSize((long) data.length);
            entity.setData(data);
            repository.save(entity);
            log.info("💾 Upload persistido no banco de dados: {}/{} ({} bytes)", cleanCat, cleanName, data.length);
            return true;
        } catch (Exception e) {
            log.warn("⚠️ Falha ao persistir upload {}/{} no banco de dados: {}", category, fileName, e.getMessage());
            return false;
        }
    }

    private boolean tryWriteDisk(Path dir, String fileName, byte[] data) {
        if (dir == null) {
            return false;
        }
        try {
            Path absDir = dir.toAbsolutePath().normalize();
            Files.createDirectories(absDir);
            Path target = absDir.resolve(fileName).normalize();
            if (!target.startsWith(absDir)) {
                log.warn("⚠️ Caminho inválido fora do diretório autorizado: {}", target);
                return false;
            }
            Files.write(target, data);
            return Files.exists(target);
        } catch (Exception e) {
            log.warn("⚠️ Falha ao gravar '{}' em '{}': {}", fileName, dir, e.getMessage());
            return false;
        }
    }

    @Transactional(readOnly = true)
    public byte[] loadBytes(String category, String fileName, Path... diskCandidates) {
        if (diskCandidates != null) {
            for (Path candidate : diskCandidates) {
                if (candidate != null) {
                    try {
                        if (Files.exists(candidate) && Files.isRegularFile(candidate) && Files.isReadable(candidate)) {
                            return Files.readAllBytes(candidate);
                        }
                    } catch (Exception ignored) {}
                }
            }
        }
        Optional<StoredUpload> stored = find(category, fileName);
        if (stored.isPresent() && stored.get().getData() != null && stored.get().getData().length > 0) {
            return stored.get().getData();
        }
        return null;
    }

    public static String extractFileName(String pathOrUrl) {
        if (pathOrUrl == null || pathOrUrl.isBlank()) {
            return null;
        }
        String clean = pathOrUrl.trim().replace("\\", "/");
        int qIdx = clean.indexOf('?');
        if (qIdx >= 0) clean = clean.substring(0, qIdx);
        int hIdx = clean.indexOf('#');
        if (hIdx >= 0) clean = clean.substring(0, hIdx);
        int slashIdx = clean.lastIndexOf('/');
        return slashIdx >= 0 ? clean.substring(slashIdx + 1) : clean;
    }

    @Transactional(readOnly = true)
    public Optional<StoredUpload> find(String category, String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return Optional.empty();
        }
        try {
            String cleanName = fileName.trim();
            if (category != null && !category.isBlank()) {
                Optional<StoredUpload> exact = repository.findByCategoryAndFileName(category.trim(), cleanName);
                if (exact.isPresent()) {
                    return exact;
                }
            }
            return repository.findFirstByFileName(cleanName);
        } catch (Exception e) {
            log.warn("⚠️ Falha ao buscar upload {}/{} no banco de dados: {}", category, fileName, e.getMessage());
            return Optional.empty();
        }
    }

    @Transactional
    public void delete(String category, String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return;
        }
        try {
            if (category != null && !category.isBlank()) {
                repository.deleteByCategoryAndFileName(category.trim(), fileName.trim());
            }
        } catch (Exception e) {
            log.debug("Aviso ao excluir upload {}/{} do banco: {}", category, fileName, e.getMessage());
        }
    }
}

