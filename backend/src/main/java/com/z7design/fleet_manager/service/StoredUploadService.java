package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.StoredUpload;
import com.z7design.fleet_manager.repository.StoredUploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoredUploadService {

    private final StoredUploadRepository repository;

    @Transactional
    public void save(String category, String fileName, String contentType, byte[] data) {
        if (category == null || category.isBlank() || fileName == null || fileName.isBlank() || data == null || data.length == 0) {
            return;
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
        } catch (Exception e) {
            log.warn("⚠️ Falha ao persistir upload {}/{} no banco de dados: {}", category, fileName, e.getMessage());
        }
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

