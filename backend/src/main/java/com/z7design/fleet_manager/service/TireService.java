package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Tire;
import com.z7design.fleet_manager.model.TireMovement;
import com.z7design.fleet_manager.model.enums.TireStatus;
import com.z7design.fleet_manager.repository.TireMovementRepository;
import com.z7design.fleet_manager.repository.TireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TireService {

    private final TireRepository tireRepository;
    private final TireMovementRepository movementRepository;

    public List<Tire> findAll() {
        return tireRepository.findAll();
    }

    public Tire findById(UUID id) {
        return tireRepository.findById(id).orElseThrow(() -> new RuntimeException("Pneu não encontrado"));
    }

    @Transactional
    public Tire save(Tire tire) {
        return tireRepository.save(tire);
    }

    @Transactional
    public TireMovement registerMovement(TireMovement movement) {
        Tire tire = findById(movement.getTireId());

        // Atualizar status do pneu baseado no movimento
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
                tire.setRecapCount(tire.getRecapCount() + 1);
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
