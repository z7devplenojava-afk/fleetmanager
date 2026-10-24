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
    private final com.z7design.fleet_manager.repository.EmployeeRepository employeeRepository;
    private final com.z7design.fleet_manager.repository.UserRepository userRepository;

    @Transactional
    public void syncDriversFromEmployees() {
        UUID currentCompanyId = TenantContext.get();
        List<Object[]> basicData = employeeRepository.findBasicDataScoped(currentCompanyId);
        
        for (Object[] row : basicData) {
            try {
                // Indices from findBasicData:
                // 0: e.id, 1: e.name, 2: e.document, 10: e.phone, 12: e.cnh_number, 14: e.cbo, 19: position_name, 22: user_id
                String name = row[1] != null ? row[1].toString() : null;
                String document = row[2] != null ? row[2].toString() : null;
                String phone = row[10] != null ? row[10].toString() : null;
                String cnh = row[12] != null ? row[12].toString() : null;
                String cbo = row[14] != null ? row[14].toString() : null;
                String posName = row[19] != null ? row[19].toString() : null;
                UUID userId = row[22] != null ? (UUID) row[22] : null;

                boolean isMotorista = false;
                if (posName != null && posName.toUpperCase().contains("MOTORISTA")) {
                    isMotorista = true;
                } else if (cbo != null && (cbo.startsWith("7823") || cbo.startsWith("7824") || cbo.startsWith("7825"))) {
                    isMotorista = true;
                }

                if (!isMotorista || name == null || name.isBlank()) {
                    continue;
                }

                String cleanCpf = (document != null) ? document.replaceAll("[^0-9]", "") : null;
                String cleanCnh = (cnh != null && !cnh.trim().isEmpty()) ? cnh.trim() : null;

                Driver driver = null;
                if (cleanCpf != null && !cleanCpf.isEmpty()) {
                    driver = driverRepository.findByCleanCpfGlobal(cleanCpf).orElse(null);
                }
                if (driver == null && cleanCnh != null) {
                    driver = driverRepository.findByLicenseNumber(cleanCnh).orElse(null);
                }

                if (driver == null) {
                    // Se cleanCnh for vazio, não setar para evitar violação de unique constraint
                    String licenseToSet = (cleanCnh != null && !cleanCnh.isBlank()) ? cleanCnh : null;
                    if (licenseToSet != null && driverRepository.existsByLicenseNumber(licenseToSet)) {
                        licenseToSet = null; // evita colisão se outra entidade estiver com esse número
                    }

                    driver = Driver.builder()
                            .name(name.trim())
                            .cpf(cleanCpf)
                            .licenseNumber(licenseToSet)
                            .phone(phone)
                            .status("ATIVO")
                            .companyId(currentCompanyId)
                            .build();
                } else {
                    if (driver.getCompanyId() == null && currentCompanyId != null) {
                        driver.setCompanyId(currentCompanyId);
                    }
                    if (cleanCpf != null && (driver.getCpf() == null || driver.getCpf().isEmpty())) {
                        driver.setCpf(cleanCpf);
                    }
                    if (cleanCnh != null && !cleanCnh.isBlank() && (driver.getLicenseNumber() == null || driver.getLicenseNumber().isEmpty())) {
                        if (!driverRepository.existsByLicenseNumber(cleanCnh)) {
                            driver.setLicenseNumber(cleanCnh);
                        }
                    }
                    if (phone != null && (driver.getPhone() == null || driver.getPhone().isEmpty())) {
                        driver.setPhone(phone);
                    }
                }

                if (userId != null && driver.getUser() == null) {
                    driver.setUser(userRepository.findById(userId).orElse(null));
                }

                driverRepository.save(driver);
            } catch (Exception e) {
                // Log and continue to next employee
                System.err.println("Aviso ao sincronizar motorista: " + e.getMessage());
            }
        }
    }

    public List<DriverDTO> getAllDrivers() {
        syncDriversFromEmployees();
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
                .cpf(dto.getCpf())
                .cnhCategory(dto.getCnhCategory())
                .cnhExpiration(dto.getCnhExpiration())
                .photoUrl(dto.getPhotoUrl())
                .companyId(TenantContext.get())
                .build();
        if (dto.getUserId() != null) {
            driver.setUser(userRepository.findById(dto.getUserId()).orElse(null));
        }
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
        driver.setCpf(dto.getCpf());
        driver.setCnhCategory(dto.getCnhCategory());
        driver.setCnhExpiration(dto.getCnhExpiration());
        driver.setPhotoUrl(dto.getPhotoUrl());
        if (dto.getUserId() != null) {
            driver.setUser(userRepository.findById(dto.getUserId()).orElse(null));
        }
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
