package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleDTO;
import com.z7design.fleet_manager.dto.VehicleQRCodeDTO;
import com.z7design.fleet_manager.model.FleetWorkOrder;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.FleetWorkOrderRepository;
import com.z7design.fleet_manager.repository.GarageRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.security.TenantSecurityValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {
    
    private final VehicleRepository vehicleRepository;
    private final FleetWorkOrderRepository fleetWorkOrderRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkPostRepository workPostRepository;
    private final ClientRepository clientRepository;
    private final GarageRepository garageRepository;
    private final com.z7design.fleet_manager.service.GarageService garageService;
    private final TenantSecurityValidator tenantSecurityValidator;
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> getAllVehicles() {
        log.debug("Buscando todos os veículos");
        try {
            List<Vehicle> vehicles = vehicleRepository.findAll();
            log.debug("Encontrados {} veículos", vehicles.size());
            return vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar veículos: ", e);
            throw new RuntimeException("Erro ao buscar veículos: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public VehicleDTO getVehicleById(UUID id) {
        log.debug("Buscando veículo por ID: {}", id);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + id));
        tenantSecurityValidator.validateTenantAccess(vehicle.getCompanyId());
        return VehicleDTO.fromEntity(vehicle);
    }
    
    @Transactional(readOnly = true)
    public Optional<VehicleDTO> getVehicleByPlate(String plate) {
        log.debug("Buscando veÃ­culo por placa: {}", plate);
        Optional<Vehicle> vehicle = vehicleRepository.findByPlate(plate);
        return vehicle.map(VehicleDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> getVehiclesByStatus(Vehicle.VehicleStatus status) {
        log.debug("Buscando veÃ­culos por status: {}", status);
        try {
            List<Vehicle> vehicles = vehicleRepository.findByStatus(status);
            log.debug("Encontrados {} veÃ­culos com status {}", vehicles.size(), status);
            return vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar veÃ­culos por status: ", e);
            throw new RuntimeException("Erro ao buscar veÃ­culos por status: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehicles(String searchTerm) {
        log.debug("Buscando veÃ­culos com termo: {}", searchTerm);
        try {
            List<Vehicle> vehicles = vehicleRepository.findBySearchTerm(searchTerm);
            log.debug("Encontrados {} veÃ­culos para o termo '{}'", vehicles.size(), searchTerm);
            return vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar veÃ­culos: ", e);
            throw new RuntimeException("Erro ao buscar veÃ­culos: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public VehicleDTO createVehicle(VehicleDTO vehicleDTO) {
        log.debug("Criando novo veÃ­culo: {}", vehicleDTO.getPlate());
        try {
            // Validar se a placa jÃ¡ existe
            if (vehicleRepository.existsByPlate(vehicleDTO.getPlate())) {
                throw new RuntimeException("JÃ¡ existe um veÃ­culo com a placa: " + vehicleDTO.getPlate());
            }
            
            Vehicle vehicle = vehicleDTO.toEntity();
            // Bloqueia cadastro direto em garagem lotada
            if (vehicle.getGarageId() != null) {
                garageRepository.findById(vehicle.getGarageId())
                        .ifPresent(g -> garageService.validateHasCapacity(g, vehicle.getId()));
            }
            Vehicle savedVehicle = vehicleRepository.save(vehicle);
            log.debug("VeÃ­culo criado com sucesso: {}", savedVehicle.getId());
            return VehicleDTO.fromEntity(savedVehicle);
        } catch (Exception e) {
            log.error("Erro ao criar veÃ­culo: ", e);
            throw new RuntimeException("Erro ao criar veÃ­culo: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public VehicleDTO updateVehicle(UUID id, VehicleDTO vehicleDTO) {
        log.debug("Atualizando veículo ID: {}", id);
        try {
            Vehicle existingVehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + id));
            tenantSecurityValidator.validateTenantAccess(existingVehicle.getCompanyId());
            
            // Validar se a placa já existe em outro veículo
            if (!existingVehicle.getPlate().equals(vehicleDTO.getPlate()) && 
                vehicleRepository.existsByPlate(vehicleDTO.getPlate())) {
                throw new RuntimeException("Já existe um veículo com a placa: " + vehicleDTO.getPlate());
            }
            
            // Atualizar campos
            existingVehicle.setPlate(vehicleDTO.getPlate());
            existingVehicle.setModel(vehicleDTO.getModel());
            existingVehicle.setBrand(vehicleDTO.getBrand());
            existingVehicle.setYear(vehicleDTO.getYear());
            existingVehicle.setColor(vehicleDTO.getColor());
            existingVehicle.setStatus(vehicleDTO.getStatus());
            existingVehicle.setFuelType(vehicleDTO.getFuelType());
            existingVehicle.setCapacity(vehicleDTO.getCapacity());
            existingVehicle.setCurrentMileage(vehicleDTO.getCurrentMileage());
            existingVehicle.setInitialMileage(vehicleDTO.getInitialMileage());
            existingVehicle.setAssignedDriver(vehicleDTO.getAssignedDriver());
            existingVehicle.setResponsibleEmployeeId(vehicleDTO.getResponsibleEmployeeId());
            existingVehicle.setDepartment(vehicleDTO.getDepartment());
            existingVehicle.setLocation(vehicleDTO.getLocation());
            existingVehicle.setAcquisitionDate(vehicleDTO.getAcquisitionDate());
            existingVehicle.setAcquisitionValue(vehicleDTO.getAcquisitionValue());
            existingVehicle.setAverageConsumption(vehicleDTO.getAverageConsumption());
            existingVehicle.setAverageCostPerKm(vehicleDTO.getAverageCostPerKm());
            existingVehicle.setLastMaintenanceDate(vehicleDTO.getLastMaintenanceDate());
            existingVehicle.setNextMaintenanceDate(vehicleDTO.getNextMaintenanceDate());
            existingVehicle.setInsuranceExpiryDate(vehicleDTO.getInsuranceExpiryDate());
            existingVehicle.setDocumentationExpiryDate(vehicleDTO.getDocumentationExpiryDate());
            existingVehicle.setNotes(vehicleDTO.getNotes());
            existingVehicle.setPhotos(vehicleDTO.getPhotos());

            // Campos de Ônibus
            existingVehicle.setVehicleType(vehicleDTO.getVehicleType());
            existingVehicle.setBusType(vehicleDTO.getBusType());
            existingVehicle.setPassengerCapacity(vehicleDTO.getPassengerCapacity());
            existingVehicle.setStandingCapacity(vehicleDTO.getStandingCapacity());
            existingVehicle.setTotalDoors(vehicleDTO.getTotalDoors());
            existingVehicle.setHasAccessibility(vehicleDTO.getHasAccessibility());
            existingVehicle.setHasAirConditioning(vehicleDTO.getHasAirConditioning());
            existingVehicle.setHasWiFi(vehicleDTO.getHasWiFi());
            existingVehicle.setHasCamera(vehicleDTO.getHasCamera());
            existingVehicle.setHasCctv(vehicleDTO.getHasCctv());
            existingVehicle.setBusBodyType(vehicleDTO.getBusBodyType());
            existingVehicle.setChassisBrand(vehicleDTO.getChassisBrand());
            existingVehicle.setBodyBuilder(vehicleDTO.getBodyBuilder());
            existingVehicle.setEngineModel(vehicleDTO.getEngineModel());
            existingVehicle.setEnginePowerHp(vehicleDTO.getEnginePowerHp());
            existingVehicle.setTransmissionType(vehicleDTO.getTransmissionType());
            existingVehicle.setAxleCount(vehicleDTO.getAxleCount());
            existingVehicle.setTotalWeightKg(vehicleDTO.getTotalWeightKg());
            existingVehicle.setPayloadKg(vehicleDTO.getPayloadKg());
            existingVehicle.setFuelTankCapacityLiters(vehicleDTO.getFuelTankCapacityLiters());
            existingVehicle.setRouteNumber(vehicleDTO.getRouteNumber());
            existingVehicle.setRouteName(vehicleDTO.getRouteName());
            
            // Bloqueia mudança para garagem lotada (a própria garagem atual é permitida)
            if (vehicleDTO.getGarageId() != null
                    && !vehicleDTO.getGarageId().equals(existingVehicle.getGarageId())) {
                garageRepository.findById(vehicleDTO.getGarageId())
                        .ifPresent(g -> garageService.validateHasCapacity(g, existingVehicle.getId()));
            }
            Vehicle savedVehicle = vehicleRepository.save(existingVehicle);
            log.debug("VeÃ­culo atualizado com sucesso: {}", savedVehicle.getId());
            return VehicleDTO.fromEntity(savedVehicle);
        } catch (Exception e) {
            log.error("Erro ao atualizar veÃ­culo: ", e);
            throw new RuntimeException("Erro ao atualizar veÃ­culo: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void deleteVehicle(UUID id) {
        log.debug("Excluindo veículo ID: {}", id);
        try {
            Vehicle vehicle = vehicleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + id));
            tenantSecurityValidator.validateTenantAccess(vehicle.getCompanyId());

            // Soft delete: preserva histórico referenciado (abastecimentos,
            // manutenções, multas, pneus, OSs) e evita violação de FK.
            vehicleRepository.softDelete(id);
            log.debug("Veículo excluído (soft delete) com sucesso: {}", id);
        } catch (Exception e) {
            log.error("Erro ao excluir veÃ­culo: ", e);
            throw new RuntimeException("Erro ao excluir veÃ­culo: " + e.getMessage(), e);
        }
    }

    /**
     * Exclusão em massa via soft delete. Retorna o número de veículos efetivamente
     * excluídos (os demais: inexistentes ou já excluídos).
     */
    @Transactional
    public int deleteVehicles(java.util.List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        int deleted = vehicleRepository.softDeleteAll(ids);
        log.debug("Exclusão em massa: {} de {} veículo(s) marcado(s) como excluído(s)", deleted, ids.size());
        return deleted;
    }
    
    @Transactional(readOnly = true)
    public long count() {
        return vehicleRepository.count();
    }

    /**
     * Retorna os dados completos para o passaporte / QR Code do veículo:
     * Placa, Modelo/Ano, Status, Garagem, Cliente/Obra, Motorista Responsável e Última OS.
     */
    @Transactional(readOnly = true)
    public VehicleQRCodeDTO getVehicleQRCodeData(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + id));
        tenantSecurityValidator.validateTenantAccess(vehicle.getCompanyId());

        // Resolver Garagem
        String garageName = vehicle.getGarageName();
        UUID garageId = vehicle.getGarageId();
        if (garageId != null && (garageName == null || garageName.isBlank())) {
            garageRepository.findById(garageId).ifPresent(g -> {});
        }

        // Resolver Cliente
        String clientName = vehicle.getClientName();
        UUID clientId = vehicle.getClientId();
        if (clientId != null && (clientName == null || clientName.isBlank())) {
            clientRepository.findById(clientId).ifPresent(c -> {});
        }

        // Resolver Obra / Posto
        String workPostName = null;
        UUID workPostId = vehicle.getWorkPostId();
        if (workPostId != null) {
            Optional<WorkPost> wp = workPostRepository.findById(workPostId);
            if (wp.isPresent()) {
                workPostName = wp.get().getName();
                if ((clientName == null || clientName.isBlank()) && wp.get().getClient() != null) {
                    clientName = wp.get().getClient().getName();
                    clientId = wp.get().getClient().getId();
                }
            }
        }

        // Resolver Motorista / Responsável
        String assignedDriver = vehicle.getAssignedDriver();
        String responsibleEmployeeName = null;
        UUID responsibleEmployeeId = vehicle.getResponsibleEmployeeId();
        if (responsibleEmployeeId != null) {
            employeeRepository.findById(responsibleEmployeeId)
                    .ifPresent(e -> {});
            if (vehicle.getResponsibleEmployee() != null) {
                responsibleEmployeeName = vehicle.getResponsibleEmployee().getName();
            }
        }
        if ((assignedDriver == null || assignedDriver.isBlank()) && responsibleEmployeeName != null) {
            assignedDriver = responsibleEmployeeName;
        }

        // Resolver Última OS
        String lastOsNumber = "Nenhuma";
        String lastOsStatus = "-";
        String lastOsType = "-";
        LocalDate lastOsDate = null;
        BigDecimal lastOsCost = BigDecimal.ZERO;
        String lastOsMaintenancePerformed = null;

        List<FleetWorkOrder> orders = fleetWorkOrderRepository.findByVehicleIdAndDeletedAtIsNullOrderByCreatedAtDesc(id);
        if (!orders.isEmpty()) {
            FleetWorkOrder last = orders.get(0);
            lastOsNumber = last.getOsNumber() != null ? last.getOsNumber() : "OS-" + last.getId().toString().substring(0, 8);
            lastOsStatus = last.getStatus() != null ? last.getStatus().name() : "-";
            lastOsType = last.getMaintenanceType() != null ? last.getMaintenanceType().name() : "-";
            lastOsDate = last.getCompletionDate() != null
                    ? last.getCompletionDate().toLocalDate()
                    : (last.getPlannedDate() != null ? last.getPlannedDate() : (last.getCreatedAt() != null ? last.getCreatedAt().toLocalDate() : null));
            lastOsCost = last.getTotalCost() != null ? last.getTotalCost() : BigDecimal.ZERO;
            lastOsMaintenancePerformed = last.getMaintenancePerformed();
        }

        // Texto legível contido no QR Code
        String qrPayload = String.format(
                "VEICULO: %s | MODELO: %s (%d)\n" +
                "STATUS: %s\n" +
                "GARAGEM: %s\n" +
                "CLIENTE: %s\n" +
                "MOTORISTA/RESP: %s\n" +
                "ULTIMA OS: %s (%s - %s)\n" +
                "KM: %s\n" +
                "ID: %s",
                vehicle.getPlate(),
                vehicle.getModel() != null ? vehicle.getModel() : "-",
                vehicle.getYear() != null ? vehicle.getYear() : 0,
                vehicle.getStatus() != null ? vehicle.getStatus().name() : "ACTIVE",
                garageName != null && !garageName.isBlank() ? garageName : "Não informada",
                clientName != null && !clientName.isBlank() ? clientName : (workPostName != null ? workPostName : "Não vinculado"),
                assignedDriver != null && !assignedDriver.isBlank() ? assignedDriver : "Não atribuído",
                lastOsNumber,
                lastOsType,
                lastOsStatus,
                vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() + " KM" : "-",
                vehicle.getId()
        );

        return VehicleQRCodeDTO.builder()
                .id(vehicle.getId())
                .plate(vehicle.getPlate())
                .fleetNumber(vehicle.getFleetNumber())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .status(vehicle.getStatus() != null ? vehicle.getStatus().name() : "ACTIVE")
                .fuelType(vehicle.getFuelType() != null ? vehicle.getFuelType().name() : null)
                .currentMileage(vehicle.getCurrentMileage())
                .garageName(garageName != null && !garageName.isBlank() ? garageName : "Não informada")
                .garageId(garageId)
                .clientName(clientName != null && !clientName.isBlank() ? clientName : "Não vinculado")
                .clientId(clientId)
                .workPostName(workPostName)
                .workPostId(workPostId)
                .assignedDriver(assignedDriver != null && !assignedDriver.isBlank() ? assignedDriver : "Não atribuído")
                .responsibleEmployeeName(responsibleEmployeeName)
                .responsibleEmployeeId(responsibleEmployeeId)
                .lastOsNumber(lastOsNumber)
                .lastOsStatus(lastOsStatus)
                .lastOsType(lastOsType)
                .lastOsDate(lastOsDate)
                .lastOsCost(lastOsCost)
                .lastOsMaintenancePerformed(lastOsMaintenancePerformed)
                .qrCodeText(qrPayload)
                .qrCodeImageUrl("/api/vehicles/" + vehicle.getId() + "/qrcode/image")
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Gera a imagem PNG do QR Code do veículo.
     */
    public byte[] generateQRCodeImage(UUID id, int width, int height) {
        VehicleQRCodeDTO data = getVehicleQRCodeData(id);
        try {
            int w = width > 0 ? width : 350;
            int h = height > 0 ? height : 350;
            com.google.zxing.common.BitMatrix bitMatrix = new com.google.zxing.MultiFormatWriter().encode(
                    data.getQrCodeText(),
                    com.google.zxing.BarcodeFormat.QR_CODE,
                    w,
                    h
            );
            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Erro ao gerar imagem QRCode para veículo {}: ", id, e);
            throw new RuntimeException("Erro ao gerar imagem QR Code do veículo: " + e.getMessage(), e);
        }
    }
}

