package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleBatteryDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.VehicleBattery;
import com.z7design.fleet_manager.repository.VehicleBatteryRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleBatteryService {

    private final VehicleBatteryRepository repository;
    private final VehicleRepository vehicleRepository;

    // ==================== LEITURA ====================

    public List<VehicleBatteryDTO> list(UUID vehicleId, VehicleBattery.BatteryStatus status, UUID companyId) {
        List<VehicleBattery> batteries;
        if (vehicleId != null && status != null) {
            batteries = repository.findByVehicleIdOrderByInstallDateDesc(vehicleId);
            batteries = batteries.stream().filter(b -> b.getStatus() == status).toList();
        } else if (vehicleId != null) {
            batteries = repository.findByVehicleIdOrderByInstallDateDesc(vehicleId);
        } else if (status != null) {
            batteries = repository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            batteries = repository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        }
        return batteries.stream()
                .filter(b -> companyId == null || companyId.equals(b.getCompanyId()))
                .map(VehicleBatteryDTO::fromEntity)
                .toList();
    }

    public VehicleBatteryDTO getById(UUID id, UUID companyId) {
        return VehicleBatteryDTO.fromEntity(findScoped(id, companyId));
    }

    // ==================== ESCRITA ====================

    @Transactional
    public VehicleBatteryDTO create(VehicleBatteryDTO dto, User currentUser) {
        Vehicle vehicle = null;
        if (dto.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + dto.getVehicleId()));
        }

        UUID userCompanyId = currentUser.getCompanyId();
        if (vehicle != null && userCompanyId != null && vehicle.getCompanyId() != null
                && !userCompanyId.equals(vehicle.getCompanyId())) {
            throw new ResourceNotFoundException("Veículo não encontrado com ID: " + dto.getVehicleId());
        }

        VehicleBattery battery = VehicleBattery.builder()
                .vehicle(vehicle)
                .batteryCode(dto.getBatteryCode())
                .serialNumber(dto.getSerialNumber() != null ? dto.getSerialNumber() : dto.getBatteryCode())
                .brand(dto.getBrand())
                .model(dto.getModel())
                .voltage(dto.getVoltage())
                .capacity(dto.getCapacity())
                .ccaRating(dto.getCcaRating())
                .installKm(dto.getInstallKm())
                .installDate(dto.getInstallDate())
                .warrantyExpiryDate(dto.getWarrantyExpiryDate())
                .status(dto.getStatus() != null ? dto.getStatus() : VehicleBattery.BatteryStatus.ACTIVE)
                .cost(dto.getCost())
                .notes(dto.getNotes())
                .companyId(userCompanyId != null ? userCompanyId : (vehicle != null ? vehicle.getCompanyId() : null))
                .build();

        VehicleBattery saved = repository.save(battery);
        log.info("Bateria registrada: id={}, veículo={}, código={}",
                saved.getId(), vehicle != null ? vehicle.getPlate() : "EM ESTOQUE", saved.getBatteryCode());
        return VehicleBatteryDTO.fromEntity(saved);
    }

    @Transactional
    public VehicleBatteryDTO installOnVehicle(UUID batteryId, UUID vehicleId, Integer installKm, LocalDate installDate, UUID companyId) {
        VehicleBattery battery = findScoped(batteryId, companyId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + vehicleId));

        battery.setVehicle(vehicle);
        battery.setInstallKm(installKm);
        battery.setInstallDate(installDate != null ? installDate : LocalDate.now());
        battery.setRemovalDate(null);
        battery.setRemovalReason(null);
        battery.setStatus(VehicleBattery.BatteryStatus.ACTIVE);

        VehicleBattery saved = repository.save(battery);
        log.info("Bateria {} instalada no veículo {}", battery.getBatteryCode(), vehicle.getPlate());
        return VehicleBatteryDTO.fromEntity(saved);
    }

    @Transactional
    public VehicleBatteryDTO removeFromVehicle(UUID batteryId, String removalReason, boolean scrap, UUID companyId) {
        VehicleBattery battery = findScoped(batteryId, companyId);
        battery.setRemovalDate(LocalDate.now());
        battery.setRemovalReason(removalReason != null ? removalReason : "Substituição / Manutenção");
        battery.setStatus(scrap ? VehicleBattery.BatteryStatus.SCRAPPED : VehicleBattery.BatteryStatus.REPLACED);
        battery.setVehicle(null);

        VehicleBattery saved = repository.save(battery);
        log.info("Bateria {} removida do veículo. Novo status: {}", battery.getBatteryCode(), battery.getStatus());
        return VehicleBatteryDTO.fromEntity(saved);
    }

    @Transactional
    public VehicleBatteryDTO update(UUID id, VehicleBatteryDTO dto, UUID companyId) {
        VehicleBattery battery = findScoped(id, companyId);
        battery.setBatteryCode(dto.getBatteryCode());
        if (dto.getSerialNumber() != null) battery.setSerialNumber(dto.getSerialNumber());
        battery.setBrand(dto.getBrand());
        battery.setModel(dto.getModel());
        battery.setVoltage(dto.getVoltage());
        battery.setCapacity(dto.getCapacity());
        if (dto.getCcaRating() != null) battery.setCcaRating(dto.getCcaRating());
        battery.setInstallDate(dto.getInstallDate());
        battery.setWarrantyExpiryDate(dto.getWarrantyExpiryDate());
        battery.setStatus(dto.getStatus() != null ? dto.getStatus() : battery.getStatus());
        battery.setCost(dto.getCost());
        battery.setNotes(dto.getNotes());
        VehicleBattery saved = repository.save(battery);
        return VehicleBatteryDTO.fromEntity(saved);
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        VehicleBattery battery = findScoped(id, companyId);
        repository.delete(battery);
        log.info("Bateria excluída: id={}", id);
    }

    // ==================== HELPERS ====================

    private VehicleBattery findScoped(UUID id, UUID companyId) {
        VehicleBattery battery = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bateria não encontrada com ID: " + id));
        if (battery.getCompanyId() != null && companyId != null && !companyId.equals(battery.getCompanyId())) {
            throw new ResourceNotFoundException("Bateria não encontrada com ID: " + id);
        }
        return battery;
    }
}
