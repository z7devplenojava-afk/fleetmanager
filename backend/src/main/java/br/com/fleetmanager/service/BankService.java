package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.BankDTO;
import br.com.fleetmanager.model.Bank;
import br.com.fleetmanager.repository.BankRepository;
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
public class BankService {
    
    private final BankRepository bankRepository;
    
    // ===== CRUD OPERATIONS =====
    
    @Transactional(readOnly = true)
    public Page<BankDTO> getAllBanks(Pageable pageable) {
        log.info("Buscando bancos com paginação");
        Page<Bank> banks = bankRepository.findAllOrderByName(pageable);
        return banks.map(BankDTO::fromEntity);
    }
    
    @Transactional(readOnly = true)
    public List<BankDTO> getAllBanks() {
        log.info("Buscando todos os bancos");
        List<Bank> banks = bankRepository.findAll();
        return banks.stream()
                .map(BankDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public BankDTO getBankById(UUID id) {
        log.info("Buscando banco por ID: {}", id);
        Bank bank = bankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banco não encontrado com ID: " + id));
        return BankDTO.fromEntity(bank);
    }
    
    @Transactional(readOnly = true)
    public BankDTO getBankByCode(String code) {
        log.info("Buscando banco por código: {}", code);
        Bank bank = bankRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Banco não encontrado com código: " + code));
        return BankDTO.fromEntity(bank);
    }
    
    public BankDTO createBank(BankDTO dto) {
        log.info("Criando novo banco: {} - {}", dto.getCode(), dto.getName());
        
        // Verificar se já existe banco com mesmo código
        if (bankRepository.findByCode(dto.getCode()).isPresent()) {
            throw new RuntimeException("Já existe um banco com o código: " + dto.getCode());
        }
        
        // Verificar se já existe banco com mesmo CNPJ
        if (dto.getCnpj() != null && !dto.getCnpj().isEmpty() && 
            bankRepository.findByCnpj(dto.getCnpj()).isPresent()) {
            throw new RuntimeException("Já existe um banco com o CNPJ: " + dto.getCnpj());
        }
        
        Bank bank = Bank.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .shortName(dto.getShortName())
                .cnpj(dto.getCnpj())
                .description(dto.getDescription())
                .status(dto.getStatus() != null ? dto.getStatus() : Bank.BankStatus.ACTIVE)
                .website(dto.getWebsite())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .zipCode(dto.getZipCode())
                .build();
        
        Bank savedBank = bankRepository.save(bank);
        log.info("Banco criado com sucesso: {}", savedBank.getId());
        
        return BankDTO.fromEntity(savedBank);
    }
    
    public BankDTO updateBank(UUID id, BankDTO dto) {
        log.info("Atualizando banco: {}", id);
        
        Bank bank = bankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banco não encontrado com ID: " + id));
        
        // Verificar se código já existe em outro banco
        if (!bank.getCode().equals(dto.getCode()) && 
            bankRepository.findByCode(dto.getCode()).isPresent()) {
            throw new RuntimeException("Já existe um banco com o código: " + dto.getCode());
        }
        
        // Verificar se CNPJ já existe em outro banco
        if (dto.getCnpj() != null && !dto.getCnpj().isEmpty() && 
            !dto.getCnpj().equals(bank.getCnpj()) && 
            bankRepository.findByCnpj(dto.getCnpj()).isPresent()) {
            throw new RuntimeException("Já existe um banco com o CNPJ: " + dto.getCnpj());
        }
        
        // Atualizar campos
        bank.setCode(dto.getCode());
        bank.setName(dto.getName());
        bank.setShortName(dto.getShortName());
        bank.setCnpj(dto.getCnpj());
        bank.setDescription(dto.getDescription());
        bank.setStatus(dto.getStatus());
        bank.setWebsite(dto.getWebsite());
        bank.setPhone(dto.getPhone());
        bank.setAddress(dto.getAddress());
        bank.setCity(dto.getCity());
        bank.setState(dto.getState());
        bank.setZipCode(dto.getZipCode());
        
        Bank savedBank = bankRepository.save(bank);
        log.info("Banco atualizado com sucesso: {}", savedBank.getId());
        
        return BankDTO.fromEntity(savedBank);
    }
    
    public void deleteBank(UUID id) {
        log.info("Removendo banco: {}", id);
        
        Bank bank = bankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banco não encontrado com ID: " + id));
        
        // Verificar se há agências associadas
        // TODO: Implementar verificação de agências associadas
        
        bankRepository.delete(bank);
        log.info("Banco removido com sucesso: {}", id);
    }
    
    // ===== SEARCH OPERATIONS =====
    
    @Transactional(readOnly = true)
    public List<BankDTO> searchBanksByName(String name) {
        log.info("Buscando bancos por nome: {}", name);
        List<Bank> banks = bankRepository.findByNameContainingIgnoreCase(name);
        return banks.stream()
                .map(BankDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BankDTO> searchBanksByCode(String code) {
        log.info("Buscando bancos por código: {}", code);
        List<Bank> banks = bankRepository.findByCodeContainingIgnoreCase(code);
        return banks.stream()
                .map(BankDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BankDTO> getBanksByStatus(Bank.BankStatus status) {
        log.info("Buscando bancos por status: {}", status);
        List<Bank> banks = bankRepository.findByStatus(status);
        return banks.stream()
                .map(BankDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BankDTO> getBanksByState(String state) {
        log.info("Buscando bancos por estado: {}", state);
        List<Bank> banks = bankRepository.findByState(state);
        return banks.stream()
                .map(BankDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    // ===== STATISTICS =====
    
    @Transactional(readOnly = true)
    public Long getTotalBanksCount() {
        return bankRepository.count();
    }
    
    @Transactional(readOnly = true)
    public Long getBanksCountByStatus(Bank.BankStatus status) {
        return bankRepository.countByStatus(status);
    }
    
    @Transactional(readOnly = true)
    public List<String> getDistinctStates() {
        return bankRepository.findDistinctStates();
    }
}
