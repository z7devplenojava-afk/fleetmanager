package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ParteDiariaDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.ParteDiaria;
import com.z7design.fleet_manager.model.ParteDiariaAtividade;
import com.z7design.fleet_manager.repository.ParteDiariaRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.MeasurementContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ParteDiariaService {

    private final ParteDiariaRepository parteDiariaRepository;
    private final ClientRepository clientRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final MeasurementContractRepository measurementContractRepository;

    public ParteDiariaDTO create(ParteDiariaDTO dto) {
        ParteDiaria pd = new ParteDiaria();
        pd.setNumber(dto.getNumber() != null && !dto.getNumber().isBlank() ? dto.getNumber() : "PD-" + (System.currentTimeMillis() % 100000));
        pd.setDate(dto.getDate() != null ? dto.getDate() : LocalDate.now());
        pd.setObraName(dto.getObraName());
        pd.setServiceName(dto.getServiceName());
        pd.setRouteName(dto.getRouteName());
        pd.setVehiclePlate(dto.getVehiclePlate() != null && !dto.getVehiclePlate().isBlank() ? dto.getVehiclePlate() : "QMR-2F82");
        pd.setVehicleModel(dto.getVehicleModel());
        pd.setDriverName(dto.getDriverName() != null ? dto.getDriverName() : "Motorista Operacional");
        pd.setStartTime(dto.getStartTime());
        pd.setEndTime(dto.getEndTime());
        pd.setStartKm(dto.getStartKm());
        pd.setEndKm(dto.getEndKm());
        pd.setDisregardedKm(dto.getDisregardedKm());
        pd.setDisregardReason(dto.getDisregardReason());
        pd.setStatus(dto.getStatus() != null ? dto.getStatus() : "LANÇADA");
        pd.setNotes(dto.getNotes());
        pd.setCreatedBy(dto.getCreatedBy() != null ? dto.getCreatedBy() : "Operacional");

        if (dto.getClientId() != null) {
            clientRepository.findById(dto.getClientId()).ifPresent(pd::setClient);
        }
        if (dto.getVehicleId() != null) {
            vehicleRepository.findById(dto.getVehicleId()).ifPresent(pd::setVehicle);
        }
        if (dto.getDriverId() != null) {
            driverRepository.findById(dto.getDriverId()).ifPresent(pd::setDriver);
        }
        if (dto.getContractId() != null) {
            measurementContractRepository.findById(dto.getContractId()).ifPresent(pd::setContract);
        }

        pd.calculateKms();

        if (dto.getAtividades() != null) {
            for (ParteDiariaDTO.ParteDiariaAtividadeDTO atDto : dto.getAtividades()) {
                ParteDiariaAtividade at = new ParteDiariaAtividade();
                at.setParteDiaria(pd);
                at.setStartTime(atDto.getStartTime());
                at.setEndTime(atDto.getEndTime());
                at.setDescription(atDto.getDescription() != null ? atDto.getDescription() : "Atendimento Operacional");
                at.setActivityType(atDto.getActivityType());
                at.setNotes(atDto.getNotes());
                pd.getAtividades().add(at);
            }
        }

        ParteDiaria saved = parteDiariaRepository.save(pd);
        return toDTO(saved);
    }

    public List<ParteDiariaDTO> findByPeriod(LocalDate start, LocalDate end) {
        return parteDiariaRepository.findByDateBetween(start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ParteDiariaDTO> findAll() {
        return parteDiariaRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ParteDiariaDTO getById(UUID id) {
        ParteDiaria pd = parteDiariaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parte diária não encontrada: " + id));
        return toDTO(pd);
    }

    private ParteDiariaDTO toDTO(ParteDiaria pd) {
        ParteDiariaDTO dto = new ParteDiariaDTO();
        dto.setId(pd.getId());
        dto.setCompanyId(pd.getCompanyId());
        dto.setNumber(pd.getNumber());
        dto.setDate(pd.getDate());
        dto.setObraName(pd.getObraName());
        dto.setServiceName(pd.getServiceName());
        dto.setRouteName(pd.getRouteName());
        dto.setVehiclePlate(pd.getVehiclePlate());
        dto.setVehicleModel(pd.getVehicleModel());
        dto.setDriverName(pd.getDriverName());
        dto.setStartTime(pd.getStartTime());
        dto.setEndTime(pd.getEndTime());
        dto.setStartKm(pd.getStartKm());
        dto.setEndKm(pd.getEndKm());
        dto.setDrivenKm(pd.getDrivenKm());
        dto.setDisregardedKm(pd.getDisregardedKm());
        dto.setConsideredKm(pd.getConsideredKm());
        dto.setDisregardReason(pd.getDisregardReason());
        dto.setStatus(pd.getStatus());
        dto.setNotes(pd.getNotes());
        dto.setCreatedBy(pd.getCreatedBy());

        if (pd.getAtividades() != null) {
            dto.setAtividades(pd.getAtividades().stream().map(at -> {
                ParteDiariaDTO.ParteDiariaAtividadeDTO atDto = new ParteDiariaDTO.ParteDiariaAtividadeDTO();
                atDto.setId(at.getId());
                atDto.setStartTime(at.getStartTime());
                atDto.setEndTime(at.getEndTime());
                atDto.setDescription(at.getDescription());
                atDto.setActivityType(at.getActivityType());
                atDto.setNotes(at.getNotes());
                return atDto;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
}
