package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.CreateDriverDTO;
import com.z7design.fleet_manager.dto.DriverDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Driver;
import com.z7design.fleet_manager.repository.DriverRepository;
import com.z7design.fleet_manager.tenant.TenantContext;
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
                .orElseThrow(() -> new ResourceNotFoundException("Motorista nÃ£o encontrado com ID: " + id));
        return DriverDTO.fromEntity(driver);
    }

    @Transactional
    public DriverDTO createDriver(CreateDriverDTO dto) {
        // Verificar se jÃ¡ existe motorista com a mesma CNH
        if (dto.getLicenseNumber() != null && !dto.getLicenseNumber().trim().isEmpty()) {
            if (driverRepository.existsByLicenseNumber(dto.getLicenseNumber().trim())) {
                throw new IllegalArgumentException("JÃ¡ existe um motorista cadastrado com esta CNH: " + dto.getLicenseNumber());
            }
        }
        
        Driver driver = Driver.builder()
                .name(dto.getName())
                .licenseNumber(dto.getLicenseNumber())
                .phone(dto.getPhone())
                .status(dto.getStatus() != null ? dto.getStatus() : "ATIVO")
                .companyId(TenantContext.get())
                .build();
        driverRepository.save(driver);
        return DriverDTO.fromEntity(driver);
    }

    @Transactional
    public DriverDTO updateDriver(UUID id, CreateDriverDTO dto) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Motorista nÃ£o encontrado com ID: " + id));
        driver.setName(dto.getName());
        driver.setLicenseNumber(dto.getLicenseNumber());
        driver.setPhone(dto.getPhone());
        if (dto.getStatus() != null) driver.setStatus(dto.getStatus());
        // Garantir vínculo com a empresa do tenant (motoristas órfãos ficam invisíveis ao tenantFilter)
        if (driver.getCompanyId() == null && TenantContext.get() != null) {
            driver.setCompanyId(TenantContext.get());
        }
        driverRepository.save(driver);
        return DriverDTO.fromEntity(driver);
    }

    @Transactional
    public void deactivateDriver(UUID id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Motorista nÃ£o encontrado com ID: " + id));
        driver.setStatus("INATIVO");
        driverRepository.save(driver);
    }

    @Transactional
    public void deleteDriver(UUID id) {
        System.out.println("ðŸ—‘ï¸ DriverService.deleteDriver - Tentando excluir motorista ID: " + id);
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> {
                    System.out.println("âŒ Motorista nÃ£o encontrado com ID: " + id);
                    return new ResourceNotFoundException("Motorista nÃ£o encontrado com ID: " + id);
                });
        System.out.println("âœ… Motorista encontrado: " + driver.getName() + " (CNH: " + driver.getLicenseNumber() + ")");
        driverRepository.delete(driver);
        System.out.println("âœ… Motorista excluÃ­do com sucesso do banco de dados");
    }
} 
