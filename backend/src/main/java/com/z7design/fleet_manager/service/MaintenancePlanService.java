package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.MaintenancePlanDTO;
import com.z7design.fleet_manager.model.MaintenancePlan;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.MaintenancePlanRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenancePlanService {

    private final MaintenancePlanRepository repository;
    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public List<MaintenancePlanDTO> getAll() {
        return repository.findAll().stream()
                .map(MaintenancePlanDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanDTO> getByVehicle(UUID vehicleId) {
        return repository.findByVehicleId(vehicleId).stream()
                .map(MaintenancePlanDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public MaintenancePlanDTO createOrUpdate(MaintenancePlanDTO dto) {
        MaintenancePlan entity;
        if (dto.getId() != null) {
            entity = repository.findById(dto.getId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("MaintenancePlan not found with id: " + dto.getId()));
        } else {
            entity = new MaintenancePlan();
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));
            entity.setVehicle(vehicle);
        }

        entity.setTaskName(dto.getTaskName());
        entity.setIntervalKm(dto.getIntervalKm());
        entity.setIntervalDays(dto.getIntervalDays());
        entity.setLastExecutionKm(dto.getLastExecutionKm());
        entity.setLastExecutionDate(dto.getLastExecutionDate());
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        calculateNextDue(entity);

        return MaintenancePlanDTO.fromEntity(repository.save(entity));
    }

    private void calculateNextDue(MaintenancePlan plan) {
        if (plan.getLastExecutionKm() != null && plan.getIntervalKm() != null) {
            plan.setNextDueKm(plan.getLastExecutionKm() + plan.getIntervalKm());
        }

        if (plan.getLastExecutionDate() != null && plan.getIntervalDays() != null) {
            plan.setNextDueDate(plan.getLastExecutionDate().plusDays(plan.getIntervalDays()));
        }
    }

    @Transactional
    public void markAsExecuted(UUID planId, Integer executionKm, LocalDate executionDate) {
        MaintenancePlan plan = repository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("MaintenancePlan not found with id: " + planId));

        plan.setLastExecutionKm(executionKm);
        plan.setLastExecutionDate(executionDate);
        calculateNextDue(plan);
        repository.save(plan);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
