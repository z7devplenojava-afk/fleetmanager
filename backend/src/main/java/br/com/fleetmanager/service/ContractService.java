package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.ContractDTO;
import br.com.fleetmanager.dto.CreateMessageRequest;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Contract;
import br.com.fleetmanager.model.Client;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.UserGroupEntity;
import br.com.fleetmanager.model.enums.ContractStatus;
import br.com.fleetmanager.model.enums.MessageType;
import br.com.fleetmanager.model.enums.MessagePriority;
import br.com.fleetmanager.model.enums.UserGroup;
import br.com.fleetmanager.repository.ContractRepository;
import br.com.fleetmanager.repository.ClientRepository;
import br.com.fleetmanager.repository.UserGroupRepository;
import br.com.fleetmanager.service.MessageService;
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
import br.com.fleetmanager.dto.MessageRequestDTO;
import java.util.Set;
import br.com.fleetmanager.repository.UserRepository;
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
    
    public List<Contract> findAll() {
        return contractRepository.findAll();
    }
    
    public Page<Contract> findAll(Pageable pageable) {
        return contractRepository.findAll(pageable);
    }
    
    public Optional<Contract> findById(UUID id) {
        return contractRepository.findById(id);
    }
    
    public Contract getById(UUID id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado com ID: " + id));
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
        // Validar se o número do contrato já existe
        if (contractRepository.findByContractNumber(contractDTO.getContractNumber()).isPresent()) {
            throw new BusinessException("Já existe um contrato com o número: " + contractDTO.getContractNumber());
        }
        
        // Buscar o cliente
        Client client = clientRepository.findById(contractDTO.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + contractDTO.getClientId()));
        
        Contract contract = new Contract();
        updateContractFromDTO(contract, contractDTO);
        contract.setClient(client);
        Contract savedContract = contractRepository.save(contract);
        
        // Enviar notificação para os departamentos
        notifyDepartmentsNewContract(savedContract);
        
        return savedContract;
    }
    
    public ContractDTO updateContract(UUID id, ContractDTO contractDTO) {
        Contract existingContract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado com ID: " + id));

        // Validar se o cliente existe
        Client client = clientRepository.findById(contractDTO.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + contractDTO.getClientId()));

        // Atualizar campos
        existingContract.setContractNumber(contractDTO.getContractNumber());
        existingContract.setDescription(contractDTO.getDescription());
        existingContract.setStartDate(contractDTO.getStartDate());
        existingContract.setEndDate(contractDTO.getEndDate());
        existingContract.setValue(contractDTO.getValue());
        existingContract.setStatus(contractDTO.getStatus());
        existingContract.setNotes(contractDTO.getNotes());
        existingContract.setClient(client);
        existingContract.setUpdatedAt(LocalDateTime.now());

        Contract savedContract = contractRepository.save(existingContract);
        return convertToDTO(savedContract);
    }
    
    public void deleteContract(UUID id) {
        if (!contractRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contrato não encontrado com ID: " + id);
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
    
    // Métodos para conversão DTO
    public ContractDTO convertToDTO(Contract contract) {
        ContractDTO dto = new ContractDTO();
        BeanUtils.copyProperties(contract, dto);
        
        if (contract.getClient() != null) {
            dto.setClientId(contract.getClient().getId());
            dto.setClientName(contract.getClient().getName());
            dto.setClientCnpj(contract.getClient().getCnpj());
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
        contract.setNotes(dto.getNotes());
    }
    
    private void notifyDepartmentsNewContract(Contract contract) {
        // Grupos a serem notificados
        UserGroup[] groups = new UserGroup[] {
            UserGroup.GRUPO_FINANCEIRO,
            UserGroup.GRUPO_RH,
            UserGroup.GRUPO_DPE,
            UserGroup.GRUPO_SUPERVISOR
        };

        // Obter usuário autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User sender = null;
        
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            sender = (User) authentication.getPrincipal();
        }
        
        // Se não conseguir obter o usuário autenticado, buscar um usuário padrão
        if (sender == null) {
            try {
                // Buscar um usuário admin ou o primeiro usuário ativo
                User defaultSender = userRepository.findByActiveTrue().stream()
                    .filter(user -> user.getRoles().stream()
                        .anyMatch(role -> role.getName().contains("ADMIN") || role.getName().contains("SUPER_ADMIN")))
                    .findFirst()
                    .orElse(userRepository.findByActiveTrue().stream().findFirst().orElse(null));
                    
                if (defaultSender == null) {
                    log.warn("Não foi possível encontrar um usuário válido para enviar notificações");
                    return; // Não enviar notificações se não houver usuário válido
                }
                sender = defaultSender;
            } catch (Exception e) {
                log.error("Erro ao buscar usuário padrão para notificações", e);
                return; // Não enviar notificações se houver erro
            }
        }

        // Criar uma variável final para usar no lambda
        final User finalSender = sender;

        final String title = "Novo Contrato Criado: " + contract.getContractNumber();
        final String content = String.format(
            "Um novo contrato foi criado para o cliente %s (CNPJ: %s).\n" +
            "Descrição: %s\nValor: R$ %.2f\nInício: %s\nTérmino: %s\n\nProvidencie os recursos necessários para a execução dos serviços.",
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