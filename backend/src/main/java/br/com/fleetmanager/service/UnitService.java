package br.com.fleetmanager.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import br.com.fleetmanager.dto.UnitDTO;
import br.com.fleetmanager.dto.UnitCreateDTO;
import br.com.fleetmanager.dto.CreateUnitRequest;
import br.com.fleetmanager.dto.UpdateUnitRequest;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.model.Unit;
import br.com.fleetmanager.model.Client;
import br.com.fleetmanager.repository.UnitRepository;
import br.com.fleetmanager.repository.ClientRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UnitService {
    
    private final UnitRepository unitRepository;
    private final ClientRepository clientRepository;
    
    // Métodos de busca com paginação
    @Cacheable("units")
    public Page<UnitDTO> findAll(Pageable pageable) {
        log.debug("Buscando unidades com paginação: {}", pageable);
        Page<Unit> units = unitRepository.findAll(pageable);
        return units.map(this::convertToDTO);
    }
    
    // Métodos de busca como DTOs
    public List<UnitDTO> findAllAsDTO() {
        return unitRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UnitDTO> findAllActiveAsDTO() {
        return unitRepository.findByActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public UnitDTO findByIdAsDTO(UUID id) {
        log.debug("Buscando unidade por ID: {}", id);
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com ID: " + id));
        return convertToDTO(unit);
    }
    
    public UnitDTO findByCodeAsDTO(String code) {
        Unit unit = findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com código: " + code));
        return convertToDTO(unit);
    }
    
    public List<UnitDTO> findByNameContainingAsDTO(String name) {
        return findByNameContaining(name).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UnitDTO> findActiveByNameContainingAsDTO(String name) {
        return findActiveByNameContaining(name).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UnitDTO> findRootUnitsAsDTO() {
        return findRootUnits().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UnitDTO> findActiveRootUnitsAsDTO() {
        return findActiveRootUnits().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UnitDTO> findChildrenAsDTO(UUID parentId) {
        return findChildren(parentId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UnitDTO> findByClientIdAsDTO(UUID clientId) {
        return findByClientId(clientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<UnitDTO> findActiveByClientIdAsDTO(UUID clientId) {
        return findActiveByClientId(clientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Métodos de criação e atualização
    @CacheEvict(value = {"units", "active-units"}, allEntries = true)
    public UnitDTO createUnitFromRequest(CreateUnitRequest request) {
        log.info("Criando nova unidade: {}", request.getName());
        
        // Verificar se o código já existe
        if (unitRepository.findByCode(request.getCode()).isPresent()) {
            throw new BusinessException("Já existe uma unidade com o código: " + request.getCode());
        }
        
        // Verificar se o cliente existe
        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + request.getClientId()));
        }
        
        // Verificar se a unidade pai existe
        Unit parentUnit = null;
        if (request.getParentId() != null) {
            parentUnit = unitRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade pai não encontrada com ID: " + request.getParentId()));
        }
        
        Unit unit = Unit.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .client(client)
                .parent(parentUnit)
                .active(true)
                .build();
        
        Unit savedUnit = unitRepository.save(unit);
        log.info("Unidade criada com sucesso: {}", savedUnit.getName());
        
        return convertToDTO(savedUnit);
    }
    
    @CacheEvict(value = {"units", "active-units"}, allEntries = true)
    public UnitDTO updateUnitFromRequest(UUID id, UpdateUnitRequest request) {
        log.info("Atualizando unidade com ID: {}", id);
        
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com ID: " + id));
        
        // Verificar se o código já existe (se foi alterado)
        if (request.getCode() != null && !request.getCode().equals(unit.getCode())) {
            if (unitRepository.findByCode(request.getCode()).isPresent()) {
                throw new BusinessException("Já existe uma unidade com o código: " + request.getCode());
            }
        }
        
        // Verificar se o cliente existe
        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + request.getClientId()));
        }
        
        // Verificar se a unidade pai existe
        Unit parentUnit = null;
        if (request.getParentId() != null) {
            parentUnit = unitRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade pai não encontrada com ID: " + request.getParentId()));
        }
        
        // Atualizar campos
        if (request.getName() != null) unit.setName(request.getName());
        if (request.getCode() != null) unit.setCode(request.getCode());
        if (request.getDescription() != null) unit.setDescription(request.getDescription());
        if (request.getAddress() != null) unit.setAddress(request.getAddress());
        if (request.getPhone() != null) unit.setPhone(request.getPhone());
        if (request.getEmail() != null) unit.setEmail(request.getEmail());
        if (client != null) unit.setClient(client);
        if (parentUnit != null) unit.setParent(parentUnit);
        
        Unit updatedUnit = unitRepository.save(unit);
        log.info("Unidade atualizada com sucesso: {}", updatedUnit.getName());
        
        return convertToDTO(updatedUnit);
    }
    
    public UnitDTO toggleActiveAsDTO(UUID id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com ID: " + id));
        
        unit.setActive(!unit.isActive());
        Unit updatedUnit = unitRepository.save(unit);
        
        return convertToDTO(updatedUnit);
    }
    
    public void deleteUnit(UUID id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com ID: " + id));
        
        unitRepository.delete(unit);
        log.info("Unidade deletada com sucesso: {}", unit.getName());
    }
    
    // Métodos de busca internos
    public Unit findById(UUID id) {
        return unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada com ID: " + id));
    }
    
    public Optional<Unit> findByCode(String code) {
        return unitRepository.findByCode(code);
    }
    
    public List<Unit> findByNameContaining(String name) {
        return unitRepository.findByNameContainingIgnoreCase(name);
    }
    
    public List<Unit> findActiveByNameContaining(String name) {
        return unitRepository.findByActiveTrueAndNameContainingIgnoreCase(name);
    }
    
    public List<Unit> findRootUnits() {
        return unitRepository.findByParentIsNull();
    }
    
    public List<Unit> findActiveRootUnits() {
        return unitRepository.findByParentIsNullAndActiveTrue();
    }
    
    public List<Unit> findChildren(UUID parentId) {
        return unitRepository.findByParentId(parentId);
    }
    
    public List<Unit> findByClientId(UUID clientId) {
        return unitRepository.findByClientId(clientId);
    }
    
    public List<Unit> findActiveByClientId(UUID clientId) {
        return unitRepository.findByClientIdAndActiveTrue(clientId);
    }
    
    // Método de busca com filtros
    public Page<UnitDTO> findByFilters(String name, Boolean active, UUID clientId, UUID parentId, Pageable pageable) {
        List<Unit> filteredUnits = unitRepository.findAll().stream()
                .filter(unit -> name == null || unit.getName().toLowerCase().contains(name.toLowerCase()))
                .filter(unit -> active == null || unit.isActive() == active)
                .filter(unit -> clientId == null || (unit.getClient() != null && unit.getClient().getId().equals(clientId)))
                .filter(unit -> parentId == null || (unit.getParent() != null && unit.getParent().getId().equals(parentId)))
                .collect(Collectors.toList());
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredUnits.size());
        
        List<Unit> pageContent = filteredUnits.subList(start, end);
        Page<Unit> unitPage = new PageImpl<>(pageContent, pageable, filteredUnits.size());
        
        return unitPage.map(this::convertToDTO);
    }
    
    // Método de conversão para DTO
    private UnitDTO convertToDTO(Unit unit) {
        if (unit == null) return null;
        
        // Verificar se o cliente existe antes de acessar suas propriedades
        String clientName = null;
        UUID clientId = null;
        try {
            if (unit.getClient() != null) {
                clientId = unit.getClient().getId();
                clientName = unit.getClient().getName();
            }
        } catch (Exception e) {
            log.warn("Cliente não encontrado para unidade {}: {}", unit.getId(), e.getMessage());
            clientId = null;
            clientName = null;
        }
        
        // Verificar se a unidade pai existe antes de acessar suas propriedades
        String parentName = null;
        UUID parentId = null;
        try {
            if (unit.getParent() != null) {
                parentId = unit.getParent().getId();
                parentName = unit.getParent().getName();
            }
        } catch (Exception e) {
            log.warn("Unidade pai não encontrada para unidade {}: {}", unit.getId(), e.getMessage());
            parentId = null;
            parentName = null;
        }
        
        return UnitDTO.builder()
                .id(unit.getId())
                .name(unit.getName())
                .code(unit.getCode())
                .description(unit.getDescription())
                .address(unit.getAddress())
                .phone(unit.getPhone())
                .email(unit.getEmail())
                .active(unit.isActive())
                .clientId(clientId)
                .clientName(clientName)
                .parentId(parentId)
                .parentName(parentName)
                .createdAt(unit.getCreatedAt())
                .updatedAt(unit.getUpdatedAt())
                .employeeCount(0L) // Implementar contagem real se necessário
                .childrenCount((long) unitRepository.findByParentId(unit.getId()).size())
                .build();
    }
} 