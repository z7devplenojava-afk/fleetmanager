package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.GarageDTO;
import com.z7design.fleet_manager.dto.GarageMovementDTO;
import com.z7design.fleet_manager.dto.GarageOccupancyDashboardDTO;
import com.z7design.fleet_manager.dto.GarageTransferRequest;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.model.Garage;
import com.z7design.fleet_manager.model.GarageMovement;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.EmployeeRepository;
import com.z7design.fleet_manager.repository.GarageMovementRepository;
import com.z7design.fleet_manager.repository.GarageRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Cadastro e gestão de garagens (pátios/bases).
 * <ul>
 *   <li>CRUD com responsável por garagem;</li>
 *   <li>Contagem e listagem dos veículos alocados por garagem;</li>
 *   <li>Auto-cadastro de garagem a partir do nome livre usado no veículo
 *       (vehicle.garageName) para garantir integridade referencial.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GarageService {

    private final GarageRepository garageRepository;
    private final GarageMovementRepository movementRepository;
    private final VehicleRepository vehicleRepository;
    private final EmployeeRepository employeeRepository;

    // ==================== LEITURA ====================

    public List<GarageDTO> list(UUID companyId) {
        return garageRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .map(g -> GarageDTO.fromEntity(g, vehicleRepository.findByGarageId(g.getId())))
                .toList();
    }

    /** Todas as garagens ativas com ocupação calculada (usado pelo scheduler de alertas). */
    @Transactional(readOnly = true)
    public List<GarageDTO> listAllForAlerting() {
        return garageRepository.findByActiveTrue().stream()
                .map(g -> GarageDTO.fromEntity(g, vehicleRepository.findByGarageId(g.getId())))
                .toList();
    }

    /**
     * Dashboard de ocupação: resumo consolidado + situação de cada garagem com
     * alertas de lotação (>= 90% = atenção, 100% = lotada).
     */
    @Transactional(readOnly = true)
    public GarageOccupancyDashboardDTO getOccupancyDashboard(UUID companyId) {
        List<GarageDTO> garages = list(companyId);

        long totalVehicles = garages.stream().mapToLong(g -> g.getVehicleCount() != null ? g.getVehicleCount() : 0).sum();
        long totalCapacity = garages.stream()
                .mapToLong(g -> g.getCapacity() != null ? g.getCapacity() : 0).sum();
        long garagesWithCapacity = garages.stream().filter(g -> g.getCapacity() != null && g.getCapacity() > 0).count();
        long fullGarages = garages.stream().filter(g -> Boolean.TRUE.equals(g.getAtCapacity())).count();
        long nearCapacityGarages = garages.stream()
                .filter(g -> Boolean.TRUE.equals(g.getNearCapacity()) && !Boolean.TRUE.equals(g.getAtCapacity())).count();

        Double overallOccupancy = null;
        if (totalCapacity > 0) {
            overallOccupancy = Math.min(100.0, Math.round(totalVehicles * 1000.0 / totalCapacity) / 10.0);
        }

        Map<String, Long> fleetStatusTotals = new java.util.HashMap<>();
        garages.stream()
                .map(GarageDTO::getStatusBreakdown)
                .filter(m -> m != null)
                .forEach(m -> m.forEach((k, v) -> fleetStatusTotals.merge(k, v, Long::sum)));

        return GarageOccupancyDashboardDTO.builder()
                .garages(garages)
                .totalGarages(garages.size())
                .totalVehicles(totalVehicles)
                .totalCapacity(totalCapacity)
                .overallOccupancy(overallOccupancy)
                .garagesWithCapacity(garagesWithCapacity)
                .fullGarages(fullGarages)
                .nearCapacityGarages(nearCapacityGarages)
                .fleetStatusTotals(fleetStatusTotals)
                .build();
    }

    public GarageDTO getById(UUID id, UUID companyId) {
        Garage garage = findScoped(id, companyId);
        return GarageDTO.fromEntity(garage, vehicleRepository.findByGarageId(id));
    }

    // ==================== CRIAÇÃO / EDIÇÃO ====================

    @Transactional
    public GarageDTO create(GarageDTO dto, UUID companyId) {
        Garage garage = Garage.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .responsibleEmployee(dto.getResponsibleEmployeeId() != null
                        ? employeeRepository.findById(dto.getResponsibleEmployeeId()).orElse(null) : null)
                .responsibleName(dto.getResponsibleName())
                .responsiblePhone(dto.getResponsiblePhone())
                .capacity(dto.getCapacity())
                .notes(dto.getNotes())
                .companyId(companyId)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();
        garage = garageRepository.save(garage);
        log.info("Garagem criada: id={}, nome={}", garage.getId(), garage.getName());
        return GarageDTO.fromEntity(garage, List.of());
    }

    @Transactional
    public GarageDTO update(UUID id, GarageDTO dto, UUID companyId) {
        Garage garage = findScoped(id, companyId);
        if (dto.getName() != null) garage.setName(dto.getName());
        garage.setAddress(dto.getAddress());
        if (dto.getResponsibleEmployeeId() != null) {
            Employee employee = employeeRepository.findById(dto.getResponsibleEmployeeId()).orElse(null);
            garage.setResponsibleEmployee(employee);
            garage.setResponsibleName(employee != null ? employee.getName() : dto.getResponsibleName());
        } else {
            garage.setResponsibleEmployee(null);
            garage.setResponsibleName(dto.getResponsibleName());
        }
        garage.setResponsiblePhone(dto.getResponsiblePhone());
        garage.setCapacity(dto.getCapacity());
        garage.setNotes(dto.getNotes());
        if (dto.getActive() != null) garage.setActive(dto.getActive());
        garage = garageRepository.save(garage);
        log.info("Garagem atualizada: id={}", id);
        return GarageDTO.fromEntity(garage, vehicleRepository.findByGarageId(id));
    }

    @Transactional
    public void delete(UUID id, UUID companyId) {
        Garage garage = findScoped(id, companyId);
        garage.setActive(false);
        garageRepository.save(garage);
        log.info("Garagem desativada: id={}", id);
    }

    // ==================== GARAGEM DE UM VEÍCULO ====================

    /** Garagem atual do veículo (por garage_id; fallback: cria/usa pelo garageName). */
    @Transactional
    public GarageDTO resolveVehicleGarage(UUID vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado: " + vehicleId));
        if (vehicle.getGarageId() != null) {
            return garageRepository.findById(vehicle.getGarageId())
                    .map(g -> GarageDTO.fromEntity(g, vehicleRepository.findByGarageId(g.getId())))
                    .orElse(null);
        }
        if (vehicle.getGarageName() != null && !vehicle.getGarageName().isBlank()) {
            Garage garage = getOrCreateByName(vehicle.getGarageName(), vehicle.getCompanyId());
            vehicle.setGarageId(garage.getId());
            vehicleRepository.save(vehicle);
            return GarageDTO.fromEntity(garage, vehicleRepository.findByGarageId(garage.getId()));
        }
        return null;
    }

    /** Aloca o veículo em uma garagem (bloqueia quando lotada). */
    @Transactional
    public GarageDTO assignVehicle(UUID garageId, UUID vehicleId, UUID companyId) {
        Garage garage = findScoped(garageId, companyId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado: " + vehicleId));
        validateHasCapacity(garage, vehicle.getId());
        Garage fromGarage = vehicle.getGarageId() != null
                ? garageRepository.findById(vehicle.getGarageId()).orElse(null)
                : null;

        // Se havia uma estadia ativa anterior, encerra
        movementRepository.findFirstByVehicleIdAndActiveStayTrueOrderByCreatedAtDesc(vehicle.getId())
                .ifPresent(prev -> {
                    prev.setActiveStay(false);
                    prev.setExitTime(LocalDateTime.now());
                    if (prev.getEntryTime() != null) {
                        prev.setStayDurationMinutes(Math.max(0, java.time.Duration.between(prev.getEntryTime(), prev.getExitTime()).toMinutes()));
                    }
                    movementRepository.save(prev);
                });

        vehicle.setGarageId(garage.getId());
        vehicle.setGarageName(garage.getName());
        vehicleRepository.save(vehicle);

        String client = vehicle.getProjectName() != null && !vehicle.getProjectName().isBlank()
                ? vehicle.getProjectName()
                : (vehicle.getOperationName() != null ? vehicle.getOperationName() : "Reserva Operacional");

        movementRepository.save(GarageMovement.builder()
                .vehicle(vehicle)
                .vehiclePlate(vehicle.getPlate())
                .movementType(fromGarage != null ? "TRANSFER" : "CHECK_IN")
                .fromGarage(fromGarage)
                .fromGarageName(fromGarage != null ? fromGarage.getName() : null)
                .toGarage(garage)
                .toGarageName(garage.getName())
                .driverName(vehicle.getAssignedDriver())
                .clientName(client)
                .entryTime(LocalDateTime.now())
                .activeStay(true)
                .reason(fromGarage != null ? GarageMovement.Reason.REMANEJAMENTO.name() : "RECOLHIMENTO")
                .kmReading(vehicle.getCurrentMileage())
                .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                .build());

        log.info("Veículo {} alocado na garagem {}", vehicle.getPlate(), garage.getName());
        return GarageDTO.fromEntity(garage, vehicleRepository.findByGarageId(garageId));
    }

    /**
     * Valida se a garagem tem vaga disponível. O próprio veículo é desconsiderado da
     * contagem (re-alocação/edição não deve bloquear). Lança BusinessException (HTTP 409)
     * quando a garagem está lotada — usado pela alocação, mobilização e cadastro de veículo.
     */
    public void validateHasCapacity(Garage garage, UUID incomingVehicleId) {
        if (garage == null || garage.getCapacity() == null || garage.getCapacity() <= 0) {
            return;
        }
        long occupied = vehicleRepository.findByGarageId(garage.getId()).stream()
                .filter(v -> incomingVehicleId == null || !incomingVehicleId.equals(v.getId()))
                .count();
        if (occupied >= garage.getCapacity()) {
            throw new BusinessException(String.format(
                    "A garagem %s está lotada (%d/%d vagas). Faça um remanejamento antes de alocar este veículo.",
                    garage.getName(), occupied, garage.getCapacity()));
        }
    }

    /** Remove o veículo da garagem (registra saída). */
    @Transactional
    public GarageDTO unassignVehicle(UUID garageId, UUID vehicleId, UUID companyId) {
        Garage garage = findScoped(garageId, companyId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado: " + vehicleId));

        LocalDateTime exit = LocalDateTime.now();

        movementRepository.findFirstByVehicleIdAndActiveStayTrueOrderByCreatedAtDesc(vehicle.getId())
                .ifPresent(active -> {
                    active.setActiveStay(false);
                    active.setExitTime(exit);
                    LocalDateTime start = active.getEntryTime() != null ? active.getEntryTime() : active.getCreatedAt();
                    if (start != null) {
                        active.setStayDurationMinutes(Math.max(0, java.time.Duration.between(start, exit).toMinutes()));
                    }
                    movementRepository.save(active);
                });

        movementRepository.save(GarageMovement.builder()
                .vehicle(vehicle)
                .vehiclePlate(vehicle.getPlate())
                .movementType("CHECK_OUT")
                .fromGarage(garage)
                .fromGarageName(garage.getName())
                .toGarage(null)
                .toGarageName("Saída do Pátio")
                .driverName(vehicle.getAssignedDriver())
                .clientName(vehicle.getProjectName())
                .exitTime(exit)
                .activeStay(false)
                .reason("OPERACAO")
                .kmReading(vehicle.getCurrentMileage())
                .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                .build());

        vehicle.setGarageId(null);
        vehicle.setGarageName(null);
        vehicleRepository.save(vehicle);
        return GarageDTO.fromEntity(garage, vehicleRepository.findByGarageId(garageId));
    }

    /** Check-in rápido com portaria/QR Code. */
    @Transactional
    public GarageMovementDTO checkInVehicle(com.z7design.fleet_manager.dto.GarageCheckInRequest request, UUID companyId, User currentUser) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado: " + request.getVehicleId()));
        Garage destGarage = findScoped(request.getGarageId(), companyId);
        validateHasCapacity(destGarage, vehicle.getId());

        LocalDateTime now = LocalDateTime.now();

        // Encerra estadia anterior se houver
        movementRepository.findFirstByVehicleIdAndActiveStayTrueOrderByCreatedAtDesc(vehicle.getId())
                .ifPresent(prev -> {
                    prev.setActiveStay(false);
                    prev.setExitTime(now);
                    if (prev.getEntryTime() != null) {
                        prev.setStayDurationMinutes(Math.max(0, java.time.Duration.between(prev.getEntryTime(), now).toMinutes()));
                    }
                    movementRepository.save(prev);
                });

        Garage fromGarage = vehicle.getGarageId() != null
                ? garageRepository.findById(vehicle.getGarageId()).orElse(null) : null;

        vehicle.setGarageId(destGarage.getId());
        vehicle.setGarageName(destGarage.getName());
        if (request.getKmReading() != null && request.getKmReading() > 0) {
            vehicle.setCurrentMileage(request.getKmReading());
        }
        if (request.getDriverName() != null && !request.getDriverName().isBlank()) {
            vehicle.setAssignedDriver(request.getDriverName().trim());
        }
        vehicleRepository.save(vehicle);

        LocalDateTime entry = request.getEntryTime() != null ? request.getEntryTime() : now;
        String reason = request.getReason() != null && !request.getReason().isBlank() ? request.getReason() : "RECOLHIMENTO";
        String driver = request.getDriverName() != null && !request.getDriverName().isBlank()
                ? request.getDriverName().trim() : vehicle.getAssignedDriver();
        String client = request.getClientName() != null && !request.getClientName().isBlank()
                ? request.getClientName().trim()
                : (vehicle.getProjectName() != null ? vehicle.getProjectName() : "Reserva Operacional");

        GarageMovement movement = GarageMovement.builder()
                .vehicle(vehicle)
                .vehiclePlate(vehicle.getPlate())
                .movementType("CHECK_IN")
                .fromGarage(fromGarage)
                .fromGarageName(fromGarage != null ? fromGarage.getName() : null)
                .toGarage(destGarage)
                .toGarageName(destGarage.getName())
                .driverName(driver)
                .clientName(client)
                .entryTime(entry)
                .activeStay(true)
                .reason(reason)
                .reasonDetail(request.getReasonDetail())
                .performedBy(currentUser != null ? currentUser.getId() : null)
                .performedByName(currentUser != null ? currentUser.getName() : null)
                .kmReading(request.getKmReading() != null ? request.getKmReading() : vehicle.getCurrentMileage())
                .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                .build();
        movement = movementRepository.save(movement);
        log.info("Check-in: veículo {} na garagem {}", vehicle.getPlate(), destGarage.getName());
        return GarageMovementDTO.fromEntity(movement);
    }

    /** Check-out rápido com portaria/QR Code. */
    @Transactional
    public GarageMovementDTO checkOutVehicle(com.z7design.fleet_manager.dto.GarageCheckOutRequest request, UUID companyId, User currentUser) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado: " + request.getVehicleId()));

        Garage fromGarage = vehicle.getGarageId() != null
                ? garageRepository.findById(vehicle.getGarageId()).orElse(null) : null;
        String fromGarageName = fromGarage != null ? fromGarage.getName() : vehicle.getGarageName();

        LocalDateTime exit = request.getExitTime() != null ? request.getExitTime() : LocalDateTime.now();

        // Encerra a estadia ativa no histórico
        movementRepository.findFirstByVehicleIdAndActiveStayTrueOrderByCreatedAtDesc(vehicle.getId())
                .ifPresent(active -> {
                    active.setActiveStay(false);
                    active.setExitTime(exit);
                    LocalDateTime start = active.getEntryTime() != null ? active.getEntryTime() : active.getCreatedAt();
                    if (start != null) {
                        active.setStayDurationMinutes(Math.max(0, java.time.Duration.between(start, exit).toMinutes()));
                    }
                    movementRepository.save(active);
                });

        vehicle.setGarageId(null);
        vehicle.setGarageName(null);
        if (request.getKmReading() != null && request.getKmReading() > 0) {
            vehicle.setCurrentMileage(request.getKmReading());
        }
        if (request.getDriverName() != null && !request.getDriverName().isBlank()) {
            vehicle.setAssignedDriver(request.getDriverName().trim());
        }
        vehicleRepository.save(vehicle);

        String driver = request.getDriverName() != null && !request.getDriverName().isBlank()
                ? request.getDriverName().trim() : vehicle.getAssignedDriver();
        String client = vehicle.getProjectName() != null ? vehicle.getProjectName() : "Reserva Operacional";

        GarageMovement movement = GarageMovement.builder()
                .vehicle(vehicle)
                .vehiclePlate(vehicle.getPlate())
                .movementType("CHECK_OUT")
                .fromGarage(fromGarage)
                .fromGarageName(fromGarageName != null ? fromGarageName : "Pátio")
                .toGarage(null)
                .toGarageName("Saída para Operação")
                .driverName(driver)
                .clientName(client)
                .exitTime(exit)
                .activeStay(false)
                .reason(request.getReason() != null ? request.getReason() : "OPERACAO")
                .reasonDetail(request.getReasonDetail())
                .performedBy(currentUser != null ? currentUser.getId() : null)
                .performedByName(currentUser != null ? currentUser.getName() : null)
                .kmReading(request.getKmReading() != null ? request.getKmReading() : vehicle.getCurrentMileage())
                .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                .build();
        movement = movementRepository.save(movement);
        log.info("Check-out: veículo {} saiu do pátio {}", vehicle.getPlate(), fromGarageName);
        return GarageMovementDTO.fromEntity(movement);
    }

    /** Lista veículos atualmente dentro do pátio com tempo de permanência live. */
    @Transactional(readOnly = true)
    public List<GarageMovementDTO> listActiveStays(UUID companyId) {
        return movementRepository.findByCompanyIdAndActiveStayTrueOrderByCreatedAtDesc(companyId).stream()
                .map(GarageMovementDTO::fromEntity)
                .toList();
    }

    /**
     * Retorna uma garagem pelo nome (criando-a se necessário) — usado pela OS de frota,
     * mobilização e limpeza para garantir integridade referencial quando chega apenas
     * o nome da garagem.
     */
    @Transactional
    public Garage getOrCreateByName(String name, UUID companyId) {
        if (name == null || name.isBlank()) return null;
        String trimmed = name.trim();
        return garageRepository.findFirstByCompanyIdAndNameIgnoreCase(companyId, trimmed)
                .orElseGet(() -> {
                    Garage created = Garage.builder()
                            .name(trimmed)
                            .companyId(companyId)
                            .active(true)
                            .build();
                    Garage saved = garageRepository.save(created);
                    log.info("Garagem criada automaticamente a partir do nome: {}", trimmed);
                    return saved;
                });
    }

    // ==================== REMANEJAMENTO / HISTÓRICO ====================

    /**
     * Remanejamento de veículo entre garagens: valida capacidade da origem e destino,
     * realoca o veículo e registra a movimentação no histórico.
     */
    @Transactional
    public GarageMovementDTO transferVehicle(GarageTransferRequest request, UUID companyId, User currentUser) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado: " + request.getVehicleId()));
        Garage toGarage = findScoped(request.getToGarageId(), companyId);

        Garage fromGarage = vehicle.getGarageId() != null
                ? garageRepository.findById(vehicle.getGarageId()).orElse(null)
                : null;

        // Validações: destino lotado ou mesmo garagem de origem = destino
        validateHasCapacity(toGarage, vehicle.getId());
        if (fromGarage != null && fromGarage.getId().equals(toGarage.getId())) {
            throw new BusinessException("O veículo já está nesta garagem. Escolha um destino diferente para o remanejamento.");
        }

        String reason = request.getReason() != null && !request.getReason().isBlank()
                ? request.getReason() : GarageMovement.Reason.REMANEJAMENTO.name();

        // Realoca e grava o histórico
        vehicle.setGarageId(toGarage.getId());
        vehicle.setGarageName(toGarage.getName());
        vehicleRepository.save(vehicle);

        GarageMovement movement = GarageMovement.builder()
                .vehicle(vehicle)
                .vehiclePlate(vehicle.getPlate())
                .fromGarage(fromGarage)
                .fromGarageName(fromGarage != null ? fromGarage.getName() : null)
                .toGarage(toGarage)
                .toGarageName(toGarage.getName())
                .reason(reason)
                .reasonDetail(request.getReasonDetail())
                .performedBy(currentUser != null ? currentUser.getId() : null)
                .performedByName(currentUser != null ? currentUser.getName() : null)
                .kmReading(request.getKmReading() != null ? request.getKmReading() : vehicle.getCurrentMileage())
                .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                .build();
        movement = movementRepository.save(movement);
        log.info("Remanejamento: veículo {} de {} para {} (motivo: {}, por {})",
                vehicle.getPlate(),
                fromGarage != null ? fromGarage.getName() : "—",
                toGarage.getName(), reason,
                currentUser != null ? currentUser.getName() : "?");
        return GarageMovementDTO.fromEntity(movement);
    }

    /** Histórico paginado de movimentações da empresa. */
    @Transactional(readOnly = true)
    public List<GarageMovementDTO> listMovements(UUID companyId, int page, int size) {
        return movementRepository.findByCompanyIdOrderByCreatedAtDesc(companyId,
                        org.springframework.data.domain.PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100)))
                .getContent().stream()
                .map(GarageMovementDTO::fromEntity)
                .toList();
    }

    /** Histórico de movimentações de um veículo. */
    @Transactional(readOnly = true)
    public List<GarageMovementDTO> getVehicleMovements(UUID vehicleId) {
        return movementRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId).stream()
                .map(GarageMovementDTO::fromEntity)
                .toList();
    }

    /** Últimas chegadas em uma garagem. */
    @Transactional(readOnly = true)
    public List<GarageMovementDTO> getGarageArrivals(UUID garageId, int limit) {
        return movementRepository.findRecentArrivals(garageId,
                        org.springframework.data.domain.PageRequest.of(0, Math.min(Math.max(1, limit), 50)))
                .stream()
                .map(GarageMovementDTO::fromEntity)
                .toList();
    }

    /**
     * Registra uma movimentação no histórico (usado pela mobilização quando realoca
     * o veículo para a garagem de destino).
     */
    @Transactional
    public void recordMovement(Vehicle vehicle, Garage fromGarage, Garage toGarage,
                               String reason, UUID performedBy, String performedByName, UUID companyId) {
        if (vehicle == null || toGarage == null) return;
        movementRepository.save(GarageMovement.builder()
                .vehicle(vehicle)
                .vehiclePlate(vehicle.getPlate())
                .fromGarage(fromGarage)
                .fromGarageName(fromGarage != null ? fromGarage.getName() : null)
                .toGarage(toGarage)
                .toGarageName(toGarage.getName())
                .reason(reason)
                .performedBy(performedBy)
                .performedByName(performedByName)
                .kmReading(vehicle.getCurrentMileage())
                .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                .build());
        log.info("Movimentação registrada: veículo {} -> {} (motivo: {})",
                vehicle.getPlate(), toGarage.getName(), reason);
    }

    // ==================== SEED DE DEMONSTRAÇÃO ====================

    @Transactional
    public void seedGaragesAndVehicles(UUID companyId) {
        log.info("Executando seed de garagens para companyId: {}", companyId);

        // 1. Criar as 4 garagens se não existirem
        Garage gCentral = garageRepository.findFirstByCompanyIdAndNameIgnoreCase(companyId, "Pátio Central - Matriz Paulínia")
                .orElseGet(() -> garageRepository.save(Garage.builder()
                        .name("Pátio Central - Matriz Paulínia")
                        .address("Av. José Paulino, 2500 - Distrito Industrial, Paulínia - SP")
                        .responsibleName("Carlos Henrique de Souza")
                        .responsiblePhone("(11) 98765-4321")
                        .capacity(35)
                        .notes("Base principal com lavador automático, abastecimento próprio e portaria 24h.")
                        .companyId(companyId)
                        .active(true)
                        .build()));

        Garage gNorte = garageRepository.findFirstByCompanyIdAndNameIgnoreCase(companyId, "Pátio Norte - Base Mina do Sol")
                .orElseGet(() -> garageRepository.save(Garage.builder()
                        .name("Pátio Norte - Base Mina do Sol")
                        .address("Rodovia BR-381, Km 420 - Trevo de Apoio, Nova Lima - MG")
                        .responsibleName("Marcos Antônio Silveira")
                        .responsiblePhone("(31) 99888-7711")
                        .capacity(20)
                        .notes("Ponto de apoio e pernoite para operações de transporte de turno da mineração.")
                        .companyId(companyId)
                        .active(true)
                        .build()));

        Garage gSul = garageRepository.findFirstByCompanyIdAndNameIgnoreCase(companyId, "Base de Apoio & Oficina Sul")
                .orElseGet(() -> garageRepository.save(Garage.builder()
                        .name("Base de Apoio & Oficina Sul")
                        .address("Rua das Oficinas Mecânicas, 380 - Parque Industrial, Betim - MG")
                        .responsibleName("Roberto Fernandes Lima")
                        .responsiblePhone("(11) 97123-8899")
                        .capacity(12)
                        .notes("Pátio especializado em manutenção pesada, suspensão, freios e reformas.")
                        .companyId(companyId)
                        .active(true)
                        .build()));

        Garage gLeste = garageRepository.findFirstByCompanyIdAndNameIgnoreCase(companyId, "Garagem Expressa Leste")
                .orElseGet(() -> garageRepository.save(Garage.builder()
                        .name("Garagem Expressa Leste")
                        .address("Av. Presidente Dutra, Km 182 - Pátio Logístico, Belford Roxo - RJ")
                        .responsibleName("Fernando Dias Nogueira")
                        .responsiblePhone("(21) 98222-3344")
                        .capacity(8)
                        .notes("Estacionamento de apoio para rotas interestaduais e linhas executivas.")
                        .companyId(companyId)
                        .active(true)
                        .build()));

        // 2. Alocar veículos existentes ou criar novos para o pátio
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        if (allVehicles.size() >= 3) {
            // Alocar primeiros veículos existentes
            Vehicle v1 = allVehicles.get(0);
            v1.setGarageId(gCentral.getId());
            v1.setGarageName(gCentral.getName());
            if (v1.getAssignedDriver() == null) v1.setAssignedDriver("Marcos Vinicius Santos");
            if (v1.getProjectName() == null) v1.setProjectName("Prefeitura Municipal - Linha 304");
            vehicleRepository.save(v1);

            Vehicle v2 = allVehicles.get(1);
            v2.setGarageId(gSul.getId());
            v2.setGarageName(gSul.getName());
            v2.setStatus(Vehicle.VehicleStatus.MAINTENANCE);
            if (v2.getAssignedDriver() == null) v2.setAssignedDriver("José Roberto Ferreira");
            if (v2.getProjectName() == null) v2.setProjectName("Petrobras Transporte Industrial");
            vehicleRepository.save(v2);

            Vehicle v3 = allVehicles.get(2);
            v3.setGarageId(gNorte.getId());
            v3.setGarageName(gNorte.getName());
            if (v3.getAssignedDriver() == null) v3.setAssignedDriver("Antônio Carlos de Paula");
            if (v3.getProjectName() == null) v3.setProjectName("Mineração Vale - Turno Especial");
            vehicleRepository.save(v3);

            // Gerar movimentações de estadia ativa
            criarEstadiaSeNaoExistir(v1, gCentral, "Marcos Vinicius Santos", v1.getProjectName(), "RECOLHIMENTO", LocalDateTime.now().minusHours(5), companyId);
            criarEstadiaSeNaoExistir(v2, gSul, "José Roberto Ferreira", v2.getProjectName(), "MANUTENCAO", LocalDateTime.now().minusDays(3).minusHours(6), companyId);
            criarEstadiaSeNaoExistir(v3, gNorte, "Antônio Carlos de Paula", v3.getProjectName(), "ESCALA", LocalDateTime.now().minusHours(18), companyId);
        }

        log.info("Seed de garagens concluído com sucesso!");
    }

    private void criarEstadiaSeNaoExistir(Vehicle vehicle, Garage garage, String driver, String client, String reason, LocalDateTime entryTime, UUID companyId) {
        if (movementRepository.findFirstByVehicleIdAndActiveStayTrueOrderByCreatedAtDesc(vehicle.getId()).isEmpty()) {
            movementRepository.save(GarageMovement.builder()
                    .vehicle(vehicle)
                    .vehiclePlate(vehicle.getPlate())
                    .movementType("CHECK_IN")
                    .toGarage(garage)
                    .toGarageName(garage.getName())
                    .driverName(driver)
                    .clientName(client)
                    .entryTime(entryTime)
                    .activeStay(true)
                    .reason(reason)
                    .kmReading(vehicle.getCurrentMileage())
                    .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                    .createdAt(entryTime)
                    .build());
        }
    }

    // ==================== HELPERS ====================

    private Garage findScoped(UUID id, UUID companyId) {
        Garage garage = garageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Garagem não encontrada com ID: " + id));
        if (garage.getCompanyId() != null && companyId != null
                && !companyId.equals(garage.getCompanyId())) {
            throw new ResourceNotFoundException("Garagem não encontrada com ID: " + id);
        }
        return garage;
    }
}
