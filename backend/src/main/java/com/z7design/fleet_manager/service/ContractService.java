package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ContractDTO;
import com.z7design.fleet_manager.dto.CreateMessageRequest;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Contract;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.model.UserGroupEntity;
import com.z7design.fleet_manager.model.enums.ContractStatus;
import com.z7design.fleet_manager.model.enums.ContractType;
import com.z7design.fleet_manager.model.enums.MessageType;
import com.z7design.fleet_manager.model.enums.MessagePriority;
import com.z7design.fleet_manager.model.enums.UserGroup;
import com.z7design.fleet_manager.repository.ContractRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.UserGroupRepository;
import com.z7design.fleet_manager.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.z7design.fleet_manager.dto.MessageRequestDTO;
import java.util.Set;
import com.z7design.fleet_manager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
@Transactional
public class ContractService {
    
    private static final Logger log = LoggerFactory.getLogger(ContractService.class);

    private final ContractRepository contractRepository;
    private final ClientRepository clientRepository;
    private final MessageService messageService;
    private final UserGroupRepository userGroupRepository;
    private final UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<Contract> findAll() {
        List<Contract> contracts = contractRepository.findAll();
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        for (Contract contract : contracts) {
            if (contract.getClient() != null) {
                try {
                    contract.getClient().getName(); // ForÃ§a inicializaÃ§Ã£o
                } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                    // Client foi deletado ou nÃ£o pode ser inicializado
                    contract.setClient(null);
                }
            }
        }
        return contracts;
    }
    
    @Transactional(readOnly = true)
    public Page<Contract> findAll(Pageable pageable) {
        Page<Contract> contracts = contractRepository.findAll(pageable);
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        for (Contract contract : contracts.getContent()) {
            if (contract.getClient() != null) {
                try {
                    contract.getClient().getName(); // ForÃ§a inicializaÃ§Ã£o
                } catch (org.hibernate.LazyInitializationException | jakarta.persistence.EntityNotFoundException e) {
                    // Client foi deletado ou nÃ£o pode ser inicializado
                    contract.setClient(null);
                }
            }
        }
        return contracts;
    }
    
    public Optional<Contract> findById(UUID id) {
        return contractRepository.findById(id);
    }
    
    public Contract getById(UUID id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contrato nÃ£o encontrado com ID: " + id));
    }
    
    public List<Contract> findByStatus(ContractStatus status) {
        return contractRepository.findByStatus(status);
    }
    
    public Page<Contract> findByStatus(ContractStatus status, Pageable pageable) {
        return contractRepository.findByStatus(status, pageable);
    }
    
    public List<Contract> findByClient(UUID clientId) {
        return contractRepository.findByClientId(clientId);
    }
    
    public Page<Contract> findByClient(UUID clientId, Pageable pageable) {
        return contractRepository.findByClientId(clientId, pageable);
    }
    
    public Optional<Contract> findByContractNumber(String contractNumber) {
        return contractRepository.findByContractNumber(contractNumber);
    }
    
    public List<Contract> findByStartDateBetween(LocalDate startDate, LocalDate endDate) {
        return contractRepository.findByStartDateBetween(startDate, endDate);
    }
    
    public List<Contract> findByEndDateBetween(LocalDate startDate, LocalDate endDate) {
        return contractRepository.findByEndDateBetween(startDate, endDate);
    }
    
    public List<Contract> findActiveContracts() {
        return contractRepository.findByStatusAndEndDateAfter(ContractStatus.ACTIVE, LocalDate.now());
    }
    
    public List<Contract> findExpiredContracts() {
        return contractRepository.findByStatusAndEndDateBefore(ContractStatus.ACTIVE, LocalDate.now());
    }
    
    public List<Contract> findContractsExpiringBetween(LocalDate startDate, LocalDate endDate) {
        return contractRepository.findContractsExpiringBetween(startDate, endDate);
    }
    
    public Page<Contract> findByFilters(UUID clientId, ContractStatus status, String searchTerm, Pageable pageable) {
        return contractRepository.findByFilters(clientId, status, searchTerm, pageable);
    }
    
    public Contract createContract(ContractDTO contractDTO) {
        // Validar se o nÃºmero do contrato jÃ¡ existe
        if (contractRepository.findByContractNumber(contractDTO.getContractNumber()).isPresent()) {
            throw new BusinessException("JÃ¡ existe um contrato com o nÃºmero: " + contractDTO.getContractNumber());
        }
        
        // Buscar o cliente
        Client client = clientRepository.findById(contractDTO.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado com ID: " + contractDTO.getClientId()));
        
        Contract contract = new Contract();
        updateContractFromDTO(contract, contractDTO);
        contract.setClient(client);
        Contract savedContract = contractRepository.save(contract);
        
        // Enviar notificaÃ§Ã£o para os departamentos
        notifyDepartmentsNewContract(savedContract);
        
        return savedContract;
    }
    
    public ContractDTO updateContract(UUID id, ContractDTO contractDTO) {
        Contract existingContract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contrato nÃ£o encontrado com ID: " + id));

        // Validar se o cliente existe
        Client client = clientRepository.findById(contractDTO.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado com ID: " + contractDTO.getClientId()));

        // Atualizar campos
        existingContract.setContractNumber(contractDTO.getContractNumber());
        existingContract.setDescription(contractDTO.getDescription());
        existingContract.setStartDate(contractDTO.getStartDate());
        existingContract.setEndDate(contractDTO.getEndDate());
        existingContract.setValue(contractDTO.getValue());
        existingContract.setStatus(contractDTO.getStatus());
        existingContract.setContractType(contractDTO.getContractType());
        existingContract.setNotes(contractDTO.getNotes());
        existingContract.setObraName(contractDTO.getObraName());
        existingContract.setVehicleQuantity(contractDTO.getVehicleQuantity());
        existingContract.setUnitVehicleValue(contractDTO.getUnitVehicleValue());
        existingContract.setServiceType(contractDTO.getServiceType());
        existingContract.setVehicleDescription(contractDTO.getVehicleDescription());
        existingContract.setVigenciaText(contractDTO.getVigenciaText());
        existingContract.setClient(client);
        existingContract.setUpdatedAt(LocalDateTime.now());

        Contract savedContract = contractRepository.save(existingContract);
        return convertToDTO(savedContract);
    }
    
    public void deleteContract(UUID id) {
        if (!contractRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contrato nÃ£o encontrado com ID: " + id);
        }
        contractRepository.deleteById(id);
    }
    
    public Contract updateStatus(UUID id, ContractStatus status) {
        Contract contract = getById(id);
        contract.setStatus(status);
        return contractRepository.save(contract);
    }
    
    public long countByStatus(ContractStatus status) {
        return contractRepository.countByStatus(status);
    }
    
    public long countByClient(UUID clientId) {
        return contractRepository.countByClientId(clientId);
    }
    
    // MÃ©todos para conversÃ£o DTO
    @Transactional(readOnly = true)
    public ContractDTO convertToDTO(Contract contract) {
        ContractDTO dto = new ContractDTO();
        BeanUtils.copyProperties(contract, dto);
        
        // Inicializar relacionamento lazy do Client dentro da transaÃ§Ã£o
        if (contract.getClient() != null) {
            try {
                // ForÃ§ar inicializaÃ§Ã£o do proxy lazy
                contract.getClient().getName();
                dto.setClientId(contract.getClient().getId());
                dto.setClientName(contract.getClient().getName());
                dto.setClientCnpj(contract.getClient().getCnpj());
            } catch (org.hibernate.LazyInitializationException e) {
                // Se o Client nÃ£o puder ser inicializado, definir apenas o ID
                dto.setClientId(contract.getClient().getId());
                log.warn("NÃ£o foi possÃ­vel inicializar o Client para o contrato {}", contract.getId());
            }
        }
        
        return dto;
    }
    
    public Page<ContractDTO> convertToDTOPage(Page<Contract> contracts) {
        return contracts.map(this::convertToDTO);
    }
    
    public List<ContractDTO> convertToDTOList(List<Contract> contracts) {
        return contracts.stream()
                .map(this::convertToDTO)
                .toList();
    }
    
    private void updateContractFromDTO(Contract contract, ContractDTO dto) {
        contract.setContractNumber(dto.getContractNumber());
        contract.setDescription(dto.getDescription());
        contract.setStartDate(dto.getStartDate());
        contract.setEndDate(dto.getEndDate());
        contract.setValue(dto.getValue());
        contract.setStatus(dto.getStatus() != null ? dto.getStatus() : ContractStatus.ACTIVE);
        contract.setContractType(dto.getContractType());
        contract.setNotes(dto.getNotes());
        contract.setObraName(dto.getObraName());
        contract.setVehicleQuantity(dto.getVehicleQuantity());
        contract.setUnitVehicleValue(dto.getUnitVehicleValue());
        contract.setServiceType(dto.getServiceType());
        contract.setVehicleDescription(dto.getVehicleDescription());
        contract.setVigenciaText(dto.getVigenciaText());
    }
    
    private void notifyDepartmentsNewContract(Contract contract) {
        // Grupos a serem notificados
        UserGroup[] groups = new UserGroup[] {
            UserGroup.GRUPO_FINANCEIRO,
            UserGroup.GRUPO_RH,
            UserGroup.GRUPO_DPE,
            UserGroup.GRUPO_SUPERVISOR
        };

        // Obter usuÃ¡rio autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User sender = null;
        
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            sender = (User) authentication.getPrincipal();
        }
        
        // Se nÃ£o conseguir obter o usuÃ¡rio autenticado, buscar um usuÃ¡rio padrÃ£o
        if (sender == null) {
            try {
                // Buscar um usuÃ¡rio admin ou o primeiro usuÃ¡rio ativo
                User defaultSender = userRepository.findByActiveTrue().stream()
                    .filter(user -> user.getRoles().stream()
                        .anyMatch(role -> role.getName().contains("ADMIN") || role.getName().contains("SUPER_ADMIN")))
                    .findFirst()
                    .orElse(userRepository.findByActiveTrue().stream().findFirst().orElse(null));
                    
                if (defaultSender == null) {
                    log.warn("NÃ£o foi possÃ­vel encontrar um usuÃ¡rio vÃ¡lido para enviar notificaÃ§Ãµes");
                    return; // NÃ£o enviar notificaÃ§Ãµes se nÃ£o houver usuÃ¡rio vÃ¡lido
                }
                sender = defaultSender;
            } catch (Exception e) {
                log.error("Erro ao buscar usuÃ¡rio padrÃ£o para notificaÃ§Ãµes", e);
                return; // NÃ£o enviar notificaÃ§Ãµes se houver erro
            }
        }

        // Criar uma variÃ¡vel final para usar no lambda
        final User finalSender = sender;

        final String title = "Novo Contrato Criado: " + contract.getContractNumber();
        final String content = String.format(
            "Um novo contrato foi criado para o cliente %s (CNPJ: %s).\n" +
            "DescriÃ§Ã£o: %s\nValor: R$ %.2f\nInÃ­cio: %s\nTÃ©rmino: %s\n\nProvidencie os recursos necessÃ¡rios para a execuÃ§Ã£o dos serviÃ§os.",
            contract.getClient().getName(),
            contract.getClient().getCnpj(),
            contract.getDescription(),
            contract.getValue(),
            contract.getStartDate(),
            contract.getEndDate() != null ? contract.getEndDate().toString() : "-"
        );

        for (UserGroup groupEnum : groups) {
            userGroupRepository.findByGroupName(groupEnum)
                .ifPresent(groupEntity -> sendContractNotificationMessage(title, content, groupEntity.getId(), finalSender));
        }
    }

    private void sendContractNotificationMessage(String title, String content, UUID groupId, User sender) {
        MessageRequestDTO req = new MessageRequestDTO();
        req.setTitle(title);
        req.setContent(content);
        req.setType(MessageType.GROUP);
        req.setPriority(MessagePriority.HIGH);
        req.setSendNotification(true);
        req.setSendEmail(false);
        req.setGroupIds(Set.of(groupId));
        
        // Converter CreateMessageRequest para MessageRequestDTO
        messageService.createMessage(req, sender);
    }
} 
