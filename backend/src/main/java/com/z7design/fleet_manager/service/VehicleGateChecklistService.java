package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.FleetWorkOrderDTO;
import com.z7design.fleet_manager.dto.VehicleGateChecklistDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.VehicleGateChecklist;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.VehicleGateChecklistRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleGateChecklistService {

    private final VehicleGateChecklistRepository repository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final FleetWorkOrderService fleetWorkOrderService;

    private static final String UPLOAD_DIR = "uploads/vehicle-gate-checklists/odometer-photos/";
    private static final String VEHICLE_PHOTOS_DIR = "uploads/vehicles/";

    @Transactional(readOnly = true)
    public List<VehicleGateChecklistDTO> findAll() {
        return repository.findAllWithAssociations().stream()
                .sorted((a, b) -> {
                    if (a.getOccurredAt() == null && b.getOccurredAt() == null) return 0;
                    if (a.getOccurredAt() == null) return 1;
                    if (b.getOccurredAt() == null) return -1;
                    return b.getOccurredAt().compareTo(a.getOccurredAt());
                })
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleGateChecklistDTO> findByFilters(UUID vehicleId, UUID driverId, VehicleGateChecklist.ChecklistType type,
                                                       LocalDate dateFrom, LocalDate dateTo) {
        LocalDateTime dateFromDt = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime dateToDt = dateTo != null ? dateTo.atTime(LocalTime.MAX) : null;
        
        List<VehicleGateChecklist> results;
        try {
            results = repository.findByFilters(vehicleId, driverId, type, dateFromDt, dateToDt);
        } catch (Exception e) {
            log.warn("Falha na consulta filtrada de checklists no banco ({}), aplicando fallback com filtragem em memória.", e.getMessage());
            results = repository.findAllWithAssociations().stream()
                    .filter(vgc -> vehicleId == null || (vgc.getVehicle() != null && vehicleId.equals(vgc.getVehicle().getId())))
                    .filter(vgc -> driverId == null || (vgc.getDriver() != null && driverId.equals(vgc.getDriver().getId())))
                    .filter(vgc -> type == null || type.equals(vgc.getType()))
                    .filter(vgc -> dateFromDt == null || (vgc.getOccurredAt() != null && !vgc.getOccurredAt().isBefore(dateFromDt)))
                    .filter(vgc -> dateToDt == null || (vgc.getOccurredAt() != null && !vgc.getOccurredAt().isAfter(dateToDt)))
                    .toList();
        }

        return results.stream()
                .sorted((a, b) -> {
                    if (a.getOccurredAt() == null && b.getOccurredAt() == null) return 0;
                    if (a.getOccurredAt() == null) return 1;
                    if (b.getOccurredAt() == null) return -1;
                    return b.getOccurredAt().compareTo(a.getOccurredAt());
                })
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleGateChecklistDTO findById(UUID id) {
        VehicleGateChecklist entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist de portaria não encontrado com ID: " + id));
        return toDTO(entity);
    }

    @Transactional
    public VehicleGateChecklistDTO create(VehicleGateChecklistDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + dto.getVehicleId()));

        Driver driver = null;
        if (dto.getDriverId() != null) {
            driver = driverRepository.findById(dto.getDriverId()).orElse(null);
        }

        UUID effectiveCompanyId = dto.getCompanyId();
        if (effectiveCompanyId == null) {
            effectiveCompanyId = com.z7design.fleet_manager.tenant.TenantContext.get();
        }
        if (effectiveCompanyId == null && vehicle.getCompanyId() != null) {
            effectiveCompanyId = vehicle.getCompanyId();
        }

        VehicleGateChecklist entity = VehicleGateChecklist.builder()
                .vehicle(vehicle)
                .driver(driver)
                .type(dto.getType())
                .occurredAt(dto.getOccurredAt() != null ? dto.getOccurredAt() : LocalDateTime.now())
                .kmReading(dto.getKmReading())
                .initialKm(dto.getInitialKm())
                .finalKm(dto.getFinalKm())
                .distanceTravelled(dto.getDistanceTravelled())
                .hasDisplacement(dto.getHasDisplacement())
                .displacementType(dto.getDisplacementType())
                .displacementInitialKm(dto.getDisplacementInitialKm())
                .displacementFinalKm(dto.getDisplacementFinalKm())
                .displacementDistance(dto.getDisplacementDistance())
                .totalKmTravelled(dto.getTotalKmTravelled())
                .odometerPhotoUrl(dto.getOdometerPhotoUrl())
                .odometerPhotoDescription(dto.getOdometerPhotoDescription())
                .checklistData(dto.getChecklistData())
                .driverProblemReport(dto.getDriverProblemReport())
                .observations(dto.getObservations())
                .vehiclePhotos(dto.getVehiclePhotos())
                .companyId(effectiveCompanyId)
                .build();

        entity = repository.save(entity);

        if (dto.getKmReading() != null && (dto.getType() == VehicleGateChecklist.ChecklistType.ARRIVAL
                || vehicle.getCurrentMileage() == null
                || dto.getKmReading() >= vehicle.getCurrentMileage())) {
            vehicle.setCurrentMileage(dto.getKmReading());
            vehicleRepository.save(vehicle);
            log.info("KM do veículo {} atualizado para {}", vehicle.getPlate(), dto.getKmReading());
        }

        // Gerar automaticamente Ordem de Serviço Corretiva se o motorista reportou avaria, pneu cortado, nível baixo ou reparo
        if (dto.getDriverProblemReport() != null && !dto.getDriverProblemReport().isBlank()) {
            try {
                FleetWorkOrderDTO woDto = new FleetWorkOrderDTO();
                woDto.setVehicleId(vehicle.getId());
                woDto.setMaintenanceType(FleetWorkOrder.MaintenanceType.CORRETIVA);
                boolean isUrgent = dto.getDriverProblemReport().toUpperCase().contains("URGÊNCIA")
                        || dto.getDriverProblemReport().toUpperCase().contains("URGENCIA")
                        || dto.getDriverProblemReport().toUpperCase().contains("PNEU")
                        || dto.getDriverProblemReport().toUpperCase().contains("NÍVEL BAIXO");
                woDto.setPriority(isUrgent ? FleetWorkOrder.WorkOrderPriority.HIGH : FleetWorkOrder.WorkOrderPriority.MEDIUM);
                woDto.setStatus(FleetWorkOrder.WorkOrderStatus.PENDING_APPROVAL);
                woDto.setOdometerIn(dto.getKmReading());
                woDto.setStopDate(LocalDate.now());
                woDto.setStopTime(LocalTime.now().toString().substring(0, 5));
                String driverLabel = driver != null ? driver.getName() : (dto.getDriverName() != null ? dto.getDriverName() : "Motorista");
                woDto.setAnomaliesDescription("[Checklist Diário - " + driverLabel + "] " + dto.getDriverProblemReport());
                woDto.setOtherDescription(dto.getObservations());
                woDto.setStopReason("Checklist Diário - Avaria Informada");
                fleetWorkOrderService.create(woDto);
                log.info("OS Corretiva automática criada a partir do Checklist Diário para o veículo {}", vehicle.getPlate());
            } catch (Exception e) {
                log.warn("Não foi possível gerar OS automática a partir do checklist: {}", e.getMessage());
            }
        }

        return toDTO(entity);
    }

    @Transactional
    public VehicleGateChecklistDTO update(UUID id, VehicleGateChecklistDTO dto) {
        VehicleGateChecklist entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist de portaria não encontrado com ID: " + id));

        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + dto.getVehicleId()));
            entity.setVehicle(vehicle);
        }
        if (dto.getDriverId() != null) {
            entity.setDriver(driverRepository.findById(dto.getDriverId()).orElse(null));
        } else {
            entity.setDriver(null);
        }
        if (dto.getType() != null) entity.setType(dto.getType());
        if (dto.getOccurredAt() != null) entity.setOccurredAt(dto.getOccurredAt());
        if (dto.getKmReading() != null) entity.setKmReading(dto.getKmReading());
        if (dto.getOdometerPhotoUrl() != null) entity.setOdometerPhotoUrl(dto.getOdometerPhotoUrl());
        if (dto.getOdometerPhotoDescription() != null) entity.setOdometerPhotoDescription(dto.getOdometerPhotoDescription());
        if (dto.getChecklistData() != null) entity.setChecklistData(dto.getChecklistData());
        if (dto.getDriverProblemReport() != null) entity.setDriverProblemReport(dto.getDriverProblemReport());
        if (dto.getObservations() != null) entity.setObservations(dto.getObservations());
        if (dto.getVehiclePhotos() != null) entity.setVehiclePhotos(dto.getVehiclePhotos());

        entity = repository.save(entity);

        if (dto.getType() == VehicleGateChecklist.ChecklistType.ARRIVAL && dto.getKmReading() != null) {
            entity.getVehicle().setCurrentMileage(dto.getKmReading());
            vehicleRepository.save(entity.getVehicle());
        }

        return toDTO(entity);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Checklist de portaria não encontrado com ID: " + id);
        }
        repository.deleteById(id);
    }

    private VehicleGateChecklistDTO toDTO(VehicleGateChecklist entity) {
        VehicleGateChecklistDTO dto = new VehicleGateChecklistDTO();
        dto.setId(entity.getId());
        dto.setVehicleId(entity.getVehicle().getId());
        dto.setVehiclePlate(entity.getVehicle().getPlate());
        if (entity.getDriver() != null) {
            dto.setDriverId(entity.getDriver().getId());
            dto.setDriverName(entity.getDriver().getName());
        }
        dto.setType(entity.getType());
        dto.setOccurredAt(entity.getOccurredAt());
        dto.setKmReading(entity.getKmReading());
        dto.setInitialKm(entity.getInitialKm());
        dto.setFinalKm(entity.getFinalKm());
        dto.setDistanceTravelled(entity.getDistanceTravelled());
        dto.setHasDisplacement(entity.getHasDisplacement());
        dto.setDisplacementType(entity.getDisplacementType());
        dto.setDisplacementInitialKm(entity.getDisplacementInitialKm());
        dto.setDisplacementFinalKm(entity.getDisplacementFinalKm());
        dto.setDisplacementDistance(entity.getDisplacementDistance());
        dto.setTotalKmTravelled(entity.getTotalKmTravelled());
        dto.setOdometerPhotoUrl(entity.getOdometerPhotoUrl());
        dto.setOdometerPhotoDescription(entity.getOdometerPhotoDescription());
        dto.setChecklistData(entity.getChecklistData());
        dto.setDriverProblemReport(entity.getDriverProblemReport());
        dto.setObservations(entity.getObservations());
        dto.setVehiclePhotos(entity.getVehiclePhotos());
        dto.setCompanyId(entity.getCompanyId());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    @Transactional
    public VehicleGateChecklistDTO uploadOdometerPhoto(UUID id, MultipartFile file, String description) {
        VehicleGateChecklist entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist de portaria não encontrado com ID: " + id));
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String originalFilename = file.getOriginalFilename();
            String fileExtension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
            String filename = UUID.randomUUID().toString() + "_" + id + fileExtension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            String photoUrl = "/uploads/vehicle-gate-checklists/odometer-photos/" + filename;
            entity.setOdometerPhotoUrl(photoUrl);
            entity.setOdometerPhotoDescription(description);
            entity = repository.save(entity);
            log.info("Foto do odômetro salva para checklist: {}", id);
            return toDTO(entity);
        } catch (IOException e) {
            log.error("Erro ao salvar foto do odômetro: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar foto do odômetro: " + e.getMessage());
        }
    }

    @Transactional
    public VehicleGateChecklistDTO uploadVehiclePhotos(UUID id, MultipartFile[] files) {
        VehicleGateChecklist entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist de portaria não encontrado com ID: " + id));
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
                String existingChecklistPhotos = entity.getVehiclePhotos();
                String checklistPhotos = (existingChecklistPhotos != null && !existingChecklistPhotos.isBlank())
                        ? existingChecklistPhotos + "," + String.join(",", newUrls)
                        : String.join(",", newUrls);
                entity.setVehiclePhotos(checklistPhotos);

                String existingVehiclePhotos = vehicle.getPhotos();
                String vehiclePhotos = (existingVehiclePhotos != null && !existingVehiclePhotos.isBlank())
                        ? existingVehiclePhotos + "," + String.join(",", newUrls)
                        : String.join(",", newUrls);
                vehicle.setPhotos(vehiclePhotos);
                vehicleRepository.save(vehicle);

                entity = repository.save(entity);
                log.info("{} foto(s) do veículo salva(s) para checklist: {} e galeria do veículo: {}", newUrls.size(), id, vehicleId);
            }
            return toDTO(entity);
        } catch (IOException e) {
            log.error("Erro ao salvar fotos do veículo: {}", e.getMessage());
            throw new RuntimeException("Erro ao salvar fotos do veículo: " + e.getMessage());
        }
    }
}
