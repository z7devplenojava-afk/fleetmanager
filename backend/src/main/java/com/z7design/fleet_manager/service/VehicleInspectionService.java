package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleInspectionDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.VehicleInspection;
import com.z7design.fleet_manager.model.VehicleInspection.InspectionType;
import com.z7design.fleet_manager.model.VehicleInspection.VehicleReleaseStatus;
import com.z7design.fleet_manager.repository.VehicleInspectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleInspectionService {

    private final VehicleInspectionRepository repository;

    @Transactional(readOnly = true)
    public Page<VehicleInspectionDTO> findAll(
            String plate,
            String client,
            String project,
            VehicleReleaseStatus status,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    ) {
        Page<VehicleInspection> page = repository.findWithFilters(
                plate, client, project, status, startDate, endDate, search, pageable
        );
        return page.map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public VehicleInspectionDTO getById(UUID id) {
        VehicleInspection entity = repository.findById(id)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Laudo de inspeção não encontrado com ID: " + id));
        return toDTO(entity);
    }

    @Transactional
    public VehicleInspectionDTO create(VehicleInspectionDTO dto) {
        VehicleInspection entity = toEntity(dto);
        if (entity.getRegistryNumber() == null || entity.getRegistryNumber().trim().isEmpty()) {
            entity.setRegistryNumber(generateNextRegistryNumber());
        }
        if (entity.getInspectionType() == null) {
            entity.setInspectionType(InspectionType.LAUDO);
        }
        if (entity.getReleaseStatus() == null) {
            entity.setReleaseStatus(VehicleReleaseStatus.LIBERADO_SEM_RESTRICAO);
        }
        if (entity.getInspectionDate() == null) {
            entity.setInspectionDate(LocalDate.now());
        }
        VehicleInspection saved = repository.save(entity);
        log.info("Laudo de inspeção criado com sucesso. Registro: {}, Placa: {}", saved.getRegistryNumber(), saved.getVehiclePlate());
        return toDTO(saved);
    }

    @Transactional
    public VehicleInspectionDTO update(UUID id, VehicleInspectionDTO dto) {
        VehicleInspection existing = repository.findById(id)
                .filter(i -> i.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Laudo de inspeção não encontrado com ID: " + id));

        if (dto.getRegistryNumber() != null && !dto.getRegistryNumber().trim().isEmpty()) {
            existing.setRegistryNumber(dto.getRegistryNumber());
        }
        if (dto.getInspectionType() != null) existing.setInspectionType(dto.getInspectionType());
        if (dto.getInspectionDate() != null) existing.setInspectionDate(dto.getInspectionDate());
        if (dto.getVehicleId() != null) existing.setVehicleId(dto.getVehicleId());
        if (dto.getVehiclePlate() != null) existing.setVehiclePlate(dto.getVehiclePlate().toUpperCase().trim());
        if (dto.getClientName() != null) existing.setClientName(dto.getClientName());
        if (dto.getProjectName() != null) existing.setProjectName(dto.getProjectName());
        if (dto.getCurrentMileage() != null) existing.setCurrentMileage(dto.getCurrentMileage());
        if (dto.getHorimeterHours() != null) existing.setHorimeterHours(dto.getHorimeterHours());
        if (dto.getExecutionTeam() != null) existing.setExecutionTeam(dto.getExecutionTeam());
        if (dto.getRequesterName() != null) existing.setRequesterName(dto.getRequesterName());
        if (dto.getDriverName() != null) existing.setDriverName(dto.getDriverName());

        existing.setProblemDescription(dto.getProblemDescription());
        existing.setAnomaliesProblem(dto.getAnomaliesProblem());
        existing.setOccurrenceDescription(dto.getOccurrenceDescription());
        existing.setServicesPerformed(dto.getServicesPerformed());
        existing.setPartsUsed(dto.getPartsUsed());
        existing.setPartsReplaced(dto.getPartsReplaced());
        existing.setTechnicalParameters(dto.getTechnicalParameters());
        existing.setEvidencesUrls(dto.getEvidencesUrls());
        existing.setResultNotes(dto.getResultNotes());

        if (dto.getReleaseStatus() != null) existing.setReleaseStatus(dto.getReleaseStatus());
        existing.setRestrictionDescription(dto.getRestrictionDescription());
        existing.setRestrictionDeadline(dto.getRestrictionDeadline());
        existing.setRestrictionResponsible(dto.getRestrictionResponsible());
        existing.setDefinitiveReleaseCondition(dto.getDefinitiveReleaseCondition());

        if (dto.getManagerName() != null) existing.setManagerName(dto.getManagerName());
        if (dto.getEngineerName() != null) existing.setEngineerName(dto.getEngineerName());
        if (dto.getInspectorName() != null) existing.setInspectorName(dto.getInspectorName());
        if (dto.getSupervisorName() != null) existing.setSupervisorName(dto.getSupervisorName());

        if (dto.getInspectorSignature() != null) existing.setInspectorSignature(dto.getInspectorSignature());
        if (dto.getSupervisorSignature() != null) existing.setSupervisorSignature(dto.getSupervisorSignature());
        if (dto.getReleaseSignature() != null) existing.setReleaseSignature(dto.getReleaseSignature());

        VehicleInspection updated = repository.save(existing);
        log.info("Laudo de inspeção atualizado com sucesso. ID: {}", id);
        return toDTO(updated);
    }

    @Transactional
    public void delete(UUID id) {
        VehicleInspection existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laudo de inspeção não encontrado com ID: " + id));
        existing.setDeletedAt(LocalDateTime.now());
        repository.save(existing);
        log.info("Laudo de inspeção marcado como excluído. ID: {}", id);
    }

    @Transactional(readOnly = true)
    public String generateNextRegistryNumber() {
        List<String> recent = repository.findRecentRegistryNumbers(PageRequest.of(0, 10));
        long highest = 14597L;
        for (String r : recent) {
            if (r != null) {
                String clean = r.replaceAll("[^0-9]", "");
                if (!clean.isEmpty()) {
                    try {
                        long val = Long.parseLong(clean);
                        if (val > highest) highest = val;
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return String.valueOf(highest + 1);
    }

    public VehicleInspectionDTO toDTO(VehicleInspection entity) {
        if (entity == null) return null;
        return VehicleInspectionDTO.builder()
                .id(entity.getId())
                .registryNumber(entity.getRegistryNumber())
                .inspectionType(entity.getInspectionType())
                .inspectionDate(entity.getInspectionDate())
                .vehicleId(entity.getVehicleId())
                .vehiclePlate(entity.getVehiclePlate())
                .clientName(entity.getClientName())
                .projectName(entity.getProjectName())
                .currentMileage(entity.getCurrentMileage())
                .horimeterHours(entity.getHorimeterHours())
                .executionTeam(entity.getExecutionTeam())
                .requesterName(entity.getRequesterName())
                .driverName(entity.getDriverName())
                .problemDescription(entity.getProblemDescription())
                .anomaliesProblem(entity.getAnomaliesProblem())
                .occurrenceDescription(entity.getOccurrenceDescription())
                .servicesPerformed(entity.getServicesPerformed())
                .partsUsed(entity.getPartsUsed())
                .partsReplaced(entity.getPartsReplaced())
                .technicalParameters(entity.getTechnicalParameters())
                .evidencesUrls(entity.getEvidencesUrls())
                .resultNotes(entity.getResultNotes())
                .releaseStatus(entity.getReleaseStatus())
                .restrictionDescription(entity.getRestrictionDescription())
                .restrictionDeadline(entity.getRestrictionDeadline())
                .restrictionResponsible(entity.getRestrictionResponsible())
                .definitiveReleaseCondition(entity.getDefinitiveReleaseCondition())
                .managerName(entity.getManagerName() != null ? entity.getManagerName() : entity.getSupervisorName())
                .engineerName(entity.getEngineerName() != null ? entity.getEngineerName() : entity.getInspectorName())
                .inspectorName(entity.getInspectorName())
                .supervisorName(entity.getSupervisorName())
                .inspectorSignature(entity.getInspectorSignature())
                .supervisorSignature(entity.getSupervisorSignature())
                .releaseSignature(entity.getReleaseSignature())
                .companyId(entity.getCompanyId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public VehicleInspection toEntity(VehicleInspectionDTO dto) {
        if (dto == null) return null;
        VehicleInspection entity = new VehicleInspection();
        entity.setId(dto.getId());
        entity.setRegistryNumber(dto.getRegistryNumber());
        entity.setInspectionType(dto.getInspectionType() != null ? dto.getInspectionType() : InspectionType.LAUDO);
        entity.setInspectionDate(dto.getInspectionDate() != null ? dto.getInspectionDate() : LocalDate.now());
        entity.setVehicleId(dto.getVehicleId());
        entity.setVehiclePlate(dto.getVehiclePlate() != null ? dto.getVehiclePlate().toUpperCase().trim() : null);
        entity.setClientName(dto.getClientName());
        entity.setProjectName(dto.getProjectName());
        entity.setCurrentMileage(dto.getCurrentMileage());
        entity.setHorimeterHours(dto.getHorimeterHours());
        entity.setExecutionTeam(dto.getExecutionTeam());
        entity.setRequesterName(dto.getRequesterName());
        entity.setDriverName(dto.getDriverName());

        entity.setProblemDescription(dto.getProblemDescription());
        entity.setAnomaliesProblem(dto.getAnomaliesProblem());
        entity.setOccurrenceDescription(dto.getOccurrenceDescription());
        entity.setServicesPerformed(dto.getServicesPerformed());
        entity.setPartsUsed(dto.getPartsUsed());
        entity.setPartsReplaced(dto.getPartsReplaced());
        entity.setTechnicalParameters(dto.getTechnicalParameters());
        entity.setEvidencesUrls(dto.getEvidencesUrls());
        entity.setResultNotes(dto.getResultNotes());

        entity.setReleaseStatus(dto.getReleaseStatus() != null ? dto.getReleaseStatus() : VehicleReleaseStatus.LIBERADO_SEM_RESTRICAO);
        entity.setRestrictionDescription(dto.getRestrictionDescription());
        entity.setRestrictionDeadline(dto.getRestrictionDeadline());
        entity.setRestrictionResponsible(dto.getRestrictionResponsible());
        entity.setDefinitiveReleaseCondition(dto.getDefinitiveReleaseCondition());

        entity.setManagerName(dto.getManagerName());
        entity.setEngineerName(dto.getEngineerName());
        entity.setInspectorName(dto.getEngineerName() != null ? dto.getEngineerName() : dto.getInspectorName());
        entity.setSupervisorName(dto.getManagerName() != null ? dto.getManagerName() : dto.getSupervisorName());

        entity.setInspectorSignature(dto.getInspectorSignature());
        entity.setSupervisorSignature(dto.getSupervisorSignature());
        entity.setReleaseSignature(dto.getReleaseSignature());
        entity.setCompanyId(dto.getCompanyId());
        return entity;
    }
}
