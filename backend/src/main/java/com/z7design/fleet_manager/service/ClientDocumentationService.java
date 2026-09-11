package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
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
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ClientDocumentationService {

    private final ClientDocumentationRepository documentationRepository;
    private final ClientDocStageRepository stageRepository;
    private final ClientDocCategoryRepository categoryRepository;
    private final ClientDocFileRepository fileRepository;
    private final ClientRepository clientRepository;

    private static final String BASE_STORAGE_PATH = "uploads/client-docs";

    // ==================== DOCUMENTATION ====================

    public List<ClientDocumentationDTO> listByClient(UUID clientId) {
        return documentationRepository.findByClientIdOrderByYearDescMonthDesc(clientId)
                .stream()
                .map(doc -> {
                    ClientDocumentationDTO dto = ClientDocumentationDTO.fromEntity(doc);
                    dto.setStageCount(stageRepository.findByDocumentationIdOrderBySortOrderAsc(doc.getId()).size());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /** Lista as documentações de todos os clientes da empresa (área do cliente). */
    public List<ClientDocumentationDTO> listByCompany(UUID companyId) {
        return documentationRepository.findByCompanyIdOrderByYearDescMonthDesc(companyId)
                .stream()
                .map(doc -> {
                    ClientDocumentationDTO dto = ClientDocumentationDTO.fromEntity(doc);
                    dto.setStageCount(stageRepository.findByDocumentationIdOrderBySortOrderAsc(doc.getId()).size());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public ClientDocumentationDTO getDocumentation(UUID id) {
        ClientDocumentation doc = documentationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Documentação não encontrada"));
        ClientDocumentationDTO dto = ClientDocumentationDTO.fromEntity(doc);
        dto.setStageCount(stageRepository.findByDocumentationIdOrderBySortOrderAsc(id).size());
        return dto;
    }

    public ClientDocumentationDTO createDocumentation(CreateClientDocumentationRequest request, UUID companyId) {
        if (documentationRepository.existsByClientIdAndYearAndMonth(request.getClientId(), request.getYear(), request.getMonth())) {
            throw new RuntimeException("Já existe documentação para este cliente no período informado");
        }

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        ClientDocumentation doc = ClientDocumentation.builder()
                .client(client)
                .companyId(companyId)
                .year(request.getYear())
                .month(request.getMonth())
                .build();

        ClientDocumentation saved = documentationRepository.save(doc);
        log.info("Documentação criada: cliente={}, ano={}, mês={}", request.getClientId(), request.getYear(), request.getMonth());
        return ClientDocumentationDTO.fromEntity(saved);
    }

    public void deleteDocumentation(UUID id) {
        ClientDocumentation doc = documentationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Documentação não encontrada"));

        List<ClientDocStage> stages = stageRepository.findByDocumentationIdOrderBySortOrderAsc(id);
        for (ClientDocStage stage : stages) {
            List<ClientDocFile> files = fileRepository.findByStageId(stage.getId());
            for (ClientDocFile file : files) {
                deletePhysicalFile(file.getStoredPath());
            }
        }
        documentationRepository.delete(doc);
        log.info("Documentação excluída: id={}", id);
    }

    // ==================== STAGES ====================

    public List<ClientDocStageDTO> listStages(UUID documentationId) {
        return stageRepository.findByDocumentationIdOrderBySortOrderAsc(documentationId)
                .stream()
                .map(ClientDocStageDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public ClientDocStageDTO createStage(CreateClientDocStageRequest request) {
        ClientDocumentation doc = documentationRepository.findById(request.getDocumentationId())
                .orElseThrow(() -> new RuntimeException("Documentação não encontrada"));

        List<ClientDocStage> existing = stageRepository.findByDocumentationIdOrderBySortOrderAsc(request.getDocumentationId());
        int nextOrder = (request.getSortOrder() != null) ? request.getSortOrder() : existing.size();

        ClientDocStage stage = ClientDocStage.builder()
                .documentation(doc)
                .name(request.getName())
                .sortOrder(nextOrder)
                .build();

        ClientDocStage saved = stageRepository.save(stage);
        log.info("Etapa criada: documentationId={}, name={}", request.getDocumentationId(), request.getName());
        return ClientDocStageDTO.fromEntity(saved);
    }

    public void deleteStage(UUID stageId) {
        List<ClientDocFile> files = fileRepository.findByStageId(stageId);
        for (ClientDocFile file : files) {
            deletePhysicalFile(file.getStoredPath());
        }
        stageRepository.deleteById(stageId);
        log.info("Etapa excluída: id={}", stageId);
    }

    public ClientDocStageDTO renameStage(UUID stageId, String newName) {
        ClientDocStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new RuntimeException("Etapa não encontrada"));
        stage.setName(newName);
        ClientDocStage saved = stageRepository.save(stage);
        return ClientDocStageDTO.fromEntity(saved);
    }

    // ==================== CATEGORIES ====================

    public List<ClientDocCategoryDTO> listCategories(UUID companyId) {
        return categoryRepository.findByCompanyIdOrIsSystemTrueOrderByNameAsc(companyId)
                .stream()
                .map(ClientDocCategoryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public ClientDocCategoryDTO createCategory(CreateClientDocCategoryRequest request, UUID companyId) {
        ClientDocCategory category = ClientDocCategory.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isSystem(false)
                .companyId(companyId)
                .build();

        ClientDocCategory saved = categoryRepository.save(category);
        log.info("Categoria criada: name={}", request.getName());
        return ClientDocCategoryDTO.fromEntity(saved);
    }

    public void deleteCategory(UUID categoryId) {
        categoryRepository.deleteById(categoryId);
        log.info("Categoria excluída: id={}", categoryId);
    }

    // ==================== FILES ====================

    public List<ClientDocFileDTO> listFiles(UUID stageId, UUID categoryId) {
        return fileRepository.findByStageIdAndCategoryId(stageId, categoryId)
                .stream()
                .map(ClientDocFileDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public ClientDocFileDTO uploadFile(UUID stageId, UUID categoryId, MultipartFile file, UUID companyId, UUID userId) {
        ClientDocStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new RuntimeException("Etapa não encontrada"));
        ClientDocCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isEmpty()) {
            throw new RuntimeException("Nome de arquivo inválido");
        }

        String extension = "";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalName.substring(dotIndex);
        }
        String storedName = UUID.randomUUID().toString() + extension;

        UUID docId = stage.getDocumentation().getId();
        Path physicalDir = Paths.get(BASE_STORAGE_PATH, companyId.toString(), docId.toString(), stageId.toString(), categoryId.toString());

        try {
            Files.createDirectories(physicalDir);
            Path targetPath = physicalDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            ClientDocFile docFile = ClientDocFile.builder()
                    .stage(stage)
                    .category(category)
                    .originalName(originalName)
                    .storedPath(targetPath.toString())
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .uploadedBy(userId)
                    .build();

            ClientDocFile saved = fileRepository.save(docFile);
            log.info("Arquivo enviado: stageId={}, categoryId={}, name={}", stageId, categoryId, originalName);
            return ClientDocFileDTO.fromEntity(saved);

        } catch (IOException e) {
            log.error("Erro ao salvar arquivo: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar arquivo: " + e.getMessage());
        }
    }

    public Resource downloadFile(UUID fileId) {
        ClientDocFile docFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        try {
            Path filePath = Paths.get(docFile.getStoredPath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Arquivo não encontrado no sistema de arquivos");
            }
        } catch (Exception e) {
            log.error("Erro ao baixar arquivo: {}", e.getMessage());
            throw new RuntimeException("Erro ao baixar arquivo: " + e.getMessage());
        }
    }

    /** Download com verificação de empresa (área do cliente). */
    public Resource downloadFileForCompany(UUID fileId, UUID companyId) {
        ClientDocFile docFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));
        UUID docCompanyId = docFile.getStage().getDocumentation().getCompanyId();
        if (companyId == null || !companyId.equals(docCompanyId)) {
            throw new RuntimeException("Acesso negado ao arquivo");
        }
        return downloadFile(fileId);
    }

    /** Estrutura completa com verificação de empresa (área do cliente). */
    public Map<String, Object> getFullStructureForCompany(UUID documentationId, UUID companyId) {
        ClientDocumentationDTO doc = getDocumentation(documentationId);
        if (companyId == null || !companyId.equals(doc.getCompanyId())) {
            throw new RuntimeException("Acesso negado à documentação");
        }
        return getFullStructure(documentationId);
    }

    public void deleteFile(UUID fileId) {
        ClientDocFile docFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Arquivo não encontrado"));

        deletePhysicalFile(docFile.getStoredPath());
        fileRepository.delete(docFile);
        log.info("Arquivo excluído: id={}, name={}", fileId, docFile.getOriginalName());
    }

    private void deletePhysicalFile(String storedPath) {
        try {
            Path path = Paths.get(storedPath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Erro ao excluir arquivo físico: {}", e.getMessage());
        }
    }

    // ==================== FULL STRUCTURE ====================

    public Map<String, Object> getFullStructure(UUID documentationId) {
        ClientDocumentationDTO doc = getDocumentation(documentationId);
        List<ClientDocStageDTO> stages = listStages(documentationId);
        List<ClientDocCategoryDTO> categories = listCategories(doc.getCompanyId());

        List<Map<String, Object>> stagesWithFiles = new ArrayList<>();
        for (ClientDocStageDTO stage : stages) {
            Map<String, Object> stageMap = new HashMap<>();
            stageMap.put("id", stage.getId());
            stageMap.put("name", stage.getName());
            stageMap.put("sortOrder", stage.getSortOrder());

            List<Map<String, Object>> categoriesWithFiles = new ArrayList<>();
            for (ClientDocCategoryDTO category : categories) {
                Map<String, Object> catMap = new HashMap<>();
                catMap.put("category", category);
                catMap.put("files", listFiles(stage.getId(), category.getId()));
                categoriesWithFiles.add(catMap);
            }
            stageMap.put("categories", categoriesWithFiles);
            stagesWithFiles.add(stageMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("documentation", doc);
        result.put("stages", stagesWithFiles);
        return result;
    }
}
