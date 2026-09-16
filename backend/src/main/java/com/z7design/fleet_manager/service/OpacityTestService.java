package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.OpacityTest;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.OpacityTestRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PRD 1.0 - MÓDULO 4 (RF-04.3): Laudo de Fumaça Preta / Opacidade.
 * Agendamento e registro mensal da medição (Escala Ringelmann) para 100%
 * dos veículos em operação na mina.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OpacityTestService {

    private final OpacityTestRepository repository;
    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public List<OpacityTest> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public OpacityTest findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laudo de opacidade não encontrado com ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<OpacityTest> findByVehicle(UUID vehicleId) {
        return repository.findByVehicleIdOrderByTestDateDesc(vehicleId);
    }

    @Transactional(readOnly = true)
    public List<OpacityTest> findByPeriod(LocalDate start, LocalDate end) {
        return repository.findByTestDateBetweenOrderByTestDateAsc(start, end);
    }

    /**
     * Registra a medição mensal de fumaça preta de um veículo.
     * Único por veículo/mês (constraint), resultado derivado da escala Ringelmann.
     */
    @Transactional
    public OpacityTest create(OpacityTest test) {
        if (test.getRingelmannScale() == null || test.getRingelmannScale() < 0 || test.getRingelmannScale() > 5) {
            throw new IllegalArgumentException("Escala Ringelmann deve estar entre 0 e 5");
        }
        if (test.getTestDate() == null) {
            test.setTestDate(LocalDate.now());
        }

        // Vincula veículo e copia a placa
        if (test.getVehicle() != null && test.getVehicle().getId() != null) {
            Vehicle vehicle = vehicleRepository.findById(test.getVehicle().getId()).orElse(null);
            test.setVehicle(vehicle);
            if (vehicle != null) {
                test.setVehiclePlate(vehicle.getPlate());
            }
        }
        if (test.getVehiclePlate() == null || test.getVehiclePlate().isBlank()) {
            throw new IllegalArgumentException("Placa do veículo é obrigatória");
        }

        test.computeResult();
        OpacityTest saved = repository.save(test);
        log.info("Fumaça preta registrada: veículo {} — Ringelmann {} ({})",
                saved.getVehiclePlate(), saved.getRingelmannScale(), saved.getResult());
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Laudo de opacidade não encontrado com ID: " + id);
        }
        repository.deleteById(id);
    }

    /**
     * Cobertura mensal: verifica quais veículos possuem laudo no mês de referência.
     * PRD exige medição para 100% dos veículos em operação na mina.
     *
     * @return mapa com resumo da cobertura + lista de veículos pendentes
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyCoverage(YearMonth month) {
        LocalDate start = month.atDay(1);
        LocalDate end = month.atEndOfMonth();

        List<Vehicle> activeVehicles = vehicleRepository.findAll().stream()
                .filter(v -> !"INACTIVE".equalsIgnoreCase(String.valueOf(v.getStatus()))
                        && !"Em Manutenção".equalsIgnoreCase(String.valueOf(v.getStatus())))
                .toList();

        List<UUID> testedVehicleIds = repository.findByTestDateBetweenOrderByTestDateAsc(start, end).stream()
                .map(OpacityTest::getVehicle)
                .filter(v -> v != null)
                .map(Vehicle::getId)
                .collect(Collectors.toList());

        List<Vehicle> pending = activeVehicles.stream()
                .filter(v -> !testedVehicleIds.contains(v.getId()))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("referenceMonth", month.toString());
        result.put("activeVehicles", activeVehicles.size());
        result.put("testedVehicles", activeVehicles.size() - pending.size());
        result.put("coveragePct", activeVehicles.isEmpty() ? 100.0
                : Math.round((activeVehicles.size() - pending.size()) * 1000.0 / activeVehicles.size()) / 10.0);
        result.put("pendingVehicles", pending.stream()
                .map(v -> Map.of("id", v.getId().toString(), "plate", v.getPlate()))
                .collect(Collectors.toList()));
        return result;
    }
}
