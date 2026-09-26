package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CfmeDocumentDTO;
import com.z7design.fleet_manager.dto.CfmeDocumentUpdateDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.CfmeDocument;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.CfmeDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Serviço do Controle de Certificações Federais, Municipais e Estaduais (CFME).
 * Armazena os arquivos em disco (uploads/cfme-documents) e os metadados no banco,
 * sempre isolados por empresa (companyId).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CfmeDocumentService {

    private final CfmeDocumentRepository repository;

    private static final String BASE_STORAGE_PATH = "uploads/cfme-documents/";
    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024; // 50MB
    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("pdf", "xls", "xlsx", "csv", "doc", "docx");

    // ==================== LEITURA ====================

    @Transactional(readOnly = true)
    public List<CfmeDocumentDTO> list(UUID companyId, CfmeDocument.DocumentCategory category) {
        List<CfmeDocument> documents;
        if (companyId == null) {
            documents = category != null
                    ? repository.findByCategoryOrderByCreatedAtDesc(category)
                    : repository.findAll();
        } else {
            documents = category != null
                    ? repository.findByCompanyIdAndCategoryOrderByCreatedAtDesc(companyId, category)
                    : repository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        }
        return documents.stream().map(CfmeDocumentDTO::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public CfmeDocumentDTO getById(UUID id, UUID companyId) {
        return CfmeDocumentDTO.fromEntity(findScoped(id, companyId));
    }

    // ==================== ESCRITA ====================

    @Transactional
    public CfmeDocumentDTO upload(CfmeDocument.DocumentCategory category,
                                  String title,
                                  String issuer,
                                  String documentNumber,
                                  String issueDate,
                                  String expiryDate,
                                  String notes,
                                  MultipartFile file,
                                  User currentUser) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo do documento é obrigatório");
        }
        if (category == null) {
            throw new IllegalArgumentException("Categoria do documento é obrigatória");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException("Nome de arquivo inválido");
        }

        validateFile(originalName, file.getSize());

        try {
            String extension = extractExtension(originalName);
            String storedName = UUID.randomUUID() + extension;
            UUID companyId = currentUser != null ? currentUser.getCompanyId() : null;
            String scope = companyId != null ? companyId.toString() : "global";

            Path physicalDir = Paths.get(BASE_STORAGE_PATH, scope);
            Files.createDirectories(physicalDir);
            Path targetPath = physicalDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            CfmeDocument doc = CfmeDocument.builder()
                    .category(category)
                    .title(trimToNull(title))
                    .issuer(trimToNull(issuer))
                    .documentNumber(trimToNull(documentNumber))
                    .issueDate(parseDate(issueDate))
                    .expiryDate(parseDate(expiryDate))
                    .storedPath(targetPath.toString())
                    .originalName(originalName)
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .notes(trimToNull(notes))
                    .uploadedBy(currentUser != null ? currentUser.getId() : null)
                    .uploadedByName(currentUser != null ? currentUser.getName() : null)
                    .companyId(companyId)
                    .build();

            CfmeDocument saved = repository.save(doc);
            log.info("Documento CFME cadastrado: id={}, categoria={}, arquivo={}",
                    saved.getId(), saved.getCategory(), saved.getOriginalName());
            return CfmeDocumentDTO.fromEntity(saved);
        } catch (IOException e) {
            log.error("Erro ao salvar documento CFME: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao salvar documento: " + e.getMessage());
        }
    }

    @Transactional
    public CfmeDocumentDTO update(UUID id, CfmeDocumentUpdateDTO dto, UUID companyId) {
        CfmeDocument doc = findScoped(id, companyId);
        if (dto.getCategory() != null) {
            doc.setCategory(dto.getCategory());
        }
        if (dto.getTitle() != null) {
            doc.setTitle(trimToNull(dto.getTitle()));
        }
        if (dto.getIssuer() != null) {
            doc.setIssuer(trimToNull(dto.getIssuer()));
        }
        if (dto.getDocumentNumber() != null) {
            doc.setDocumentNumber(trimToNull(dto.getDocumentNumber()));
        }
        if (dto.getIssueDate() != null) {
            doc.setIssueDate(parseDate(dto.getIssueDate()));
        }
        if (dto.getExpiryDate() != null) {
            doc.setExpiryDate(parseDate(dto.getExpiryDate()));
        }
        if (dto.getNotes() != null) {
            doc.setNotes(trimToNull(dto.getNotes()));
        }
        CfmeDocument saved = repository.save(doc);
        return CfmeDocumentDTO.fromEntity(saved);
    }

    public Resource download(UUID id, UUID companyId) {
        CfmeDocument doc = findScoped(id, companyId);
        try {
            Path filePath = Paths.get(doc.getStoredPath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Arquivo não encontrado no sistema de arquivos");
        } catch (Exception e) {
            log.error("Erro ao baixar documento CFME {}: {}", id, e.getMessage());
            throw new RuntimeException("Erro ao baixar documento: " + e.getMessage());
        }
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        CfmeDocument doc = findScoped(id, companyId);
        try {
            Files.deleteIfExists(Paths.get(doc.getStoredPath()));
        } catch (IOException e) {
            log.warn("Erro ao excluir arquivo físico do documento CFME {}: {}", id, e.getMessage());
        }
        repository.delete(doc);
        log.info("Documento CFME excluído: id={}", id);
    }

    // ==================== HELPERS ====================

    private CfmeDocument findScoped(UUID id, UUID companyId) {
        CfmeDocument doc = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        if (doc.getCompanyId() != null && companyId != null && !companyId.equals(doc.getCompanyId())) {
            throw new ResourceNotFoundException("Documento não encontrado com ID: " + id);
        }
        return doc;
    }

    private void validateFile(String originalName, long size) {
        String extension = extractExtension(originalName).replace(".", "");
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Tipo de arquivo não permitido. Envie PDF, Excel (.xls/.xlsx), CSV ou Word (.doc/.docx).");
        }
        if (size > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Arquivo muito grande. Tamanho máximo permitido: 50MB.");
        }
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0) {
            return filename.substring(dotIndex).toLowerCase(Locale.ROOT);
        }
        return "";
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
