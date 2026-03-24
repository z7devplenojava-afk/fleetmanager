package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.PositionDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Position;
import com.z7design.fleet_manager.model.Unit;
import com.z7design.fleet_manager.repository.PositionRepository;
import com.z7design.fleet_manager.repository.UnitRepository;
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
        try {
            log.info("Buscando todos os cargos");
            List<Position> positions = positionRepository.findAll();
            log.info("Encontrados {} cargos", positions.size());
            
            if (positions.isEmpty()) {
                log.warn("Nenhum cargo encontrado no banco de dados");
                return java.util.Collections.emptyList();
            }
            
            return positions.stream()
                .map(pos -> {
                    try {
                        return PositionDTO.fromEntity(pos);
                    } catch (Exception e) {
                        log.error("Erro ao converter cargo {}: {}", pos.getName(), e.getMessage());
                        return null; // Continuar com outros cargos
                    }
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar cargos: {}", e.getMessage(), e);
            log.warn("Retornando lista vazia devido ao erro");
            return java.util.Collections.emptyList();
        }
    }
    
    public List<PositionDTO> searchPositions(String query) {
        log.info("Buscando cargos com query: {}", query);
        List<Position> positions;
        
        if (query == null || query.trim().isEmpty()) {
            positions = positionRepository.findAllByOrderByNameAsc();
        } else {
            positions = positionRepository.searchPositions(query.trim());
        }
        
        return positions.stream()
                .map(PositionDTO::fromEntity)
                .filter(dto -> dto != null) // Filtrar DTOs nulos
                .collect(Collectors.toList());
    }

    public PositionDTO getPositionById(UUID id) {
        log.info("Buscando cargo por ID: {}", id);
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo nÃ£o encontrado com ID: " + id));
        return PositionDTO.fromEntity(position);
    }

    public PositionDTO createPosition(PositionDTO dto) {
        log.info("Criando novo cargo: {}", dto.getName());

        if (positionRepository.existsByName(dto.getName())) {
            throw new BusinessException("JÃ¡ existe um cargo com o nome: " + dto.getName());
        }

        Position position = dto.toEntity();

        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade nÃ£o encontrada com ID: " + dto.getUnitId()));
            position.setUnit(unit);
        }

        position = positionRepository.save(position);
        log.info("Cargo criado com sucesso - ID: {}", position.getId());
        return PositionDTO.fromEntity(position);
    }

    public PositionDTO updatePosition(UUID id, PositionDTO dto) {
        log.info("Atualizando cargo ID: {}", id);

        Position existingPosition = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo nÃ£o encontrado com ID: " + id));

        if (!existingPosition.getName().equals(dto.getName()) && positionRepository.existsByName(dto.getName())) {
            throw new BusinessException("JÃ¡ existe um cargo com o nome: " + dto.getName());
        }

        existingPosition.setName(dto.getName());
        existingPosition.setDescription(dto.getDescription());
        existingPosition.setCbo(dto.getCbo());
        existingPosition.setBaseSalary(dto.getBaseSalary());

        if (dto.getUnitId() != null) {
            Unit unit = unitRepository.findById(dto.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade nÃ£o encontrada com ID: " + dto.getUnitId()));
            existingPosition.setUnit(unit);
        } else {
            existingPosition.setUnit(null); // Remove a associaÃ§Ã£o se unitId for null
        }

        existingPosition = positionRepository.save(existingPosition);
        log.info("Cargo atualizado com sucesso - ID: {}", existingPosition.getId());
        return PositionDTO.fromEntity(existingPosition);
    }

    public void deletePosition(UUID id) {
        log.info("Excluindo cargo ID: {}", id);
        if (!positionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cargo nÃ£o encontrado com ID: " + id);
        }
        positionRepository.deleteById(id);
        log.info("Cargo excluÃ­do com sucesso - ID: {}", id);
    }
} 
