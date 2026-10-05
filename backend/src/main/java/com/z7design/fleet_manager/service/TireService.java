package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.warehouse.TireDismountRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.TireMountRequestDTO;
import com.z7design.fleet_manager.dto.warehouse.VehicleTireChassisDTO;
import com.z7design.fleet_manager.model.*;
import com.z7design.fleet_manager.model.enums.TireMovementType;
import com.z7design.fleet_manager.model.enums.TireStatus;
import com.z7design.fleet_manager.model.enums.WarehouseMovementType;
import com.z7design.fleet_manager.repository.TireMovementRepository;
import com.z7design.fleet_manager.repository.TireRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.WarehouseMovementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TireService {

    private final TireRepository tireRepository;
    private final TireMovementRepository movementRepository;
    private final VehicleRepository vehicleRepository;
    private final WarehouseMovementRepository warehouseMovementRepository;

    public List<Tire> findAll() {
        return tireRepository.findAll();
    }

    public List<Tire> findByCompanyId(UUID companyId) {
        if (companyId == null) {
            return tireRepository.findAll();
        }
        return tireRepository.findByCompanyId(companyId);
    }

    public List<Tire> findAvailable(UUID companyId) {
        if (companyId == null) {
            return tireRepository.findAll().stream()
                    .filter(t -> t.getStatus() == TireStatus.AVAILABLE)
                    .toList();
        }
        return tireRepository.findByCompanyIdAndStatus(companyId, TireStatus.AVAILABLE);
    }

    public Tire findById(UUID id) {
        return tireRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Pneu não encontrado com ID: " + id));
    }

    @Transactional
    public Tire save(Tire tire) {
        return tireRepository.save(tire);
    }

    /**
     * Monta o pneu no eixo e posição do veículo da frota.
     */
    @Transactional
    public Tire mountTire(TireMountRequestDTO req, UUID companyId, UUID userId) {
        Tire tire = findById(req.getTireId());
        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new NoSuchElementException("Veículo não encontrado com ID: " + req.getVehicleId()));

        // Verifica se a posição já está ocupada por outro pneu
        Optional<Tire> existingTire = tireRepository.findByVehicleIdAndAxleNumberAndPositionIndex(
                vehicle.getId(), req.getAxleNumber(), req.getPositionIndex());
        if (existingTire.isPresent() && !existingTire.get().getId().equals(tire.getId())) {
            throw new IllegalStateException("A posição " + req.getPositionCode() + " já está ocupada pelo pneu " +
                    existingTire.get().getSerialNumber() + ". Desmonte o pneu atual primeiro.");
        }

        tire.setStatus(TireStatus.IN_USE);
        tire.setVehicleId(vehicle.getId());
        tire.setAxleNumber(req.getAxleNumber());
        tire.setPositionIndex(req.getPositionIndex());
        tire.setInstallKm(req.getCurrentVehicleKm() != null ? req.getCurrentVehicleKm() : 0);
        tire.setInstallDate(LocalDateTime.now());
        if (req.getTreadDepthMm() != null) {
            tire.setCurrentTreadDepth(req.getTreadDepthMm());
        }

        Tire savedTire = tireRepository.save(tire);

        // Movimento de auditoria de Pneus
        TireMovement movement = new TireMovement();
        movement.setTireId(tire.getId());
        movement.setVehicleId(vehicle.getId());
        movement.setType(TireMovementType.INSTALLATION);
        movement.setAxleNumber(req.getAxleNumber());
        movement.setPositionIndex(req.getPositionIndex());
        movement.setMileage(req.getCurrentVehicleKm() != null ? req.getCurrentVehicleKm() : 0);
        movement.setNotes(req.getNotes() != null ? req.getNotes() : "Montagem no veículo " + vehicle.getPlate() + " - Posição " + req.getPositionCode());
        movement.setMovementDate(LocalDateTime.now());
        movementRepository.save(movement);

        // Movimento no Almoxarifado Operacional
        if (tire.getProduct() != null) {
            WarehouseMovement whMov = WarehouseMovement.builder()
                    .companyId(companyId != null ? companyId : vehicle.getCompanyId())
                    .product(tire.getProduct())
                    .movementType(WarehouseMovementType.INSTALACAO_VEICULO)
                    .quantity(BigDecimal.ONE)
                    .vehicle(vehicle)
                    .tireId(tire.getId())
                    .performedByUserId(userId)
                    .notes("Pneu " + tire.getSerialNumber() + " montado no veículo " + vehicle.getPlate() + " (" + req.getPositionCode() + ")")
                    .build();
            warehouseMovementRepository.save(whMov);
        }

        return savedTire;
    }

    /**
     * Desmonta/remove o pneu calculando o KM rodado na etapa e recalculando o CPK.
     */
    @Transactional
    public Tire dismountTire(TireDismountRequestDTO req, UUID companyId, UUID userId) {
        Tire tire = findById(req.getTireId());
        if (tire.getStatus() != TireStatus.IN_USE) {
            throw new IllegalStateException("O pneu precisa estar em uso para ser desmontado. Status atual: " + tire.getStatus());
        }

        UUID prevVehicleId = tire.getVehicleId();
        Vehicle vehicle = prevVehicleId != null ? vehicleRepository.findById(prevVehicleId).orElse(null) : null;

        int kmInstalled = tire.getInstallKm() != null ? tire.getInstallKm() : 0;
        int currentKm = req.getCurrentVehicleKm() != null ? req.getCurrentVehicleKm() : kmInstalled;
        int kmCycle = Math.max(0, currentKm - kmInstalled);

        int totalKm = (tire.getCurrentMileage() != null ? tire.getCurrentMileage() : 0) + kmCycle;
        tire.setCurrentMileage(totalKm);

        if (req.getTreadDepthMm() != null) {
            tire.setCurrentTreadDepth(req.getTreadDepthMm());
        }

        // Recálculo do CPK = (Custo Aquisição + Custos de Reforma) / Total KM
        BigDecimal acquisition = tire.getAcquisitionCost() != null ? tire.getAcquisitionCost() : BigDecimal.ZERO;
        BigDecimal repairs = tire.getTotalRepairCost() != null ? tire.getTotalRepairCost() : BigDecimal.ZERO;
        BigDecimal totalCost = acquisition.add(repairs);

        if (totalKm > 0) {
            tire.setCpk(totalCost.divide(BigDecimal.valueOf(totalKm), 4, RoundingMode.HALF_UP));
        }

        // Define novo status
        String reason = req.getRemovalReason() != null ? req.getRemovalReason() : "ESTOQUE";
        WarehouseMovementType whType = WarehouseMovementType.REMOCAO_VEICULO;
        if ("ENVIAR_REFORMA".equalsIgnoreCase(reason)) {
            tire.setStatus(TireStatus.RECAP);
            whType = WarehouseMovementType.ENVIO_REFORMA;
        } else if ("DESCARTE_SUCATA".equalsIgnoreCase(reason)) {
            tire.setStatus(TireStatus.SCRAPPED);
            whType = WarehouseMovementType.SUCATA_DESCARTE;
        } else {
            tire.setStatus(TireStatus.AVAILABLE);
        }

        tire.setVehicleId(null);
        tire.setAxleNumber(null);
        tire.setPositionIndex(null);

        Tire savedTire = tireRepository.save(tire);

        // Registro de movimentação no histórico do pneu
        TireMovement movement = new TireMovement();
        movement.setTireId(tire.getId());
        movement.setVehicleId(prevVehicleId);
        movement.setType(TireMovementType.REMOVAL);
        movement.setMileage(currentKm);
        movement.setNotes(req.getNotes() != null ? req.getNotes() : "Removido por motivo: " + reason + " (Rodou " + kmCycle + " KM)");
        movement.setMovementDate(LocalDateTime.now());
        movementRepository.save(movement);

        // Registro no ledger do almoxarifado
        if (tire.getProduct() != null) {
            WarehouseMovement whMov = WarehouseMovement.builder()
                    .companyId(companyId != null ? companyId : tire.getCompanyId())
                    .product(tire.getProduct())
                    .movementType(whType)
                    .quantity(BigDecimal.ONE)
                    .vehicle(vehicle)
                    .tireId(tire.getId())
                    .performedByUserId(userId)
                    .notes("Pneu " + tire.getSerialNumber() + " removido. " + kmCycle + " KM rodados. Motivo: " + reason)
                    .build();
            warehouseMovementRepository.save(whMov);
        }

        return savedTire;
    }

    /**
     * Mapeia o chassi do veículo com todos os pneus montados em cada posição.
     */
    public VehicleTireChassisDTO getVehicleChassis(UUID vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new NoSuchElementException("Veículo não encontrado com ID: " + vehicleId));

        List<Tire> mountedTires = tireRepository.findByVehicleId(vehicleId);
        Map<String, Tire> tireByPos = new HashMap<>();
        for (Tire t : mountedTires) {
            String key = t.getAxleNumber() + "-" + t.getPositionIndex();
            tireByPos.put(key, t);
        }

        // Padrão 4x2 com 6 pneus + estepe
        List<VehicleTireChassisDTO.MountedPositionDTO> positions = new ArrayList<>();

        // Eixo 1 (Direcional)
        positions.add(VehicleTireChassisDTO.MountedPositionDTO.builder()
                .positionCode("DE")
                .axleNumber(1)
                .positionIndex(0)
                .positionName("Dianteiro Esquerdo")
                .tire(tireByPos.get("1-0"))
                .build());

        positions.add(VehicleTireChassisDTO.MountedPositionDTO.builder()
                .positionCode("DD")
                .axleNumber(1)
                .positionIndex(1)
                .positionName("Dianteiro Direito")
                .tire(tireByPos.get("1-1"))
                .build());

        // Eixo 2 (Tração Dupla)
        positions.add(VehicleTireChassisDTO.MountedPositionDTO.builder()
                .positionCode("TOE")
                .axleNumber(2)
                .positionIndex(0)
                .positionName("Tração Externo Esquerdo")
                .tire(tireByPos.get("2-0"))
                .build());

        positions.add(VehicleTireChassisDTO.MountedPositionDTO.builder()
                .positionCode("TIE")
                .axleNumber(2)
                .positionIndex(1)
                .positionName("Tração Interno Esquerdo")
                .tire(tireByPos.get("2-1"))
                .build());

        positions.add(VehicleTireChassisDTO.MountedPositionDTO.builder()
                .positionCode("TID")
                .axleNumber(2)
                .positionIndex(2)
                .positionName("Tração Interno Direito")
                .tire(tireByPos.get("2-2"))
                .build());

        positions.add(VehicleTireChassisDTO.MountedPositionDTO.builder()
                .positionCode("TOD")
                .axleNumber(2)
                .positionIndex(3)
                .positionName("Tração Externo Direito")
                .tire(tireByPos.get("2-3"))
                .build());

        // Estepe
        positions.add(VehicleTireChassisDTO.MountedPositionDTO.builder()
                .positionCode("ESTEPE")
                .axleNumber(0)
                .positionIndex(0)
                .positionName("Estepe")
                .tire(tireByPos.get("0-0"))
                .build());

        return VehicleTireChassisDTO.builder()
                .vehicleId(vehicle.getId())
                .plate(vehicle.getPlate())
                .model(vehicle.getModel())
                .chassiType("4x2")
                .currentKm(0)
                .positions(positions)
                .build();
    }

    @Transactional
    public TireMovement registerMovement(TireMovement movement) {
        Tire tire = findById(movement.getTireId());

        switch (movement.getType()) {
            case INSTALLATION:
                tire.setStatus(TireStatus.IN_USE);
                tire.setVehicleId(movement.getVehicleId());
                tire.setAxleNumber(movement.getAxleNumber());
                tire.setPositionIndex(movement.getPositionIndex());
                break;
            case REMOVAL:
                tire.setStatus(TireStatus.AVAILABLE);
                tire.setVehicleId(null);
                tire.setAxleNumber(null);
                tire.setPositionIndex(null);
                break;
            case RECAP_SEND:
                tire.setStatus(TireStatus.RECAP);
                break;
            case RECAP_RETURN:
                tire.setStatus(TireStatus.AVAILABLE);
                tire.setRecapCount(tire.getRecapCount() != null ? tire.getRecapCount() + 1 : 1);
                break;
            case SCRAP:
                tire.setStatus(TireStatus.SCRAPPED);
                tire.setVehicleId(null);
                break;
            default:
                break;
        }

        tireRepository.save(tire);
        return movementRepository.save(movement);
    }

    public List<TireMovement> getHistory(UUID tireId) {
        return movementRepository.findByTireIdOrderByMovementDateDesc(tireId);
    }

    @Transactional
    public void delete(UUID id) {
        tireRepository.deleteById(id);
    }
}
