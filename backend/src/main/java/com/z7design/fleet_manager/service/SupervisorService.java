package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.*;
import com.z7design.fleet_manager.model.Supervisor;
import com.z7design.fleet_manager.repository.SupervisorRepository;
import com.z7design.fleet_manager.service.SeetaFace2Service;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupervisorService {
    
    private final SupervisorRepository supervisorRepository;
    private final SeetaFace2Service seetaFace2Service;
    
    @Transactional(readOnly = true)
    public Page<SupervisorDTO> getAllSupervisors(Pageable pageable) {
        return supervisorRepository.findAll(pageable)
                .map(SupervisorDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<SupervisorDTO> getAllActiveSupervisors() {
        return supervisorRepository.findByIsActiveTrue()
                .stream()
                .map(SupervisorDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public SupervisorDTO getSupervisorById(UUID id) {
        Supervisor supervisor = supervisorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Supervisor nÃ£o encontrado com ID: " + id));
        return SupervisorDTO.fromEntity(supervisor);
    }
    
    @Transactional(readOnly = true)
    public SupervisorDTO getSupervisorByCpf(String cpf) {
        Supervisor supervisor = supervisorRepository.findActiveByCpf(cpf)
                .orElseThrow(() -> new EntityNotFoundException("Supervisor nÃ£o encontrado com CPF: " + cpf));
        return SupervisorDTO.fromEntity(supervisor);
    }
    
    @Transactional
    public SupervisorDTO createSupervisor(CreateSupervisorDTO createDTO) {
        log.info("Criando novo supervisor: {}", createDTO.getName());
        
        // Verificar se CPF jÃ¡ existe
        if (supervisorRepository.existsByCpf(createDTO.getCpf())) {
            throw new IllegalArgumentException("JÃ¡ existe um supervisor com este CPF");
        }
        
        // Verificar se email jÃ¡ existe
        if (supervisorRepository.existsByEmail(createDTO.getEmail())) {
            throw new IllegalArgumentException("JÃ¡ existe um supervisor com este email");
        }
        
        Supervisor supervisor = new Supervisor();
        supervisor.setName(createDTO.getName());
        supervisor.setCpf(createDTO.getCpf());
        supervisor.setEmail(createDTO.getEmail());
        supervisor.setPhone(createDTO.getPhone());
        supervisor.setIsActive(createDTO.getIsActive());
        
        Supervisor savedSupervisor = supervisorRepository.save(supervisor);
        log.info("Supervisor criado com sucesso: ID {}", savedSupervisor.getId());
        
        return SupervisorDTO.fromEntity(savedSupervisor);
    }
    
    @Transactional
    public SupervisorDTO updateSupervisor(UUID id, UpdateSupervisorDTO updateDTO) {
        log.info("Atualizando supervisor: ID {}", id);
        
        Supervisor supervisor = supervisorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Supervisor nÃ£o encontrado com ID: " + id));
        
        // Verificar se CPF jÃ¡ existe em outro supervisor
        if (updateDTO.getCpf() != null && !updateDTO.getCpf().equals(supervisor.getCpf())) {
            if (supervisorRepository.existsByCpf(updateDTO.getCpf())) {
                throw new IllegalArgumentException("JÃ¡ existe um supervisor com este CPF");
            }
            supervisor.setCpf(updateDTO.getCpf());
        }
        
        // Verificar se email jÃ¡ existe em outro supervisor
        if (updateDTO.getEmail() != null && !updateDTO.getEmail().equals(supervisor.getEmail())) {
            if (supervisorRepository.existsByEmail(updateDTO.getEmail())) {
                throw new IllegalArgumentException("JÃ¡ existe um supervisor com este email");
            }
            supervisor.setEmail(updateDTO.getEmail());
        }
        
        if (updateDTO.getName() != null) {
            supervisor.setName(updateDTO.getName());
        }
        if (updateDTO.getPhone() != null) {
            supervisor.setPhone(updateDTO.getPhone());
        }
        if (updateDTO.getIsActive() != null) {
            supervisor.setIsActive(updateDTO.getIsActive());
        }
        
        Supervisor updatedSupervisor = supervisorRepository.save(supervisor);
        log.info("Supervisor atualizado com sucesso: ID {}", updatedSupervisor.getId());
        
        return SupervisorDTO.fromEntity(updatedSupervisor);
    }
    
    @Transactional
    public void deleteSupervisor(UUID id) {
        log.info("Deletando supervisor: ID {}", id);
        
        if (!supervisorRepository.existsById(id)) {
            throw new EntityNotFoundException("Supervisor nÃ£o encontrado com ID: " + id);
        }
        
        supervisorRepository.deleteById(id);
        log.info("Supervisor deletado com sucesso: ID {}", id);
    }
    
    @Transactional
    public SupervisorDTO registerFace(UUID supervisorId, MultipartFile imageFile) {
        log.info("Registrando face para supervisor: ID {}", supervisorId);
        
        Supervisor supervisor = supervisorRepository.findById(supervisorId)
                .orElseThrow(() -> new EntityNotFoundException("Supervisor nÃ£o encontrado com ID: " + supervisorId));
        
        try {
            // Extrair template facial usando SeetaFace2
            byte[] faceTemplate = seetaFace2Service.extractFaceTemplate(imageFile);
            double qualityScore = seetaFace2Service.calculateFaceQuality(imageFile);
            
            // Verificar qualidade mÃ­nima
            double minQuality = 60.0; // ConfigurÃ¡vel
            if (qualityScore < minQuality) {
                throw new IllegalArgumentException("Qualidade da face insuficiente: " + qualityScore + " (mÃ­nimo: " + minQuality + ")");
            }
            
            supervisor.setFaceTemplate(faceTemplate);
            supervisor.setFaceQualityScore(qualityScore);
            
            Supervisor updatedSupervisor = supervisorRepository.save(supervisor);
            log.info("Face registrada com sucesso para supervisor: ID {}", supervisorId);
            
            return SupervisorDTO.fromEntity(updatedSupervisor);
            
        } catch (Exception e) {
            log.error("Erro ao registrar face para supervisor: ID {}", supervisorId, e);
            throw new RuntimeException("Erro ao registrar face: " + e.getMessage());
        }
    }
    
    @Transactional
    public void removeFace(UUID supervisorId) {
        log.info("Removendo face do supervisor: ID {}", supervisorId);
        
        Supervisor supervisor = supervisorRepository.findById(supervisorId)
                .orElseThrow(() -> new EntityNotFoundException("Supervisor nÃ£o encontrado com ID: " + supervisorId));
        
        supervisor.setFaceTemplate(null);
        supervisor.setFaceEncoding(null);
        supervisor.setFaceQualityScore(null);
        
        supervisorRepository.save(supervisor);
        log.info("Face removida com sucesso do supervisor: ID {}", supervisorId);
    }
    
    @Transactional(readOnly = true)
    public List<SupervisorDTO> searchSupervisorsByName(String name) {
        return supervisorRepository.findActiveByNameContaining(name)
                .stream()
                .map(SupervisorDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public long countActiveSupervisors() {
        return supervisorRepository.countActiveSupervisors();
    }
}

