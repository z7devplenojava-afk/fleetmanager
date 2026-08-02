package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleDocumentDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.VehicleDocument;
import com.z7design.fleet_manager.repository.VehicleDocumentRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
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
public class VehicleDocumentService {

    private final VehicleDocumentRepository repository;
    private final VehicleRepository vehicleRepository;

    private static final String BASE_STORAGE_PATH = "uploads/vehicle-documents/";

    // ==================== LEITURA ====================

    @Transactional(readOnly = true)
    public List<VehicleDocumentDTO> listByVehicle(UUID vehicleId, UUID companyId) {
        return repository.findByVehicleIdOrderByCreatedAtDesc(vehicleId).stream()
                .filter(d -> companyId == null || companyId.equals(d.getCompanyId()))
                .map(VehicleDocumentDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleDocumentDTO> listAll(UUID companyId) {
        return repository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .map(VehicleDocumentDTO::fromEntity)
                .toList();
    }

    public VehicleDocumentDTO getById(UUID id, UUID companyId) {
        return VehicleDocumentDTO.fromEntity(findScoped(id, companyId));
    }

    // ==================== ESCRITA ====================

    @Transactional
    public VehicleDocumentDTO upload(UUID vehicleId, VehicleDocument.DocumentType docType,
                                     String title, String documentNumber,
                                     String issueDate, String expiryDate,
                                     MultipartFile file, User currentUser) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + vehicleId));

        UUID userCompanyId = currentUser.getCompanyId();
        if (userCompanyId != null && vehicle.getCompanyId() != null
                && !userCompanyId.equals(vehicle.getCompanyId())) {
            throw new ResourceNotFoundException("Veículo não encontrado com ID: " + vehicleId);
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo do documento é obrigatório");
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

            Path physicalDir = Paths.get(BASE_STORAGE_PATH, vehicleId.toString());
            Files.createDirectories(physicalDir);
            Path targetPath = physicalDir.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            VehicleDocument doc = VehicleDocument.builder()
                    .vehicle(vehicle)
                    .docType(docType != null ? docType : VehicleDocument.DocumentType.OUTRO)
                    .title(title)
                    .documentNumber(documentNumber)
                    .issueDate(parseDate(issueDate))
                    .expiryDate(parseDate(expiryDate))
                    .storedPath(targetPath.toString())
                    .originalName(originalName)
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .uploadedBy(currentUser.getId())
                    .companyId(userCompanyId != null ? userCompanyId : vehicle.getCompanyId())
                    .build();

            VehicleDocument saved = repository.save(doc);
            log.info("Documento do veículo enviado: id={}, veículo={}, tipo={}",
                    saved.getId(), vehicle.getPlate(), saved.getDocType());
            return VehicleDocumentDTO.fromEntity(saved);
        } catch (IOException e) {
            log.error("Erro ao salvar documento do veículo: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar documento: " + e.getMessage());
        }
    }

    public Resource download(UUID id, UUID companyId) {
        VehicleDocument doc = findScoped(id, companyId);
        try {
            Path filePath = Paths.get(doc.getStoredPath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Arquivo não encontrado no sistema de arquivos");
        } catch (Exception e) {
            log.error("Erro ao baixar documento do veículo {}: {}", id, e.getMessage());
            throw new RuntimeException("Erro ao baixar documento: " + e.getMessage());
        }
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        VehicleDocument doc = findScoped(id, companyId);
        try {
            Files.deleteIfExists(Paths.get(doc.getStoredPath()));
        } catch (IOException e) {
            log.warn("Erro ao excluir arquivo físico do documento {}: {}", id, e.getMessage());
        }
        repository.delete(doc);
        log.info("Documento do veículo excluído: id={}", id);
    }

    // ==================== HELPERS ====================

    private VehicleDocument findScoped(UUID id, UUID companyId) {
        VehicleDocument doc = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado com ID: " + id));
        if (doc.getCompanyId() != null && companyId != null && !companyId.equals(doc.getCompanyId())) {
            throw new ResourceNotFoundException("Documento não encontrado com ID: " + id);
        }
        return doc;
    }

    private java.time.LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return java.time.LocalDate.parse(value);
        } catch (Exception e) {
            return null;
        }
    }
}
