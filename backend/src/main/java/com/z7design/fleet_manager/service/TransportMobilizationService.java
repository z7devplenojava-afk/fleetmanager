package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.TransportMobilizationDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.TransportMobilization;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.TransportMobilizationRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransportMobilizationService {

    private final TransportMobilizationRepository repository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    private static final String UPLOAD_DIR = "uploads/transport-mobilizations/odometer-photos/";
    private static final String VEHICLE_PHOTOS_DIR = "uploads/vehicles/";

    public List<TransportMobilizationDTO> findAll(UUID companyId) {
        return repository.findByFilters(companyId, null, null, null, null).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TransportMobilizationDTO> findByFilters(UUID companyId, UUID vehicleId,
            TransportMobilization.MobilizationType type,
            LocalDate dateFrom, LocalDate dateTo) {
        LocalDateTime dateFromDt = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime dateToDt = dateTo != null ? dateTo.atTime(LocalTime.MAX) : null;
        return repository.findByFilters(companyId, vehicleId, type, dateFromDt, dateToDt).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TransportMobilizationDTO findById(UUID id) {
        TransportMobilization entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mobilização não encontrada com ID: " + id));
        return toDTO(entity);
    }

    @Transactional
    public TransportMobilizationDTO create(TransportMobilizationDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Veículo não encontrado com ID: " + dto.getVehicleId()));

        Driver driver = null;
        if (dto.getDriverId() != null) {
            driver = driverRepository.findById(dto.getDriverId()).orElse(null);
        }

        String jsonData = dto.getJsonData();
        if (jsonData == null && dto.getChecklistData() != null) {
            jsonData = dto.getChecklistData();
        }
        String observations = dto.getObservations();
        if (dto.getDescricaoAvaria() != null && !dto.getDescricaoAvaria().isBlank()) {
            String avaria = "DESCRIÇÃO DA AVARIA: " + dto.getDescricaoAvaria();
            observations = observations != null ? observations + "\n\n" + avaria : avaria;
        }

        TransportMobilization entity = TransportMobilization.builder()
                .vehicle(vehicle)
                .driver(driver)
                .type(dto.getType())
                .occurredAt(dto.getOccurredAt() != null ? dto.getOccurredAt() : LocalDateTime.now())
                .kmReading(dto.getKmReading())
                .odometerPhotoUrl(dto.getOdometerPhotoUrl())
                .jsonData(jsonData)
                .damageData(dto.getDamageData())
                .partsRequestData(dto.getPartsRequestData())
                .observations(observations)
                .photos(dto.getPhotos())
                .companyId(dto.getCompanyId())
                .syncStatus(dto.getSyncStatus() != null ? dto.getSyncStatus() : TransportMobilization.SyncStatus.SYNCED)
                .build();

        entity = repository.save(entity);

        // Atualizar KM do veículo se tiver leitura
        if (dto.getKmReading() != null
                && (vehicle.getCurrentMileage() == null || dto.getKmReading() > vehicle.getCurrentMileage())) {
            vehicle.setCurrentMileage(dto.getKmReading());
            vehicleRepository.save(vehicle);
        }

        return toDTO(entity);
    }

    @Transactional
    public TransportMobilizationDTO update(UUID id, TransportMobilizationDTO dto) {
        TransportMobilization entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mobilização não encontrada com ID: " + id));

        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Veículo não encontrado com ID: " + dto.getVehicleId()));
            entity.setVehicle(vehicle);
        }
        if (dto.getDriverId() != null) {
            entity.setDriver(driverRepository.findById(dto.getDriverId()).orElse(null));
        }

        if (dto.getType() != null)
            entity.setType(dto.getType());
        if (dto.getOccurredAt() != null)
            entity.setOccurredAt(dto.getOccurredAt());
        if (dto.getKmReading() != null)
            entity.setKmReading(dto.getKmReading());
        if (dto.getJsonData() != null)
            entity.setJsonData(dto.getJsonData());
        else if (dto.getChecklistData() != null)
            entity.setJsonData(dto.getChecklistData());
        if (dto.getDamageData() != null)
            entity.setDamageData(dto.getDamageData());
        if (dto.getPartsRequestData() != null)
            entity.setPartsRequestData(dto.getPartsRequestData());
        if (dto.getObservations() != null) {
            String obs = dto.getObservations();
            if (dto.getDescricaoAvaria() != null && !dto.getDescricaoAvaria().isBlank()) {
                obs += "\n\nDESCRIÇÃO DA AVARIA: " + dto.getDescricaoAvaria();
            }
            entity.setObservations(obs);
        }
        if (dto.getSyncStatus() != null)
            entity.setSyncStatus(dto.getSyncStatus());

        return toDTO(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Mobilização não encontrada com ID: " + id);
        }
        repository.deleteById(id);
    }

    private TransportMobilizationDTO toDTO(TransportMobilization entity) {
        return TransportMobilizationDTO.builder()
                .id(entity.getId())
                .vehicleId(entity.getVehicle().getId())
                .vehiclePlate(entity.getVehicle().getPlate())
                .driverId(entity.getDriver() != null ? entity.getDriver().getId() : null)
                .driverName(entity.getDriver() != null ? entity.getDriver().getName() : null)
                .type(entity.getType())
                .occurredAt(entity.getOccurredAt())
                .kmReading(entity.getKmReading())
                .odometerPhotoUrl(entity.getOdometerPhotoUrl())
                .jsonData(entity.getJsonData())
                .checklistData(entity.getJsonData())
                .damageData(entity.getDamageData())
                .partsRequestData(entity.getPartsRequestData())
                .observations(entity.getObservations())
                .photos(entity.getPhotos())
                .companyId(entity.getCompanyId())
                .syncStatus(entity.getSyncStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    @Transactional
    public TransportMobilizationDTO uploadOdometerPhoto(UUID id, MultipartFile file) {
        TransportMobilization entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mobilização não encontrada com ID: " + id));
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = file.getOriginalFilename();
            String fileExtension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String filename = UUID.randomUUID().toString() + "_" + id + fileExtension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            String photoUrl = "/uploads/transport-mobilizations/odometer-photos/" + filename;
            entity.setOdometerPhotoUrl(photoUrl);
            return toDTO(repository.save(entity));
        } catch (IOException e) {
            log.error("Erro ao salvar foto do odômetro: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar foto do odômetro: " + e.getMessage());
        }
    }

    @Transactional
    public TransportMobilizationDTO uploadPhotos(UUID id, MultipartFile[] files) {
        TransportMobilization entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mobilização não encontrada com ID: " + id));
        Vehicle vehicle = entity.getVehicle();

        try {
            Path uploadPath = Paths.get(VEHICLE_PHOTOS_DIR, vehicle.getId().toString());
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            List<String> newUrls = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty())
                    continue;
                String filename = UUID.randomUUID().toString() + "_" + id + ".jpg";
                Path filePath = uploadPath.resolve(filename);
                Files.copy(file.getInputStream(), filePath);
                newUrls.add("/uploads/vehicles/" + vehicle.getId() + "/" + filename);
            }

            if (!newUrls.isEmpty()) {
                String existingPhotos = entity.getPhotos();
                String photos = (existingPhotos != null && !existingPhotos.isBlank())
                        ? existingPhotos + "," + String.join(",", newUrls)
                        : String.join(",", newUrls);
                entity.setPhotos(photos);
                repository.save(entity);
            }
            return toDTO(entity);
        } catch (IOException e) {
            log.error("Erro ao salvar fotos: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar fotos: " + e.getMessage());
        }
    }
}
