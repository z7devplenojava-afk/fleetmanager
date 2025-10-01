package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.CreateDriverDTO;
import br.com.fleetmanager.dto.DriverDTO;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Driver;
import br.com.fleetmanager.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverService {
    private final DriverRepository driverRepository;

    public List<DriverDTO> getAllDrivers() {
        return driverRepository.findAll().stream()
                .map(DriverDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public DriverDTO getDriverById(UUID id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Motorista não encontrado com ID: " + id));
        return DriverDTO.fromEntity(driver);
    }

    @Transactional
    public DriverDTO createDriver(CreateDriverDTO dto) {
        // Verificar se já existe motorista com a mesma CNH
        if (dto.getLicenseNumber() != null && !dto.getLicenseNumber().trim().isEmpty()) {
            if (driverRepository.existsByLicenseNumber(dto.getLicenseNumber().trim())) {
                throw new IllegalArgumentException("Já existe um motorista cadastrado com esta CNH: " + dto.getLicenseNumber());
            }
        }
        
        Driver driver = Driver.builder()
                .name(dto.getName())
                .licenseNumber(dto.getLicenseNumber())
                .status(dto.getStatus() != null ? dto.getStatus() : "ATIVO")
                .build();
        driverRepository.save(driver);
        return DriverDTO.fromEntity(driver);
    }

    @Transactional
    public DriverDTO updateDriver(UUID id, CreateDriverDTO dto) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Motorista não encontrado com ID: " + id));
        driver.setName(dto.getName());
        driver.setLicenseNumber(dto.getLicenseNumber());
        if (dto.getStatus() != null) driver.setStatus(dto.getStatus());
        driverRepository.save(driver);
        return DriverDTO.fromEntity(driver);
    }

    @Transactional
    public void deactivateDriver(UUID id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Motorista não encontrado com ID: " + id));
        driver.setStatus("INATIVO");
        driverRepository.save(driver);
    }

    @Transactional
    public void deleteDriver(UUID id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Motorista não encontrado com ID: " + id));
        driverRepository.delete(driver);
    }
} 