package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.VehicleChecklistConfigCopyRequest;
import com.z7design.fleet_manager.dto.VehicleChecklistConfigCopyResponse;
import com.z7design.fleet_manager.dto.VehicleChecklistConfigDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Vehicle;
import com.z7design.fleet_manager.model.VehicleChecklistConfig;
import com.z7design.fleet_manager.repository.VehicleChecklistConfigRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleChecklistConfigService {

    private final VehicleChecklistConfigRepository repository;
    private final VehicleRepository vehicleRepository;

    /**
     * Retorna os itens efetivos para um veículo: itens customizados do veículo quando
     * existirem; caso contrário, o template padrão global (vehicle_id IS NULL).
     */
    @Transactional(readOnly = true)
    public List<VehicleChecklistConfigDTO> getForVehicle(UUID vehicleId) {
        if (vehicleId == null) {
            return getDefaultTemplate();
        }
        List<VehicleChecklistConfig> custom = repository.findByVehicleIdAndIsActiveTrueOrderBySortOrderAsc(vehicleId);
        if (custom.isEmpty()) {
            return getDefaultTemplate();
        }
        return custom.stream().map(VehicleChecklistConfigDTO::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<VehicleChecklistConfigDTO> getDefaultTemplate() {
        return repository.findByVehicleIsNullAndIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(VehicleChecklistConfigDTO::fromEntity)
                .toList();
    }

    /**
     * Substitui (bulk replace) os itens de um veículo ou do template padrão global.
     *
     * @param vehicleId id do veículo; quando null, atualiza o template padrão global
     */
    @Transactional
    public List<VehicleChecklistConfigDTO> replace(UUID vehicleId, List<VehicleChecklistConfigDTO> items) {
        Vehicle vehicle = null;
        UUID companyId = null;

        if (vehicleId != null) {
            vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + vehicleId));
            companyId = vehicle.getCompanyId();
            repository.deleteByVehicleId(vehicleId);
        } else {
            repository.deleteByVehicleIsNull();
        }

        List<VehicleChecklistConfig> saved = saveItems(vehicle, companyId, items);

        log.info("Checklist configurado: veículo={} itens={}", vehicleId, saved.size());
        return saved.stream().map(VehicleChecklistConfigDTO::fromEntity).toList();
    }

    /**
     * Copia a configuração informada para vários veículos em uma única operação
     * transacional, substituindo a configuração existente de cada destino.
     *
     * @param request veículos de destino + itens a aplicar
     * @return resumo da cópia (quantidade e IDs dos veículos atualizados)
     */
    @Transactional
    public VehicleChecklistConfigCopyResponse copy(VehicleChecklistConfigCopyRequest request) {
        List<UUID> targetVehicleIds = request.getTargetVehicleIds() == null
                ? List.of()
                : request.getTargetVehicleIds().stream().distinct().toList();
        if (targetVehicleIds.isEmpty()) {
            throw new IllegalArgumentException("Informe ao menos um veículo de destino para a cópia.");
        }

        List<VehicleChecklistConfigDTO> validItems = request.getItems() == null
                ? List.of()
                : request.getItems().stream()
                        .filter(i -> i.getTitle() != null && !i.getTitle().isBlank())
                        .toList();
        if (validItems.isEmpty()) {
            throw new IllegalArgumentException("Nenhum item válido para copiar.");
        }

        // Pré-valida todos os destinos antes de aplicar, para falhar rápido caso um ID seja inválido
        List<Vehicle> vehicles = new ArrayList<>();
        for (UUID vehicleId : targetVehicleIds) {
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + vehicleId));
            vehicles.add(vehicle);
        }

        List<UUID> applied = new ArrayList<>();
        for (Vehicle vehicle : vehicles) {
            repository.deleteByVehicleId(vehicle.getId());
            saveItems(vehicle, vehicle.getCompanyId(), validItems);
            applied.add(vehicle.getId());
        }

        log.info("Checklist copiado para {} veículo(s), {} itens", applied.size(), validItems.size());
        return VehicleChecklistConfigCopyResponse.builder()
                .copied(applied.size())
                .vehicleIds(applied)
                .itemsCount(validItems.size())
                .build();
    }

    /**
     * Persiste os itens válidos de uma lista, atribuindo a ordem de exibição
     * sequencial e o companyId do veículo (ou do próprio item no caso do template global).
     */
    private List<VehicleChecklistConfig> saveItems(Vehicle vehicle, UUID companyId,
                                                   List<VehicleChecklistConfigDTO> items) {
        List<VehicleChecklistConfig> saved = new ArrayList<>();
        if (items == null) {
            return saved;
        }
        int order = 0;
        for (VehicleChecklistConfigDTO dto : items) {
            if (dto.getTitle() == null || dto.getTitle().isBlank()) {
                continue;
            }
            VehicleChecklistConfig entity = VehicleChecklistConfig.builder()
                    .vehicle(vehicle)
                    .title(dto.getTitle().trim())
                    .category(dto.getCategory() != null && !dto.getCategory().isBlank()
                            ? dto.getCategory().trim()
                            : "outros")
                    .required(Boolean.TRUE.equals(dto.getRequired()))
                    .sortOrder(order++)
                    .isActive(dto.getIsActive() == null || dto.getIsActive())
                    .companyId(companyId != null ? companyId : dto.getCompanyId())
                    .build();
            saved.add(repository.save(entity));
        }
        return saved;
    }
}
