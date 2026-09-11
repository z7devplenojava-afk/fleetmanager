package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ContractDocumentDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.ContractDocument;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.ContractDocumentRepository;
import com.z7design.fleet_manager.repository.ContractRepository;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractDocumentService {

    private final ContractDocumentRepository repository;
    private final ContractRepository contractRepository;

    private static final String BASE_STORAGE_PATH = "uploads/contract-documents/";

    @Transactional(readOnly = true)
    public List<ContractDocumentDTO> listByContract(UUID contractId) {
        return repository.findByContractIdOrderByCreatedAtDesc(contractId).stream()
                .map(ContractDocumentDTO::fromEntity)
                .toList();
    }

    @Transactional
    public ContractDocumentDTO upload(UUID contractId, MultipartFile file, User currentUser) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado com ID: " + contractId));
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo do contrato é obrigatório");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isEmpty()) {
            throw new RuntimeException("Nome de arquivo inválido");
        }

        try {
            String extension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalName.substring(dotIndex);
            }
            String storedName = UUID.randomUUID().toString() + extension;

            Path physicalDir = Paths.get(BASE_STORAGE_PATH, contractId.toString());
            Files.createDirectories(physicalDir);
            Path targetPath = physicalDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            ContractDocument doc = ContractDocument.builder()
                    .contract(contract)
                    .originalName(originalName)
                    .storedPath(targetPath.toString())
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .uploadedBy(currentUser.getId())
                    .build();

            ContractDocument saved = repository.save(doc);
            log.info("Documento do contrato enviado: id={}, contrato={}, nome={}",
                    saved.getId(), contract.getContractNumber(), originalName);
            return ContractDocumentDTO.fromEntity(saved);
        } catch (IOException e) {
            log.error("Erro ao salvar documento do contrato: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar documento: " + e.getMessage());
        }
    }

    public Resource download(UUID id) {
        ContractDocument doc = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        try {
            Path filePath = Paths.get(doc.getStoredPath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Arquivo não encontrado no sistema de arquivos");
        } catch (Exception e) {
            log.error("Erro ao baixar documento do contrato {}: {}", id, e.getMessage());
            throw new RuntimeException("Erro ao baixar documento: " + e.getMessage());
        }
    }

    @Transactional
    public void delete(UUID id) {
        ContractDocument doc = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        try {
            Files.deleteIfExists(Paths.get(doc.getStoredPath()));
        } catch (IOException e) {
            log.warn("Erro ao excluir arquivo físico do documento {}: {}", id, e.getMessage());
        }
        repository.delete(doc);
        log.info("Documento do contrato excluído: id={}", id);
    }
}
