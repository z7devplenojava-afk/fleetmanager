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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import com.z7design.fleet_manager.model.FleetComponentControl;
import com.z7design.fleet_manager.model.FuelRecord;
import com.z7design.fleet_manager.model.Trip;

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
    private final PreventiveModel2Service preventiveModel2Service;
    private final com.z7design.fleet_manager.repository.FuelRecordRepository fuelRecordRepository;
    private final com.z7design.fleet_manager.repository.TripRepository tripRepository;
    private final com.z7design.fleet_manager.repository.FleetComponentControlRepository fleetComponentControlRepository;
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> getAllVehicles() {
        log.debug("Buscando todos os veículos");
        try {
            UUID tenantId = com.z7design.fleet_manager.tenant.TenantContext.get();
            List<Vehicle> vehicles = null;
            if (tenantId != null) {
                vehicles = vehicleRepository.findByCompanyId(tenantId);
            }
            if (vehicles == null || vehicles.isEmpty()) {
                vehicles = vehicleRepository.findAll();
            }
            if (vehicles == null || vehicles.isEmpty()) {
                vehicles = vehicleRepository.findAllRawIncludingDeletedAndTenants();
            }
            log.debug("Encontrados {} veículos (tenant: {})", vehicles.size(), tenantId);
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
        if (vehicle.getCompanyId() != null) {
            try {
                tenantSecurityValidator.validateTenantAccess(vehicle.getCompanyId());
            } catch (Exception e) {
                log.warn("Permitindo visualização compartilhada de veículo {} para o usuário atual", id);
            }
        }
        return VehicleDTO.fromEntity(vehicle);
    }
    
    @Transactional(readOnly = true)
    public Optional<VehicleDTO> getVehicleByPlate(String plate) {
        log.debug("Buscando veículo por placa: {}", plate);
        UUID tenantId = com.z7design.fleet_manager.tenant.TenantContext.get();
        Optional<Vehicle> vehicle = Optional.empty();
        if (tenantId != null) {
            vehicle = vehicleRepository.findByPlateAndCompanyId(plate, tenantId);
        }
        if (vehicle.isEmpty()) {
            vehicle = vehicleRepository.findByPlate(plate);
        }
        if (vehicle.isEmpty()) {
            vehicle = vehicleRepository.findByPlateRaw(plate);
        }
        return vehicle.map(VehicleDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> getVehiclesByStatus(Vehicle.VehicleStatus status) {
        log.debug("Buscando veículos por status: {}", status);
        try {
            UUID tenantId = com.z7design.fleet_manager.tenant.TenantContext.get();
            List<Vehicle> vehicles = (tenantId != null) 
                    ? vehicleRepository.findByStatusAndCompanyId(status, tenantId) 
                    : vehicleRepository.findByStatus(status);
            log.debug("Encontrados {} veículos com status {}", vehicles.size(), status);
            return vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar veículos por status: ", e);
            throw new RuntimeException("Erro ao buscar veículos por status: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehicles(String searchTerm) {
        log.debug("Buscando veículos com termo: {}", searchTerm);
        try {
            UUID tenantId = com.z7design.fleet_manager.tenant.TenantContext.get();
            List<Vehicle> vehicles = (tenantId != null) 
                    ? vehicleRepository.findBySearchTermAndCompanyId(searchTerm, tenantId) 
                    : vehicleRepository.findBySearchTerm(searchTerm);
            log.debug("Encontrados {} veículos para o termo '{}'", vehicles.size(), searchTerm);
            return vehicles.stream()
                    .map(VehicleDTO::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar veículos: ", e);
            throw new RuntimeException("Erro ao buscar veículos: " + e.getMessage(), e);
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
            if (vehicleDTO.getFleetNumber() != null) existingVehicle.setFleetNumber(vehicleDTO.getFleetNumber());
            existingVehicle.setModel(vehicleDTO.getModel());
            existingVehicle.setBrand(vehicleDTO.getBrand());
            existingVehicle.setYear(vehicleDTO.getYear());
            existingVehicle.setColor(vehicleDTO.getColor());
            existingVehicle.setStatus(vehicleDTO.getStatus());
            if (vehicleDTO.getPatrimonyNumber() != null) existingVehicle.setPatrimonyNumber(vehicleDTO.getPatrimonyNumber());
            if (vehicleDTO.getModelYear() != null) existingVehicle.setModelYear(vehicleDTO.getModelYear());
            if (vehicleDTO.getHourmeter() != null) existingVehicle.setHourmeter(vehicleDTO.getHourmeter());
            existingVehicle.setFuelType(vehicleDTO.getFuelType());
            existingVehicle.setCapacity(vehicleDTO.getCapacity());
            Integer previousMileage = existingVehicle.getCurrentMileage();
            existingVehicle.setCurrentMileage(vehicleDTO.getCurrentMileage());
            existingVehicle.setInitialMileage(vehicleDTO.getInitialMileage());
            existingVehicle.setAssignedDriver(vehicleDTO.getAssignedDriver());
            existingVehicle.setResponsibleEmployeeId(vehicleDTO.getResponsibleEmployeeId());
            existingVehicle.setDepartment(vehicleDTO.getDepartment());
            existingVehicle.setDepartmentId(vehicleDTO.getDepartmentId());
            existingVehicle.setGarageId(vehicleDTO.getGarageId());
            existingVehicle.setGarageName(vehicleDTO.getGarageName());
            existingVehicle.setWorkPostId(vehicleDTO.getWorkPostId());
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

            // Documentais
            if (vehicleDTO.getChassisNumber() != null) existingVehicle.setChassisNumber(vehicleDTO.getChassisNumber());
            if (vehicleDTO.getRenavan() != null) existingVehicle.setRenavan(vehicleDTO.getRenavan());

            // Cliente / Alocação / Locação
            existingVehicle.setClientId(vehicleDTO.getClientId());
            existingVehicle.setClientName(vehicleDTO.getClientName());
            if (vehicleDTO.getContractId() != null) existingVehicle.setContractId(vehicleDTO.getContractId());
            existingVehicle.setAllocationContractNumber(vehicleDTO.getAllocationContractNumber());
            existingVehicle.setAllocationStartDate(vehicleDTO.getAllocationStartDate());
            existingVehicle.setAllocationEndDate(vehicleDTO.getAllocationEndDate());

            // Sincronização automática Cliente <-> Posto de Trabalho / Obra
            if (existingVehicle.getWorkPostId() != null) {
                workPostRepository.findById(existingVehicle.getWorkPostId()).ifPresent(wp -> {
                    if (existingVehicle.getLocation() == null || existingVehicle.getLocation().isBlank()) {
                        existingVehicle.setLocation(wp.getName());
                    }
                    if (existingVehicle.getClientId() == null && wp.getClient() != null) {
                        existingVehicle.setClientId(wp.getClient().getId());
                        existingVehicle.setClientName(wp.getClient().getName());
                    }
                });
            } else if (existingVehicle.getClientId() != null) {
                if (existingVehicle.getClientName() == null || existingVehicle.getClientName().isBlank()) {
                    clientRepository.findById(existingVehicle.getClientId())
                            .ifPresent(c -> existingVehicle.setClientName(c.getName()));
                }
                List<WorkPost> clientPosts = workPostRepository.findByClientId(existingVehicle.getClientId());
                if (clientPosts != null && !clientPosts.isEmpty()) {
                    WorkPost firstPost = clientPosts.get(0);
                    existingVehicle.setWorkPostId(firstPost.getId());
                    if (existingVehicle.getLocation() == null || existingVehicle.getLocation().isBlank()) {
                        existingVehicle.setLocation(firstPost.getName());
                    }
                }
            }

            // Financiamento e Valor de Mercado
            existingVehicle.setFinancingStatus(vehicleDTO.getFinancingStatus());
            existingVehicle.setFinancingInstallmentValue(vehicleDTO.getFinancingInstallmentValue());
            existingVehicle.setFinancingRemainingInstallments(vehicleDTO.getFinancingRemainingInstallments());
            existingVehicle.setFinancingPayoffBalance(vehicleDTO.getFinancingPayoffBalance());
            existingVehicle.setFinancingBankOrInstitution(vehicleDTO.getFinancingBankOrInstitution());
            existingVehicle.setFinancingContractNumber(vehicleDTO.getFinancingContractNumber());
            existingVehicle.setFinancingStartDate(vehicleDTO.getFinancingStartDate());
            existingVehicle.setFinancingEndDate(vehicleDTO.getFinancingEndDate());
            existingVehicle.setMarketValue(vehicleDTO.getMarketValue());

            // Seguros
            existingVehicle.setInsurancePolicyNumber(vehicleDTO.getInsurancePolicyNumber());
            existingVehicle.setInsuranceCompany(vehicleDTO.getInsuranceCompany());
            existingVehicle.setInsurancePremiumValue(vehicleDTO.getInsurancePremiumValue());
            existingVehicle.setInsuranceCoverageType(vehicleDTO.getInsuranceCoverageType());
            existingVehicle.setInsuranceSecondPolicyNumber(vehicleDTO.getInsuranceSecondPolicyNumber());
            existingVehicle.setInsuranceSecondCompany(vehicleDTO.getInsuranceSecondCompany());
            existingVehicle.setInsuranceSecondPremiumValue(vehicleDTO.getInsuranceSecondPremiumValue());
            existingVehicle.setInsuranceSecondExpiryDate(vehicleDTO.getInsuranceSecondExpiryDate());

            // Agregado
            existingVehicle.setIsAggregated(vehicleDTO.getIsAggregated());
            existingVehicle.setAggregatedOwnerName(vehicleDTO.getAggregatedOwnerName());
            existingVehicle.setAggregatedOwnerCpfCnpj(vehicleDTO.getAggregatedOwnerCpfCnpj());
            existingVehicle.setAggregatedOwnerPhone(vehicleDTO.getAggregatedOwnerPhone());
            existingVehicle.setAggregatedOwnerEmail(vehicleDTO.getAggregatedOwnerEmail());
            existingVehicle.setAggregatedDailyRate(vehicleDTO.getAggregatedDailyRate());
            existingVehicle.setAggregatedMonthlyRate(vehicleDTO.getAggregatedMonthlyRate());
            existingVehicle.setAggregatedPaymentType(vehicleDTO.getAggregatedPaymentType());
            existingVehicle.setAggregatedContractStartDate(vehicleDTO.getAggregatedContractStartDate());
            existingVehicle.setAggregatedContractEndDate(vehicleDTO.getAggregatedContractEndDate());
            existingVehicle.setAggregatedNotes(vehicleDTO.getAggregatedNotes());
            existingVehicle.setFinancialDifference(vehicleDTO.getFinancialDifference());

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
            if (savedVehicle.getCurrentMileage() != null && savedVehicle.getCurrentMileage() > 0
                    && (previousMileage == null || savedVehicle.getCurrentMileage() > previousMileage)) {
                try {
                    preventiveModel2Service.evaluateAndAutoOpenForVehicle(savedVehicle);
                } catch (Exception autoEx) {
                    log.warn("Aviso ao avaliar OS Preventiva Modelo 2 automática para {}: {}", savedVehicle.getPlate(), autoEx.getMessage());
                }
            }
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
     * - Padrão: Placa, Status, KM atual, Documentação, Manutenção
     * - Completo: Motorista atual, Cliente atendido, Último abastecimento, KM atual,
     *   Vencimentos, Agregado (apenas se for agregado), Última OS, Documentos,
     *   Última rota executada e Localização atual.
     */
    @Transactional(readOnly = true)
    public VehicleQRCodeDTO getVehicleQRCodeData(UUID id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com ID: " + id));
        tenantSecurityValidator.validateTenantAccess(vehicle.getCompanyId());

        // Resolver Garagem
        String garageName = vehicle.getGarageName();
        UUID garageId = vehicle.getGarageId();
        String garageAddress = null;
        if (garageId != null) {
            Optional<com.z7design.fleet_manager.model.Garage> g = garageRepository.findById(garageId);
            if (g.isPresent()) {
                if (garageName == null || garageName.isBlank()) {
                    garageName = g.get().getName();
                }
                garageAddress = g.get().getAddress();
            }
        }

        // Resolver Cliente e Obra / Posto
        String clientName = vehicle.getClientName();
        UUID clientId = vehicle.getClientId();
        String clientCnpj = null;
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
        if (clientId != null) {
            Optional<com.z7design.fleet_manager.model.Client> cl = clientRepository.findById(clientId);
            if (cl.isPresent()) {
                clientCnpj = cl.get().getCnpj();
                if (clientName == null || clientName.isBlank()) {
                    clientName = cl.get().getName();
                }
            }
        }
        String contractNumber = vehicle.getAllocationContractNumber();

        // Resolver Motorista / Responsável
        String assignedDriver = vehicle.getAssignedDriver();
        String responsibleEmployeeName = null;
        UUID responsibleEmployeeId = vehicle.getResponsibleEmployeeId();
        String driverCnh = null;
        String driverCpf = null;
        if (responsibleEmployeeId != null) {
            Optional<com.z7design.fleet_manager.model.Employee> empOpt = employeeRepository.findById(responsibleEmployeeId);
            if (empOpt.isPresent()) {
                com.z7design.fleet_manager.model.Employee emp = empOpt.get();
                responsibleEmployeeName = emp.getName();
                driverCnh = emp.getCnhNumber();
                driverCpf = emp.getDocument() != null ? emp.getDocument() : (emp.getUser() != null ? emp.getUser().getCpf() : null);
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

        // Documentação (CRLV) e Seguro
        String chassisNumber = vehicle.getChassisNumber();
        String renavan = vehicle.getRenavan();
        LocalDate docDate = vehicle.getDocumentationExpiryDate();
        String docStatus = "OK";
        Long docDaysRemaining = null;
        if (docDate != null) {
            docDaysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), docDate);
            if (docDaysRemaining < 0) {
                docStatus = "EXPIRED";
            } else if (docDaysRemaining <= 30) {
                docStatus = "EXPIRING_SOON";
            } else {
                docStatus = "OK";
            }
        }

        LocalDate insuranceDate = vehicle.getInsuranceExpiryDate();
        String insuranceStatus = "OK";
        Long insuranceDaysRemaining = null;
        if (insuranceDate != null) {
            insuranceDaysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), insuranceDate);
            if (insuranceDaysRemaining < 0) {
                insuranceStatus = "EXPIRED";
            } else if (insuranceDaysRemaining <= 30) {
                insuranceStatus = "EXPIRING_SOON";
            } else {
                insuranceStatus = "OK";
            }
        }
        String insuranceCompany = vehicle.getInsuranceCompany();
        String insurancePolicyNumber = vehicle.getInsurancePolicyNumber();

        // Último Abastecimento
        LocalDate lastFuelDate = null;
        BigDecimal lastFuelLiters = null;
        BigDecimal lastFuelCost = null;
        String lastFuelStation = null;
        String lastFuelType = null;
        Integer lastFuelMileage = null;
        List<FuelRecord> fuelRecords = fuelRecordRepository.findLastFuelRecordByVehicle(id);
        if (fuelRecords != null && !fuelRecords.isEmpty()) {
            FuelRecord fr = fuelRecords.get(0);
            lastFuelDate = fr.getDate();
            lastFuelLiters = fr.getQuantity();
            lastFuelCost = fr.getCost();
            lastFuelStation = fr.getStation();
            lastFuelType = fr.getFuelType() != null ? fr.getFuelType().name() : null;
            lastFuelMileage = fr.getMileage();
        }

        // Última Rota Executada
        String lastRouteCode = vehicle.getRouteNumber();
        String lastRouteName = vehicle.getRouteName();
        LocalDate lastTripDate = null;
        LocalDateTime lastTripStartTime = null;
        LocalDateTime lastTripEndTime = null;
        String lastTripDriverName = null;
        Integer lastTripInitialKm = null;
        Integer lastTripFinalKm = null;
        String lastTripStatus = null;
        Double currentLatitude = null;
        Double currentLongitude = null;

        List<Trip> trips = tripRepository.findByVehicleIdOrderByTripDateDescStartTimeDesc(id);
        if (trips != null && !trips.isEmpty()) {
            Trip lastTrip = trips.get(0);
            if (lastTrip.getRoute() != null) {
                lastRouteCode = lastTrip.getRoute().getCode();
                lastRouteName = lastTrip.getRoute().getName();
            }
            lastTripDate = lastTrip.getTripDate();
            lastTripStartTime = lastTrip.getStartTime();
            lastTripEndTime = lastTrip.getEndTime();
            if (lastTrip.getDriver() != null) {
                lastTripDriverName = lastTrip.getDriver().getName();
            }
            lastTripInitialKm = lastTrip.getInitialKm();
            lastTripFinalKm = lastTrip.getFinalKm();
            lastTripStatus = lastTrip.getStatus() != null ? lastTrip.getStatus().name() : null;
            currentLatitude = lastTrip.getCurrentLat();
            currentLongitude = lastTrip.getCurrentLng();
        }

        // Gestão de Agregado (SÓ EXIBIDO SE FOR VEÍCULO DE AGREGADO)
        Boolean isAggregated = Boolean.TRUE.equals(vehicle.getIsAggregated());
        String aggOwnerName = null;
        String aggOwnerCpfCnpj = null;
        String aggOwnerPhone = null;
        String aggOwnerEmail = null;
        BigDecimal aggDailyRate = null;
        BigDecimal aggMonthlyRate = null;
        String aggPaymentType = null;
        LocalDate aggStartDate = null;
        LocalDate aggEndDate = null;
        String aggNotes = null;

        if (isAggregated) {
            aggOwnerName = vehicle.getAggregatedOwnerName();
            aggOwnerCpfCnpj = vehicle.getAggregatedOwnerCpfCnpj();
            aggOwnerPhone = vehicle.getAggregatedOwnerPhone();
            aggOwnerEmail = vehicle.getAggregatedOwnerEmail();
            aggDailyRate = vehicle.getAggregatedDailyRate();
            aggMonthlyRate = vehicle.getAggregatedMonthlyRate();
            aggPaymentType = vehicle.getAggregatedPaymentType() != null ? vehicle.getAggregatedPaymentType().name() : null;
            aggStartDate = vehicle.getAggregatedContractStartDate();
            aggEndDate = vehicle.getAggregatedContractEndDate();
            aggNotes = vehicle.getAggregatedNotes();
        }

        // Localização Atual
        String currentLocation = vehicle.getLocation() != null && !vehicle.getLocation().isBlank()
                ? vehicle.getLocation()
                : (garageName != null ? garageName : (workPostName != null ? workPostName : "Não informada"));

        // Manutenção Preventiva & Controles de Componentes
        int currentKm = vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() : 0;
        List<FleetComponentControl> controls = fleetComponentControlRepository.findByVehicleIdAndIsLatestTrue(id);
        List<VehicleQRCodeDTO.PreventiveAlertItemDTO> preventiveItems = new ArrayList<>();
        int overdueCount = 0;
        int upcomingCount = 0;

        for (FleetComponentControl c : controls) {
            int remaining = c.getNextDueKm() - currentKm;
            String status = "OK";
            if (remaining <= 0) {
                status = "OVERDUE";
                overdueCount++;
            } else if (remaining <= 3000) {
                status = "UPCOMING";
                upcomingCount++;
            }
            
            String label = c.getControlType();
            if ("ALIGNMENT".equalsIgnoreCase(c.getControlType())) label = "Alinhamento e Balanceamento";
            else if ("ENGINE_OIL".equalsIgnoreCase(c.getControlType())) label = "Troca de Óleo de Motor";
            else if ("PULLEY_BEARING".equalsIgnoreCase(c.getControlType())) label = "Rolamento da Polia";
            else if ("STARTER".equalsIgnoreCase(c.getControlType())) label = "Motor de Arranque";
            else if ("ALTERNATOR".equalsIgnoreCase(c.getControlType())) label = "Alternador";

            preventiveItems.add(VehicleQRCodeDTO.PreventiveAlertItemDTO.builder()
                    .controlType(c.getControlType())
                    .componentName(label)
                    .lastServiceKm(c.getServiceKm())
                    .nextDueKm(c.getNextDueKm())
                    .remainingKm(remaining)
                    .status(status)
                    .lastServiceDate(c.getServiceDate())
                    .build());
        }

        String preventiveSummary = overdueCount > 0
                ? String.format("%d preventiva(s) vencida(s)", overdueCount)
                : (upcomingCount > 0 ? String.format("%d preventiva(s) próxima(s)", upcomingCount) : "Preventivas em dia");

        // Texto legível contido no QR Code
        String qrPayload = String.format(
                "VEICULO: %s | MODELO: %s (%d)\n" +
                "STATUS: %s\n" +
                "GARAGEM: %s\n" +
                "CLIENTE: %s\n" +
                "MOTORISTA/RESP: %s\n" +
                "KM: %s\n" +
                (isAggregated ? ("AGREGADO: " + (aggOwnerName != null ? aggOwnerName : "Sim") + "\n") : "") +
                "ULTIMA OS: %s (%s - %s)\n" +
                "DOC CRLV: %s\n" +
                "ID: %s",
                vehicle.getPlate(),
                vehicle.getModel() != null ? vehicle.getModel() : "-",
                vehicle.getYear() != null ? vehicle.getYear() : 0,
                vehicle.getStatus() != null ? vehicle.getStatus().name() : "ACTIVE",
                garageName != null && !garageName.isBlank() ? garageName : "Não informada",
                clientName != null && !clientName.isBlank() ? clientName : (workPostName != null ? workPostName : "Não vinculado"),
                assignedDriver != null && !assignedDriver.isBlank() ? assignedDriver : "Não atribuído",
                vehicle.getCurrentMileage() != null ? vehicle.getCurrentMileage() + " KM" : "-",
                lastOsNumber,
                lastOsType,
                lastOsStatus,
                docDate != null ? docDate.toString() : "Em dia",
                vehicle.getId()
        );

        return VehicleQRCodeDTO.builder()
                .id(vehicle.getId())
                .plate(vehicle.getPlate())
                .fleetNumber(vehicle.getFleetNumber())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .color(vehicle.getColor())
                .status(vehicle.getStatus() != null ? vehicle.getStatus().name() : "ACTIVE")
                .fuelType(vehicle.getFuelType() != null ? vehicle.getFuelType().name() : null)
                .currentMileage(vehicle.getCurrentMileage())
                .garageName(garageName != null && !garageName.isBlank() ? garageName : "Não informada")
                .garageId(garageId)
                .garageAddress(garageAddress)
                .clientName(clientName != null && !clientName.isBlank() ? clientName : "Não vinculado")
                .clientId(clientId)
                .clientCnpj(clientCnpj)
                .workPostName(workPostName)
                .workPostId(workPostId)
                .contractNumber(contractNumber)
                .assignedDriver(assignedDriver != null && !assignedDriver.isBlank() ? assignedDriver : "Não atribuído")
                .responsibleEmployeeName(responsibleEmployeeName)
                .responsibleEmployeeId(responsibleEmployeeId)
                .driverCnh(driverCnh)
                .driverCpf(driverCpf)
                .lastOsNumber(lastOsNumber)
                .lastOsStatus(lastOsStatus)
                .lastOsType(lastOsType)
                .lastOsDate(lastOsDate)
                .lastOsCost(lastOsCost)
                .lastOsMaintenancePerformed(lastOsMaintenancePerformed)
                .chassisNumber(chassisNumber)
                .renavan(renavan)
                .documentationExpiryDate(docDate)
                .documentationStatus(docStatus)
                .documentationDaysRemaining(docDaysRemaining)
                .insuranceExpiryDate(insuranceDate)
                .insuranceStatus(insuranceStatus)
                .insuranceDaysRemaining(insuranceDaysRemaining)
                .insuranceCompany(insuranceCompany)
                .insurancePolicyNumber(insurancePolicyNumber)
                .lastFuelDate(lastFuelDate)
                .lastFuelLiters(lastFuelLiters)
                .lastFuelCost(lastFuelCost)
                .lastFuelStation(lastFuelStation)
                .lastFuelType(lastFuelType)
                .lastFuelMileage(lastFuelMileage)
                .lastRouteCode(lastRouteCode)
                .lastRouteName(lastRouteName)
                .lastTripDate(lastTripDate)
                .lastTripStartTime(lastTripStartTime)
                .lastTripEndTime(lastTripEndTime)
                .lastTripDriverName(lastTripDriverName)
                .lastTripInitialKm(lastTripInitialKm)
                .lastTripFinalKm(lastTripFinalKm)
                .lastTripStatus(lastTripStatus)
                .isAggregated(isAggregated)
                .aggregatedOwnerName(aggOwnerName)
                .aggregatedOwnerCpfCnpj(aggOwnerCpfCnpj)
                .aggregatedOwnerPhone(aggOwnerPhone)
                .aggregatedOwnerEmail(aggOwnerEmail)
                .aggregatedDailyRate(aggDailyRate)
                .aggregatedMonthlyRate(aggMonthlyRate)
                .aggregatedPaymentType(aggPaymentType)
                .aggregatedContractStartDate(aggStartDate)
                .aggregatedContractEndDate(aggEndDate)
                .aggregatedNotes(aggNotes)
                .currentLocation(currentLocation)
                .currentLatitude(currentLatitude)
                .currentLongitude(currentLongitude)
                .preventiveOverdueCount(overdueCount)
                .preventiveUpcomingCount(upcomingCount)
                .preventiveAlertsSummary(preventiveSummary)
                .preventiveItems(preventiveItems)
                .qrCodeText(qrPayload)
                .qrCodeImageUrl("/api/vehicles/" + vehicle.getId() + "/qrcode/image")
                .generatedAt(LocalDateTime.now())
                .build();
    }

    @Transactional(readOnly = true)
    public VehicleQRCodeDTO getVehicleQRCodeDataByPlate(String plate) {
        String cleanPlate = plate != null ? plate.replaceAll("[^a-zA-Z0-9]", "").toUpperCase() : "";
        Vehicle vehicle = vehicleRepository.findByPlate(cleanPlate)
                .or(() -> vehicleRepository.findByPlateRaw(cleanPlate))
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com placa: " + plate));
        return getVehicleQRCodeData(vehicle.getId());
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

