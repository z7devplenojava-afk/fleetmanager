package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ArlaRecordDTO;
import com.z7design.fleet_manager.model.ArlaRecord;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.ArlaRecordRepository;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArlaRecordService {

    private final ArlaRecordRepository repository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    @Transactional(readOnly = true)
    public List<ArlaRecordDTO> getAll() {
        return repository.findAll().stream()
                .map(ArlaRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ArlaRecordDTO> getByVehicle(UUID vehicleId) {
        return repository.findByVehicleId(vehicleId).stream()
                .map(ArlaRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ArlaRecordDTO create(ArlaRecordDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));

        Driver driver = null;
        if (dto.getDriverId() != null) {
            driver = driverRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + dto.getDriverId()));
        }

        ArlaRecord entity = ArlaRecord.builder()
                .vehicle(vehicle)
                .driver(driver)
                .date(dto.getDate())
                .quantity(dto.getQuantity())
                .cost(dto.getCost())
                .mileage(dto.getMileage())
                .station(dto.getStation())
                .notes(dto.getNotes())
                .build();

        return ArlaRecordDTO.fromEntity(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
