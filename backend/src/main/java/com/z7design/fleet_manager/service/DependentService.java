package com.z7design.fleet_manager.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.dto.DependentDTO;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Dependent;
import com.z7design.fleet_manager.model.Employee;
import com.z7design.fleet_manager.repository.DependentRepository;
import com.z7design.fleet_manager.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DependentService {
    
    private final DependentRepository dependentRepository;
    private final EmployeeRepository employeeRepository;
    
    @Transactional
    public DependentDTO create(DependentDTO.CreateRequest request) {
        log.info("Criando dependente para funcionÃ¡rio ID: {}", request.getEmployeeId());
        
        // Validar se funcionÃ¡rio existe
        Employee employee = employeeRepository.findById(request.getEmployeeId())
            .orElseThrow(() -> new ResourceNotFoundException("FuncionÃ¡rio nÃ£o encontrado"));
        
        // Verificar se CPF jÃ¡ existe para outro dependente
        if (dependentRepository.findByCpf(request.getCpf()).stream()
            .anyMatch(d -> !d.getEmployee().getId().equals(request.getEmployeeId()))) {
            throw new IllegalArgumentException("CPF jÃ¡ estÃ¡ cadastrado para outro dependente");
        }
        
        Dependent dependent = Dependent.builder()
            .employee(employee)
            .name(request.getName())
            .relationship(request.getRelationship())
            .birthDate(request.getBirthDate())
            .cpf(request.getCpf())
            .rg(request.getRg())
            .gender(request.getGender())
            .phone(request.getPhone())
            .email(request.getEmail())
            .address(request.getAddress())
            .city(request.getCity())
            .state(request.getState())
            .zipCode(request.getZipCode())
            .isStudent(request.getIsStudent())
            .schoolName(request.getSchoolName())
            .isBeneficiary(request.getIsBeneficiary())
            .notes(request.getNotes())
            .build();
        
        validateDependent(dependent);
        Dependent saved = dependentRepository.save(dependent);
        
        log.info("Dependente criado com sucesso. ID: {}", saved.getId());
        return mapToDTO(saved);
    }
    
    @Transactional
    public DependentDTO update(UUID id, DependentDTO.UpdateRequest request) {
        log.info("Atualizando dependente ID: {}", id);
        
        Dependent existingDependent = findByIdEntity(id);
        
        // Verificar se CPF jÃ¡ existe para outro dependente
        if (request.getCpf() != null && !request.getCpf().equals(existingDependent.getCpf())) {
            if (dependentRepository.findByCpf(request.getCpf()).stream()
                .anyMatch(d -> !d.getId().equals(id))) {
                throw new IllegalArgumentException("CPF jÃ¡ estÃ¡ cadastrado para outro dependente");
            }
        }
        
        // Atualizar campos
        if (request.getName() != null) existingDependent.setName(request.getName());
        if (request.getRelationship() != null) existingDependent.setRelationship(request.getRelationship());
        if (request.getBirthDate() != null) existingDependent.setBirthDate(request.getBirthDate());
        if (request.getCpf() != null) existingDependent.setCpf(request.getCpf());
        if (request.getRg() != null) existingDependent.setRg(request.getRg());
        if (request.getGender() != null) existingDependent.setGender(request.getGender());
        if (request.getPhone() != null) existingDependent.setPhone(request.getPhone());
        if (request.getEmail() != null) existingDependent.setEmail(request.getEmail());
        if (request.getAddress() != null) existingDependent.setAddress(request.getAddress());
        if (request.getCity() != null) existingDependent.setCity(request.getCity());
        if (request.getState() != null) existingDependent.setState(request.getState());
        if (request.getZipCode() != null) existingDependent.setZipCode(request.getZipCode());
        if (request.getIsStudent() != null) existingDependent.setIsStudent(request.getIsStudent());
        if (request.getSchoolName() != null) existingDependent.setSchoolName(request.getSchoolName());
        if (request.getIsBeneficiary() != null) existingDependent.setIsBeneficiary(request.getIsBeneficiary());
        if (request.getNotes() != null) existingDependent.setNotes(request.getNotes());
        
        validateDependent(existingDependent);
        Dependent saved = dependentRepository.save(existingDependent);
        
        log.info("Dependente atualizado com sucesso. ID: {}", saved.getId());
        return mapToDTO(saved);
    }
    
    @Transactional
    public void delete(UUID id) {
        log.info("Excluindo dependente ID: {}", id);
        Dependent dependent = findByIdEntity(id);
        dependentRepository.delete(dependent);
        log.info("Dependente excluÃ­do com sucesso. ID: {}", id);
    }
    
    public DependentDTO findById(UUID id) {
        return mapToDTO(findByIdEntity(id));
    }
    
    public List<DependentDTO> findByEmployeeId(UUID employeeId) {
        log.info("Buscando dependentes do funcionÃ¡rio ID: {}", employeeId);
        return dependentRepository.findByEmployeeId(employeeId)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    public List<DependentDTO> findAll() {
        log.info("Buscando todos os dependentes");
        return dependentRepository.findAll()
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    public List<DependentDTO> findByCpf(String cpf) {
        log.info("Buscando dependente por CPF: {}", cpf);
        return dependentRepository.findByCpf(cpf)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    public List<DependentDTO> findByRelationship(String relationship) {
        log.info("Buscando dependentes por relacionamento: {}", relationship);
        return dependentRepository.findByRelationship(relationship)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }
    
    private Dependent findByIdEntity(UUID id) {
        return dependentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Dependente nÃ£o encontrado"));
    }
    
    private DependentDTO mapToDTO(Dependent dependent) {
        return DependentDTO.builder()
            .id(dependent.getId())
            .employeeId(dependent.getEmployee().getId())
            .employeeName(dependent.getEmployee().getName())
            .name(dependent.getName())
            .relationship(dependent.getRelationship())
            .birthDate(dependent.getBirthDate())
            .cpf(dependent.getCpf())
            .rg(dependent.getRg())
            .gender(dependent.getGender())
            .phone(dependent.getPhone())
            .email(dependent.getEmail())
            .address(dependent.getAddress())
            .city(dependent.getCity())
            .state(dependent.getState())
            .zipCode(dependent.getZipCode())
            .isStudent(dependent.getIsStudent())
            .schoolName(dependent.getSchoolName())
            .isBeneficiary(dependent.getIsBeneficiary())
            .notes(dependent.getNotes())
            .createdAt(dependent.getCreatedAt())
            .updatedAt(dependent.getUpdatedAt())
            .build();
    }
    
    private void validateDependent(Dependent dependent) {
        if (dependent.getName() == null || dependent.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do dependente Ã© obrigatÃ³rio");
        }
        
        if (dependent.getRelationship() == null || dependent.getRelationship().trim().isEmpty()) {
            throw new IllegalArgumentException("RelaÃ§Ã£o com o dependente Ã© obrigatÃ³ria");
        }
        
        if (dependent.getBirthDate() == null) {
            throw new IllegalArgumentException("Data de nascimento Ã© obrigatÃ³ria");
        }
        
        if (dependent.getCpf() == null || dependent.getCpf().trim().isEmpty()) {
            throw new IllegalArgumentException("CPF Ã© obrigatÃ³rio");
        }
        
        if (dependent.getEmployee() == null) {
            throw new IllegalArgumentException("FuncionÃ¡rio Ã© obrigatÃ³rio");
        }
    }
} 
