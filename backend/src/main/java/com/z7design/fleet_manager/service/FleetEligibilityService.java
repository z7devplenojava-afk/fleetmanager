package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleEligibilityDTO;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PRD 1.0 - MÓDULO 3 (RF-03.1): Alocação de Frota com Filtro de Elegibilidade.
 *
 * Valida se o veículo atende aos critérios do contrato:
 * idade máxima ≤ 5 anos, ar-condicionado, cinto em todos os assentos,
 * freio motor/retarder, câmera no condutor e telemetria.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FleetEligibilityService {

    private final VehicleRepository vehicleRepository;

    /** Idade máxima do veículo (anos) — PRD: ≤ 5 anos. */
    private static final int MAX_VEHICLE_AGE_YEARS = 5;

    /**
     * Valida a elegibilidade de um veículo contra os critérios do PRD.
     */
    @Transactional(readOnly = true)
    public VehicleEligibilityDTO checkVehicle(Vehicle vehicle) {
        VehicleEligibilityDTO dto = new VehicleEligibilityDTO();
        dto.setVehicleId(vehicle.getId());
        dto.setPlate(vehicle.getPlate());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());

        // Critério 1: idade máxima ≤ 5 anos
        Integer year = vehicle.getYear();
        int age = year != null ? LocalDate.now().getYear() - year : Integer.MAX_VALUE;
        dto.getCriteria().put("IDADE_MAX_5_ANOS",
                VehicleEligibilityDTO.CriterionResult.of(true, age <= MAX_VEHICLE_AGE_YEARS,
                        year != null ? age + " ano(s) (fabricação " + year + ")" : "ano de fabricação não informado"));

        // Critério 2: ar-condicionado
        dto.getCriteria().put("AR_CONDICIONADO",
                VehicleEligibilityDTO.CriterionResult.of(true,
                        Boolean.TRUE.equals(vehicle.getHasAirConditioning()),
                        Boolean.TRUE.equals(vehicle.getHasAirConditioning()) ? "Possui ar-condicionado" : "Sem ar-condicionado"));

        // Critério 3: cinto em todos os assentos
        dto.getCriteria().put("CINTO_TODOS_ASSENTOS",
                VehicleEligibilityDTO.CriterionResult.of(true,
                        Boolean.TRUE.equals(vehicle.getHasSeatBeltsAll()),
                        Boolean.TRUE.equals(vehicle.getHasSeatBeltsAll())
                                ? "Cinto em todos os assentos"
                                : "Cinto completo não confirmado no cadastro"));

        // Critério 4: freio motor/retarder
        dto.getCriteria().put("FREIO_MOTOR_RETARDER",
                VehicleEligibilityDTO.CriterionResult.of(true,
                        Boolean.TRUE.equals(vehicle.getHasRetarder()),
                        Boolean.TRUE.equals(vehicle.getHasRetarder())
                                ? "Possui freio motor/retarder"
                                : "Freio motor/retarder não confirmado"));

        // Critério 5: câmera no condutor
        dto.getCriteria().put("CAMERA_CONDUTOR",
                VehicleEligibilityDTO.CriterionResult.of(true,
                        Boolean.TRUE.equals(vehicle.getHasCamera()),
                        Boolean.TRUE.equals(vehicle.getHasCamera())
                                ? "Possui câmera no condutor"
                                : "Sem câmera no condutor"));

        // Critério 6: telemetria
        dto.getCriteria().put("TELEMETRIA",
                VehicleEligibilityDTO.CriterionResult.of(true,
                        Boolean.TRUE.equals(vehicle.getHasTelemetry()),
                        Boolean.TRUE.equals(vehicle.getHasTelemetry())
                                ? "Possui telemetria"
                                : "Sem telemetria"));

        // Consolidado
        boolean eligible = dto.getCriteria().values().stream().allMatch(VehicleEligibilityDTO.CriterionResult::isOk);
        dto.setEligible(eligible);
        dto.getCriteria().forEach((name, result) -> {
            if (!result.isOk()) {
                dto.getFailures().add(name + ": " + result.getDetail());
            }
        });

        return dto;
    }

    /**
     * Valida a elegibilidade por ID.
     */
    @Transactional(readOnly = true)
    public VehicleEligibilityDTO checkVehicleById(UUID vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new com.z7design.fleet_manager.exception.ResourceNotFoundException(
                        "Veículo não encontrado com ID: " + vehicleId));
        return checkVehicle(vehicle);
    }

    /**
     * Filtro de frota: avalia todos os veículos e retorna apenas os elegíveis
     * para alocação em contrato (opcionalmente incluindo os reprovados).
     */
    @Transactional(readOnly = true)
    public List<VehicleEligibilityDTO> filterEligibleFleet(boolean includeIneligible) {
        return vehicleRepository.findAll().stream()
                .map(this::checkVehicle)
                .filter(r -> includeIneligible || r.isEligible())
                .collect(Collectors.toList());
    }
}
