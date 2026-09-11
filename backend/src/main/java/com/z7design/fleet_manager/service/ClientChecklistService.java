package com.z7design.fleet_manager.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.z7design.fleet_manager.dto.ClientChecklistRecordDTO;
import com.z7design.fleet_manager.dto.ClientChecklistTemplateDTO;
import com.z7design.fleet_manager.dto.ClientChecklistTemplateItemDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientChecklistService {

    private final ClientChecklistTemplateRepository templateRepository;
    private final ClientChecklistTemplateItemRepository itemRepository;
    private final ClientChecklistRecordRepository recordRepository;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final ObjectMapper objectMapper;

    private static final String ODOMETER_UPLOAD_DIR = "uploads/client-checklists/odometer-photos/";
    private static final String VEHICLE_PHOTOS_DIR = "uploads/vehicles/";

    // --- Templates ---

    public List<ClientChecklistTemplateDTO> findTemplatesByClientId(UUID clientId) {
        return templateRepository.findByClientIdOrderByOrderIndexAscNameAsc(clientId).stream()
                .map(this::templateToDTO)
                .toList();
    }

    public ClientChecklistTemplateDTO findTemplateById(UUID id) {
        ClientChecklistTemplate entity = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo de checklist não encontrado: " + id));
        return templateToDTO(entity);
    }

    @Transactional
    public ClientChecklistTemplateDTO createTemplate(ClientChecklistTemplateDTO dto) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado: " + dto.getClientId()));

        ClientChecklistTemplate template = ClientChecklistTemplate.builder()
                .client(client)
                .name(dto.getName())
                .revision(dto.getRevision())
                .orderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0)
                .build();

        template = templateRepository.save(template);

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            int idx = 0;
            for (ClientChecklistTemplateItemDTO itemDto : dto.getItems()) {
                ClientChecklistTemplateItem item = ClientChecklistTemplateItem.builder()
                        .template(template)
                        .title(itemDto.getTitle())
                        .orderIndex(itemDto.getOrderIndex() != null ? itemDto.getOrderIndex() : idx)
                        .required(Boolean.TRUE.equals(itemDto.getRequired()))
                        .build();
                itemRepository.save(item);
                idx++;
            }
        }

        return templateToDTO(templateRepository.findById(template.getId()).orElse(template));
    }

    @Transactional
    public ClientChecklistTemplateDTO updateTemplate(UUID id, ClientChecklistTemplateDTO dto) {
        ClientChecklistTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo de checklist não encontrado: " + id));

        if (dto.getName() != null) template.setName(dto.getName());
        if (dto.getRevision() != null) template.setRevision(dto.getRevision());
        if (dto.getOrderIndex() != null) template.setOrderIndex(dto.getOrderIndex());

        if (dto.getItems() != null) {
            itemRepository.findByTemplateIdOrderByOrderIndexAsc(id).forEach(itemRepository::delete);
            int idx = 0;
            for (ClientChecklistTemplateItemDTO itemDto : dto.getItems()) {
                ClientChecklistTemplateItem item = ClientChecklistTemplateItem.builder()
                        .template(template)
                        .title(itemDto.getTitle())
                        .orderIndex(itemDto.getOrderIndex() != null ? itemDto.getOrderIndex() : idx)
                        .required(Boolean.TRUE.equals(itemDto.getRequired()))
                        .build();
                itemRepository.save(item);
                idx++;
            }
        }

        template = templateRepository.save(template);
        return templateToDTO(templateRepository.findById(template.getId()).orElse(template));
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        if (!templateRepository.existsById(id)) {
            throw new ResourceNotFoundException("Modelo de checklist não encontrado: " + id);
        }
        templateRepository.deleteById(id);
    }

    private ClientChecklistTemplateDTO templateToDTO(ClientChecklistTemplate entity) {
        ClientChecklistTemplateDTO dto = new ClientChecklistTemplateDTO();
        dto.setId(entity.getId());
        dto.setClientId(entity.getClient().getId());
        dto.setClientName(entity.getClient().getName());
        dto.setName(entity.getName());
        dto.setRevision(entity.getRevision());
        dto.setOrderIndex(entity.getOrderIndex());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        List<ClientChecklistTemplateItem> items = itemRepository.findByTemplateIdOrderByOrderIndexAsc(entity.getId());
        dto.setItems(items.stream()
                .map(i -> new ClientChecklistTemplateItemDTO(i.getId(), i.getTitle(), i.getOrderIndex(), i.getRequired()))
                .toList());
        return dto;
    }

    // --- Records ---

    @Transactional(readOnly = true)
    public List<ClientChecklistRecordDTO> findRecordsByFilters(UUID clientId, UUID templateId,
                                                               LocalDate dateFrom, LocalDate dateTo) {
        LocalDateTime dateFromDt = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime dateToDt = dateTo != null ? dateTo.atTime(LocalTime.MAX) : null;
        return recordRepository.findByFilters(clientId, templateId, dateFromDt, dateToDt).stream()
                .sorted((a, b) -> {
                    if (a.getOccurredAt() == null && b.getOccurredAt() == null) return 0;
                    if (a.getOccurredAt() == null) return 1;
                    if (b.getOccurredAt() == null) return -1;
                    return b.getOccurredAt().compareTo(a.getOccurredAt());
                })
                .map(this::recordToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientChecklistRecordDTO findRecordById(UUID id) {
        ClientChecklistRecord entity = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de checklist não encontrado: " + id));
        return recordToDTO(entity);
    }

    @Transactional
    public ClientChecklistRecordDTO createRecord(ClientChecklistRecordDTO dto) {
        ClientChecklistTemplate template = templateRepository.findById(dto.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("Modelo não encontrado: " + dto.getTemplateId()));
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado: " + dto.getClientId()));

        Vehicle vehicle = null;
        if (dto.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(dto.getVehicleId()).orElse(null);
        }
        Driver driver = null;
        if (dto.getDriverId() != null) {
            driver = driverRepository.findById(dto.getDriverId()).orElse(null);
        }

        String responsesJson = null;
        if (dto.getResponses() != null && !dto.getResponses().isEmpty()) {
            try {
                responsesJson = objectMapper.writeValueAsString(dto.getResponses());
            } catch (Exception e) {
                log.warn("Erro ao serializar responses: {}", e.getMessage());
            }
        }

        ClientChecklistRecord entity = ClientChecklistRecord.builder()
                .template(template)
                .client(client)
                .vehicle(vehicle)
                .driver(driver)
                .occurredAt(dto.getOccurredAt() != null ? dto.getOccurredAt() : LocalDateTime.now())
                .kmReading(dto.getKmReading())
                .responses(responsesJson)
                .observations(dto.getObservations())
                .equipmentReleased(dto.getEquipmentReleased())
                .odometerPhotoUrl(dto.getOdometerPhotoUrl())
                .odometerPhotoDescription(dto.getOdometerPhotoDescription())
                .vehiclePhotos(dto.getVehiclePhotos())
                .inspectorName(dto.getInspectorName())
                .inspectorSignature(dto.getInspectorSignature())
                .driverSignature(dto.getDriverSignature())
                .companyId(dto.getCompanyId())
                .build();

        entity = recordRepository.save(entity);
        return recordToDTO(entity);
    }

    @Transactional
    public ClientChecklistRecordDTO updateRecord(UUID id, ClientChecklistRecordDTO dto) {
        ClientChecklistRecord entity = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de checklist não encontrado: " + id));

        if (dto.getVehicleId() != null) {
            entity.setVehicle(vehicleRepository.findById(dto.getVehicleId()).orElse(null));
        }
        if (dto.getDriverId() != null) {
            entity.setDriver(driverRepository.findById(dto.getDriverId()).orElse(null));
        }
        if (dto.getOccurredAt() != null) entity.setOccurredAt(dto.getOccurredAt());
        if (dto.getKmReading() != null) entity.setKmReading(dto.getKmReading());
        if (dto.getObservations() != null) entity.setObservations(dto.getObservations());
        if (dto.getEquipmentReleased() != null) entity.setEquipmentReleased(dto.getEquipmentReleased());
        if (dto.getInspectorName() != null) entity.setInspectorName(dto.getInspectorName());
        if (dto.getInspectorSignature() != null) entity.setInspectorSignature(dto.getInspectorSignature());
        if (dto.getDriverSignature() != null) entity.setDriverSignature(dto.getDriverSignature());

        if (dto.getResponses() != null) {
            try {
                entity.setResponses(objectMapper.writeValueAsString(dto.getResponses()));
            } catch (Exception e) {
                log.warn("Erro ao serializar responses: {}", e.getMessage());
            }
        }

        entity = recordRepository.save(entity);
        return recordToDTO(entity);
    }

    @Transactional
    public void deleteRecord(UUID id) {
        if (!recordRepository.existsById(id)) {
            throw new ResourceNotFoundException("Registro de checklist não encontrado: " + id);
        }
        recordRepository.deleteById(id);
    }

    @Transactional
    public ClientChecklistRecordDTO uploadOdometerPhoto(UUID id, MultipartFile file, String description) {
        ClientChecklistRecord entity = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro não encontrado: " + id));
        try {
            Path uploadPath = Paths.get(ODOMETER_UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = file.getOriginalFilename();
            String fileExtension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = UUID.randomUUID().toString() + "_" + id + fileExtension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            String photoUrl = "/uploads/client-checklists/odometer-photos/" + filename;
            entity.setOdometerPhotoUrl(photoUrl);
            entity.setOdometerPhotoDescription(description);
            entity = recordRepository.save(entity);
            log.info("Foto do odômetro salva para checklist cliente: {}", id);
            return recordToDTO(entity);
        } catch (IOException e) {
            log.error("Erro ao salvar foto do odômetro: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar foto do odômetro: " + e.getMessage());
        }
    }

    @Transactional
    public ClientChecklistRecordDTO uploadVehiclePhotos(UUID id, MultipartFile[] files) {
        ClientChecklistRecord entity = recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro não encontrado: " + id));
        if (entity.getVehicle() == null) {
            throw new IllegalArgumentException("Registro sem veículo associado. Associe um veículo antes de enviar fotos.");
        }
        Vehicle vehicle = entity.getVehicle();
        UUID vehicleId = vehicle.getId();

        try {
            Path uploadPath = Paths.get(VEHICLE_PHOTOS_DIR, vehicleId.toString());
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            List<String> newUrls = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                String originalFilename = file.getOriginalFilename();
                String fileExtension = (originalFilename != null && originalFilename.contains("."))
                        ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
                String filename = UUID.randomUUID().toString() + "_" + id + fileExtension;
                Path filePath = uploadPath.resolve(filename);
                Files.copy(file.getInputStream(), filePath);
                String photoUrl = "/uploads/vehicles/" + vehicleId + "/" + filename;
                newUrls.add(photoUrl);
            }

            if (!newUrls.isEmpty()) {
                String existing = entity.getVehiclePhotos();
                String photos = (existing != null && !existing.isBlank())
                        ? existing + "," + String.join(",", newUrls)
                        : String.join(",", newUrls);
                entity.setVehiclePhotos(photos);

                String existingVehiclePhotos = vehicle.getPhotos();
                String vehiclePhotos = (existingVehiclePhotos != null && !existingVehiclePhotos.isBlank())
                        ? existingVehiclePhotos + "," + String.join(",", newUrls)
                        : String.join(",", newUrls);
                vehicle.setPhotos(vehiclePhotos);
                vehicleRepository.save(vehicle);

                entity = recordRepository.save(entity);
                log.info("{} foto(s) do veículo salva(s) para checklist cliente: {}", newUrls.size(), id);
            }
            return recordToDTO(entity);
        } catch (IOException e) {
            log.error("Erro ao salvar fotos do veículo: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar fotos do veículo: " + e.getMessage());
        }
    }

    private ClientChecklistRecordDTO recordToDTO(ClientChecklistRecord entity) {
        ClientChecklistRecordDTO dto = new ClientChecklistRecordDTO();
        dto.setId(entity.getId());
        dto.setTemplateId(entity.getTemplate().getId());
        dto.setTemplateName(entity.getTemplate().getName());
        dto.setClientId(entity.getClient().getId());
        dto.setClientName(entity.getClient().getName());
        if (entity.getVehicle() != null) {
            dto.setVehicleId(entity.getVehicle().getId());
            dto.setVehiclePlate(entity.getVehicle().getPlate());
        }
        if (entity.getDriver() != null) {
            dto.setDriverId(entity.getDriver().getId());
            dto.setDriverName(entity.getDriver().getName());
        }
        dto.setOccurredAt(entity.getOccurredAt());
        dto.setKmReading(entity.getKmReading());
        dto.setObservations(entity.getObservations());
        dto.setEquipmentReleased(entity.getEquipmentReleased());
        dto.setOdometerPhotoUrl(entity.getOdometerPhotoUrl());
        dto.setOdometerPhotoDescription(entity.getOdometerPhotoDescription());
        dto.setVehiclePhotos(entity.getVehiclePhotos());
        dto.setInspectorName(entity.getInspectorName());
        dto.setInspectorSignature(entity.getInspectorSignature());
        dto.setDriverSignature(entity.getDriverSignature());
        dto.setCompanyId(entity.getCompanyId());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getResponses() != null && !entity.getResponses().isBlank()) {
            try {
                Map<String, String> responses = objectMapper.readValue(entity.getResponses(),
                        new TypeReference<HashMap<String, String>>() {});
                dto.setResponses(responses);
            } catch (Exception e) {
                log.warn("Erro ao deserializar responses: {}", e.getMessage());
                dto.setResponses(new HashMap<>());
            }
        } else {
            dto.setResponses(new HashMap<>());
        }

        return dto;
    }
}
