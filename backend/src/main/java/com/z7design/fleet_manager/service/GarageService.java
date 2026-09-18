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
        vehicle.setGarageId(garage.getId());
        vehicle.setGarageName(garage.getName());
        vehicleRepository.save(vehicle);

        // Registra no histórico quando o veículo vinha de outra garagem
        if (fromGarage == null || !fromGarage.getId().equals(garage.getId())) {
            movementRepository.save(GarageMovement.builder()
                    .vehicle(vehicle)
                    .vehiclePlate(vehicle.getPlate())
                    .fromGarage(fromGarage)
                    .fromGarageName(fromGarage != null ? fromGarage.getName() : null)
                    .toGarage(garage)
                    .toGarageName(garage.getName())
                    .reason(GarageMovement.Reason.REMANEJAMENTO.name())
                    .kmReading(vehicle.getCurrentMileage())
                    .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                    .build());
        }

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

    /** Remove o veículo da garagem. */
    @Transactional
    public GarageDTO unassignVehicle(UUID garageId, UUID vehicleId, UUID companyId) {
        findScoped(garageId, companyId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado: " + vehicleId));
        vehicle.setGarageId(null);
        vehicleRepository.save(vehicle);
        return GarageDTO.fromEntity(findScoped(garageId, companyId), vehicleRepository.findByGarageId(garageId));
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
