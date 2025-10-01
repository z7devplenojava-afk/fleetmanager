package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.PositionDTO;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Position;
import br.com.fleetmanager.model.Unit;
import br.com.fleetmanager.repository.PositionRepository;
import br.com.fleetmanager.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PositionService {

    private final PositionRepository positionRepository;
    private final UnitRepository unitRepository;

    public List<PositionDTO> getAllPositions() {
        log.info("Buscando todos os cargos");
        return positionRepository.findAll().stream()
                .map(PositionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PositionDTO getPositionById(UUID id) {
        log.info("Buscando cargo por ID: {}", id);
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo não encontrado com ID: " + id));
        return PositionDTO.fromEntity(position);
    }

    public PositionDTO createPosition(PositionDTO dto) {
        log.info("Criando novo cargo: {}", dto.getName());

        if (positionRepository.existsByName(dto.getName())) {
            throw new BusinessException("Já existe um cargo com o nome: " + dto.getName());
        }

        Position position = dto.toEntity();

        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com ID: " + dto.getUnitId()));
            position.setUnit(unit);
        }

        position = positionRepository.save(position);
        log.info("Cargo criado com sucesso - ID: {}", position.getId());
        return PositionDTO.fromEntity(position);
    }

    public PositionDTO updatePosition(UUID id, PositionDTO dto) {
        log.info("Atualizando cargo ID: {}", id);

        Position existingPosition = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo não encontrado com ID: " + id));

        if (!existingPosition.getName().equals(dto.getName()) && positionRepository.existsByName(dto.getName())) {
            throw new BusinessException("Já existe um cargo com o nome: " + dto.getName());
        }

        existingPosition.setName(dto.getName());
        existingPosition.setDescription(dto.getDescription());
        existingPosition.setBaseSalary(dto.getBaseSalary());

        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com ID: " + dto.getUnitId()));
            existingPosition.setUnit(unit);
        } else {
            existingPosition.setUnit(null); // Remove a associação se unitId for null
        }

        existingPosition = positionRepository.save(existingPosition);
        log.info("Cargo atualizado com sucesso - ID: {}", existingPosition.getId());
        return PositionDTO.fromEntity(existingPosition);
    }

    public void deletePosition(UUID id) {
        log.info("Excluindo cargo ID: {}", id);
        if (!positionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cargo não encontrado com ID: " + id);
        }
        positionRepository.deleteById(id);
        log.info("Cargo excluído com sucesso - ID: {}", id);
    }
} 