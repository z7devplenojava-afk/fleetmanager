package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.AgencyDTO;
import com.z7design.fleet_manager.model.Agency;
import com.z7design.fleet_manager.model.Bank;
import com.z7design.fleet_manager.repository.AgencyRepository;
import com.z7design.fleet_manager.repository.BankRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AgencyService {
    
    private final AgencyRepository agencyRepository;
    private final BankRepository bankRepository;
    
    // ===== CRUD OPERATIONS =====
    
    @Transactional(readOnly = true)
    public Page<AgencyDTO> getAllAgencies(Pageable pageable) {
        log.info("Buscando agÃªncias com paginaÃ§Ã£o");
        Page<Agency> agencies = agencyRepository.findAllOrderByBankNameAndName(pageable);
        return agencies.map(AgencyDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<AgencyDTO> getAllAgencies() {
        log.info("Buscando todas as agÃªncias");
        List<Agency> agencies = agencyRepository.findAll();
        return agencies.stream()
                .map(AgencyDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public AgencyDTO getAgencyById(UUID id) {
        log.info("Buscando agÃªncia por ID: {}", id);
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AgÃªncia nÃ£o encontrada com ID: " + id));
        return AgencyDTO.fromEntity(agency);
    }
    
    @Transactional(readOnly = true)
    public List<AgencyDTO> getAgenciesByBankId(UUID bankId) {
        log.info("Buscando agÃªncias por banco: {}", bankId);
        List<Agency> agencies = agencyRepository.findByBankId(bankId);
        return agencies.stream()
                .map(AgencyDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public AgencyDTO createAgency(AgencyDTO dto) {
        log.info("Criando nova agÃªncia: {} - {}", dto.getCode(), dto.getName());
        
        // Verificar se o banco existe
        Bank bank = bankRepository.findById(dto.getBankId())
                .orElseThrow(() -> new RuntimeException("Banco nÃ£o encontrado com ID: " + dto.getBankId()));
        
        // Verificar se jÃ¡ existe agÃªncia com mesmo cÃ³digo no mesmo banco
        if (agencyRepository.findByBankIdAndCode(dto.getBankId(), dto.getCode()).isPresent()) {
            throw new RuntimeException("JÃ¡ existe uma agÃªncia com o cÃ³digo " + dto.getCode() + " no banco " + bank.getName());
        }
        
        Agency agency = Agency.builder()
                .bank(bank)
                .code(dto.getCode())
                .name(dto.getName())
                .shortName(dto.getShortName())
                .description(dto.getDescription())
                .status(dto.getStatus() != null ? dto.getStatus() : Agency.AgencyStatus.ACTIVE)
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .zipCode(dto.getZipCode())
                .manager(dto.getManager())
                .managerPhone(dto.getManagerPhone())
                .managerEmail(dto.getManagerEmail())
                .notes(dto.getNotes())
                .build();
        
        Agency savedAgency = agencyRepository.save(agency);
        log.info("AgÃªncia criada com sucesso: {}", savedAgency.getId());
        
        return AgencyDTO.fromEntity(savedAgency);
    }
    
    public AgencyDTO updateAgency(UUID id, AgencyDTO dto) {
        log.info("Atualizando agÃªncia: {}", id);
        
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AgÃªncia nÃ£o encontrada com ID: " + id));
        
        // Verificar se o banco existe
        Bank bank = bankRepository.findById(dto.getBankId())
                .orElseThrow(() -> new RuntimeException("Banco nÃ£o encontrado com ID: " + dto.getBankId()));
        
        // Verificar se cÃ³digo jÃ¡ existe em outra agÃªncia do mesmo banco
        if (!agency.getCode().equals(dto.getCode()) && 
            agencyRepository.findByBankIdAndCode(dto.getBankId(), dto.getCode()).isPresent()) {
            throw new RuntimeException("JÃ¡ existe uma agÃªncia com o cÃ³digo " + dto.getCode() + " no banco " + bank.getName());
        }
        
        // Atualizar campos
        agency.setBank(bank);
        agency.setCode(dto.getCode());
        agency.setName(dto.getName());
        agency.setShortName(dto.getShortName());
        agency.setDescription(dto.getDescription());
        agency.setStatus(dto.getStatus());
        agency.setPhone(dto.getPhone());
        agency.setAddress(dto.getAddress());
        agency.setCity(dto.getCity());
        agency.setState(dto.getState());
        agency.setZipCode(dto.getZipCode());
        agency.setManager(dto.getManager());
        agency.setManagerPhone(dto.getManagerPhone());
        agency.setManagerEmail(dto.getManagerEmail());
        agency.setNotes(dto.getNotes());
        
        Agency savedAgency = agencyRepository.save(agency);
        log.info("AgÃªncia atualizada com sucesso: {}", savedAgency.getId());
        
        return AgencyDTO.fromEntity(savedAgency);
    }
    
    public void deleteAgency(UUID id) {
        log.info("Removendo agÃªncia: {}", id);
        
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AgÃªncia nÃ£o encontrada com ID: " + id));
        
        // Verificar se hÃ¡ contas bancÃ¡rias associadas
        // TODO: Implementar verificaÃ§Ã£o de contas bancÃ¡rias associadas
        
        agencyRepository.delete(agency);
        log.info("AgÃªncia removida com sucesso: {}", id);
    }
    
    // ===== SEARCH OPERATIONS =====
    
    @Transactional(readOnly = true)
    public List<AgencyDTO> searchAgenciesByName(String name) {
        log.info("Buscando agÃªncias por nome: {}", name);
        List<Agency> agencies = agencyRepository.findByNameContainingIgnoreCase(name);
        return agencies.stream()
                .map(AgencyDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AgencyDTO> searchAgenciesByCode(String code) {
        log.info("Buscando agÃªncias por cÃ³digo: {}", code);
        List<Agency> agencies = agencyRepository.findByCodeContainingIgnoreCase(code);
        return agencies.stream()
                .map(AgencyDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AgencyDTO> searchAgenciesByBankName(String bankName) {
        log.info("Buscando agÃªncias por nome do banco: {}", bankName);
        List<Agency> agencies = agencyRepository.findByBankNameContainingIgnoreCase(bankName);
        return agencies.stream()
                .map(AgencyDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AgencyDTO> searchAgenciesByCity(String city) {
        log.info("Buscando agÃªncias por cidade: {}", city);
        List<Agency> agencies = agencyRepository.findByCityContainingIgnoreCase(city);
        return agencies.stream()
                .map(AgencyDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AgencyDTO> getAgenciesByStatus(Agency.AgencyStatus status) {
        log.info("Buscando agÃªncias por status: {}", status);
        List<Agency> agencies = agencyRepository.findByStatus(status);
        return agencies.stream()
                .map(AgencyDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AgencyDTO> getAgenciesByState(String state) {
        log.info("Buscando agÃªncias por estado: {}", state);
        List<Agency> agencies = agencyRepository.findByState(state);
        return agencies.stream()
                .map(AgencyDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    // ===== STATISTICS =====
    
    @Transactional(readOnly = true)
    public Long getTotalAgenciesCount() {
        return agencyRepository.count();
    }
    
    @Transactional(readOnly = true)
    public Long getAgenciesCountByStatus(Agency.AgencyStatus status) {
        return agencyRepository.countByStatus(status);
    }
    
    @Transactional(readOnly = true)
    public Long getAgenciesCountByBankId(UUID bankId) {
        return agencyRepository.countByBankId(bankId);
    }
    
    @Transactional(readOnly = true)
    public List<String> getDistinctCities() {
        return agencyRepository.findDistinctCities();
    }
    
    @Transactional(readOnly = true)
    public List<String> getDistinctStates() {
        return agencyRepository.findDistinctStates();
    }
}

