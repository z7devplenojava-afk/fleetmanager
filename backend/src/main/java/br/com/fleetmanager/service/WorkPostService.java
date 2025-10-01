package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.WorkPostDTO;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.WorkPost;
import br.com.fleetmanager.model.Client;
import br.com.fleetmanager.model.Contract;
import br.com.fleetmanager.model.User;
import br.com.fleetmanager.model.enums.WorkPostStatus;
import br.com.fleetmanager.model.enums.WorkPostType;
import br.com.fleetmanager.repository.WorkPostRepository;
import br.com.fleetmanager.repository.ClientRepository;
import br.com.fleetmanager.repository.ContractRepository;
import br.com.fleetmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkPostService {
    
    private final WorkPostRepository workPostRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    
    // Métodos básicos CRUD
    public List<WorkPost> findAll() {
        return workPostRepository.findAllWithRelations(); // Usar método com JOIN FETCH
    }
    
    public Page<WorkPost> findAll(Pageable pageable) {
        return workPostRepository.findAll(pageable);
    }
    
    public Optional<WorkPost> findById(UUID id) {
        return workPostRepository.findById(id);
    }
    
    public WorkPost getById(UUID id) {
        return workPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Posto de trabalho não encontrado com ID: " + id));
    }
    
    public Optional<WorkPost> findByPostCode(String postCode) {
        return workPostRepository.findByPostCode(postCode);
    }
    
    // Métodos de busca por filtros
    public List<WorkPost> findByStatus(WorkPostStatus status) {
        return workPostRepository.findByStatus(status);
    }
    
    public Page<WorkPost> findByStatus(WorkPostStatus status, Pageable pageable) {
        return workPostRepository.findByStatus(status, pageable);
    }
    
    public List<WorkPost> findByType(WorkPostType type) {
        return workPostRepository.findByType(type);
    }
    
    public Page<WorkPost> findByType(WorkPostType type, Pageable pageable) {
        return workPostRepository.findByType(type, pageable);
    }
    
    public List<WorkPost> findByClient(UUID clientId) {
        return workPostRepository.findByClientId(clientId);
    }
    
    public Page<WorkPost> findByClient(UUID clientId, Pageable pageable) {
        return workPostRepository.findByClientId(clientId, pageable);
    }
    
    public List<WorkPost> findByContract(UUID contractId) {
        return workPostRepository.findByContractId(contractId);
    }
    
    public Page<WorkPost> findByContract(UUID contractId, Pageable pageable) {
        return workPostRepository.findByContractId(contractId, pageable);
    }
    
    public List<WorkPost> findByResponsible(UUID responsibleId) {
        return workPostRepository.findByResponsibleId(responsibleId);
    }
    
    public Page<WorkPost> findByResponsible(UUID responsibleId, Pageable pageable) {
        return workPostRepository.findByResponsibleId(responsibleId, pageable);
    }
    
    public List<WorkPost> findByNameContaining(String name) {
        return workPostRepository.findByNameContainingIgnoreCase(name);
    }
    
    public Page<WorkPost> findByNameContaining(String name, Pageable pageable) {
        return workPostRepository.findByNameContainingIgnoreCase(name, pageable);
    }
    
    public List<WorkPost> findByAddressContaining(String address) {
        return workPostRepository.findByAddressContainingIgnoreCase(address);
    }
    
    public Page<WorkPost> findByAddressContaining(String address, Pageable pageable) {
        return workPostRepository.findByAddressContainingIgnoreCase(address, pageable);
    }
    
    public List<WorkPost> findByCity(String city) {
        return workPostRepository.findByCityIgnoreCase(city);
    }
    
    public Page<WorkPost> findByCity(String city, Pageable pageable) {
        return workPostRepository.findByCityIgnoreCase(city, pageable);
    }
    
    public List<WorkPost> findByState(String state) {
        return workPostRepository.findByStateIgnoreCase(state);
    }
    
    public Page<WorkPost> findByState(String state, Pageable pageable) {
        return workPostRepository.findByStateIgnoreCase(state, pageable);
    }
    
    public Page<WorkPost> findByFilters(UUID clientId, WorkPostStatus status, WorkPostType type, String searchTerm, Pageable pageable) {
        return workPostRepository.findByFilters(clientId, status, type, searchTerm, pageable);
    }
    
    // Métodos de criação e atualização
    public WorkPost createWorkPost(WorkPostDTO workPostDTO) {
        // Validar se o código do posto já existe
        if (workPostRepository.existsByPostCode(workPostDTO.getPostCode())) {
            throw new BusinessException("Já existe um posto com o código: " + workPostDTO.getPostCode());
        }
        
        // Buscar o cliente
        Client client = clientRepository.findById(workPostDTO.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + workPostDTO.getClientId()));
        
        // Buscar o contrato (se informado)
        Contract contract = null;
        if (workPostDTO.getContractId() != null) {
            contract = contractRepository.findById(workPostDTO.getContractId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado com ID: " + workPostDTO.getContractId()));
        }
        
        // Buscar o responsável (se informado)
        User responsible = null;
        if (workPostDTO.getResponsibleId() != null) {
            responsible = userRepository.findById(workPostDTO.getResponsibleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário responsável não encontrado com ID: " + workPostDTO.getResponsibleId()));
        }
        
        WorkPost workPost = new WorkPost();
        updateWorkPostFromDTO(workPost, workPostDTO);
        workPost.setClient(client);
        workPost.setContract(contract);
        workPost.setResponsible(responsible);
        workPost.setStatus(workPostDTO.getStatus() != null ? workPostDTO.getStatus() : WorkPostStatus.EM_IMPLANTACAO);
        workPost.setCreatedAt(LocalDateTime.now());
        workPost.setUpdatedAt(LocalDateTime.now());
        
        return workPostRepository.save(workPost);
    }
    
    public WorkPostDTO updateWorkPost(UUID id, WorkPostDTO workPostDTO) {
        WorkPost existingWorkPost = workPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Posto de trabalho não encontrado com ID: " + id));
        
        // Validar se o código do posto já existe (se foi alterado)
        if (!existingWorkPost.getPostCode().equals(workPostDTO.getPostCode()) && 
            workPostRepository.existsByPostCode(workPostDTO.getPostCode())) {
            throw new BusinessException("Já existe um posto com o código: " + workPostDTO.getPostCode());
        }
        
        // Buscar o cliente
        Client client = clientRepository.findById(workPostDTO.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + workPostDTO.getClientId()));
        
        // Buscar o contrato (se informado)
        Contract contract = null;
        if (workPostDTO.getContractId() != null) {
            contract = contractRepository.findById(workPostDTO.getContractId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado com ID: " + workPostDTO.getContractId()));
        }
        
        // Buscar o responsável (se informado)
        User responsible = null;
        if (workPostDTO.getResponsibleId() != null) {
            responsible = userRepository.findById(workPostDTO.getResponsibleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário responsável não encontrado com ID: " + workPostDTO.getResponsibleId()));
        }
        
        // Atualizar campos
        updateWorkPostFromDTO(existingWorkPost, workPostDTO);
        existingWorkPost.setClient(client);
        existingWorkPost.setContract(contract);
        existingWorkPost.setResponsible(responsible);
        existingWorkPost.setUpdatedAt(LocalDateTime.now());
        
        WorkPost savedWorkPost = workPostRepository.save(existingWorkPost);
        return convertToDTO(savedWorkPost);
    }
    
    public void deleteWorkPost(UUID id) {
        if (!workPostRepository.existsById(id)) {
            throw new ResourceNotFoundException("Posto de trabalho não encontrado com ID: " + id);
        }
        workPostRepository.deleteById(id);
    }
    
    public WorkPost updateStatus(UUID id, WorkPostStatus status) {
        WorkPost workPost = getById(id);
        workPost.setStatus(status);
        workPost.setUpdatedAt(LocalDateTime.now());
        return workPostRepository.save(workPost);
    }
    
    // Métodos de contagem
    public long countByStatus(WorkPostStatus status) {
        return workPostRepository.countByStatus(status);
    }
    
    public long countByClient(UUID clientId) {
        return workPostRepository.countByClientId(clientId);
    }
    
    public long countByType(WorkPostType type) {
        return workPostRepository.countByType(type);
    }
    
    // Métodos de busca por período
    public List<WorkPost> findPostsToBeImplementedBetween(LocalDate startDate, LocalDate endDate) {
        return workPostRepository.findPostsToBeImplementedBetween(startDate, endDate);
    }
    
    public List<WorkPost> findByStatusAndImplementationDateBetween(WorkPostStatus status, LocalDate startDate, LocalDate endDate) {
        return workPostRepository.findByStatusAndImplementationDateBetween(status, startDate, endDate);
    }
    
    // Métodos para conversão DTO
    public WorkPostDTO convertToDTO(WorkPost workPost) {
        WorkPostDTO dto = new WorkPostDTO();
        BeanUtils.copyProperties(workPost, dto);
        
        // Tratar relacionamentos de forma segura
        try {
            if (workPost.getClient() != null) {
                dto.setClientId(workPost.getClient().getId());
                dto.setClientName(workPost.getClient().getName());
                dto.setClientCnpj(workPost.getClient().getCnpj());
            } else {
                // Cliente não encontrado - definir valores padrão
                dto.setClientName("Cliente não encontrado");
                dto.setClientCnpj("N/A");
            }
        } catch (Exception e) {
            // Em caso de erro ao acessar o cliente, definir valores padrão
            dto.setClientName("Cliente não encontrado");
            dto.setClientCnpj("N/A");
        }
        
        try {
            if (workPost.getContract() != null) {
                dto.setContractId(workPost.getContract().getId());
            }
        } catch (Exception e) {
            // Contrato não encontrado - não definir contractId
        }
        
        try {
            if (workPost.getResponsible() != null) {
                dto.setResponsibleId(workPost.getResponsible().getId());
                dto.setResponsibleName(workPost.getResponsible().getName());
            }
        } catch (Exception e) {
            // Responsável não encontrado - não definir responsibleId
        }
        
        return dto;
    }
    
    public Page<WorkPostDTO> convertToDTOPage(Page<WorkPost> workPosts) {
        return workPosts.map(this::convertToDTO);
    }
    
    public List<WorkPostDTO> convertToDTOList(List<WorkPost> workPosts) {
        return workPosts.stream()
                .map(this::convertToDTO)
                .toList();
    }
    
    private void updateWorkPostFromDTO(WorkPost workPost, WorkPostDTO dto) {
        workPost.setPostCode(dto.getPostCode());
        workPost.setName(dto.getName());
        workPost.setDescription(dto.getDescription());
        workPost.setType(dto.getType());
        // Define status, se não for nulo no DTO, ou mantém o valor existente/padrão
        if (dto.getStatus() != null) {
            workPost.setStatus(dto.getStatus());
        } else if (workPost.getStatus() == null) {
            workPost.setStatus(WorkPostStatus.EM_IMPLANTACAO);
        }
        workPost.setAddress(dto.getAddress());
        workPost.setCity(dto.getCity());
        workPost.setState(dto.getState());
        workPost.setZipCode(dto.getZipCode());
        
        // Campos que podem ser nulos no DTO mas não no DB
        workPost.setRequiredVigilantes(dto.getRequiredVigilantes()); // @NotNull no DTO, deve ser sempre enviado
        workPost.setWorkSchedule(dto.getWorkSchedule()); // @NotBlank no DTO, deve ser sempre enviado
        workPost.setShiftStart(dto.getShiftStart()); // @NotNull no DTO, deve ser sempre enviado
        workPost.setShiftEnd(dto.getShiftEnd()); // @NotNull no DTO, deve ser sempre enviado

        workPost.setShiftDescription(dto.getShiftDescription());

        workPost.setTransportVoucher(dto.getTransportVoucher() != null ? dto.getTransportVoucher() : false);
        workPost.setCostAllowance(dto.getCostAllowance() != null ? dto.getCostAllowance() : false);
        workPost.setCostAllowanceValue(dto.getCostAllowanceValue() != null ? dto.getCostAllowanceValue() : BigDecimal.ZERO);
        workPost.setIntrajourney(dto.getIntrajourney() != null ? dto.getIntrajourney() : false);
        workPost.setLocalMeal(dto.getLocalMeal() != null ? dto.getLocalMeal() : false);
        workPost.setMealTicket(dto.getMealTicket() != null ? dto.getMealTicket() : false);
        workPost.setHealthPlan(dto.getHealthPlan() != null ? dto.getHealthPlan() : false);
        workPost.setDentalPlan(dto.getDentalPlan() != null ? dto.getDentalPlan() : false);
        
        workPost.setCars(dto.getCars() != null ? dto.getCars() : 0);
        workPost.setMotorcycles(dto.getMotorcycles() != null ? dto.getMotorcycles() : 0);
        workPost.setRadios(dto.getRadios() != null ? dto.getRadios() : 0);
        workPost.setCorporates(dto.getCorporates() != null ? dto.getCorporates() : 0);
        workPost.setDocumentBank(dto.getDocumentBank() != null ? dto.getDocumentBank() : false);
        
        // Listas (assumindo que o DTO enviaria listas vazias, não null)
        workPost.setNrs(dto.getNrs());
        workPost.setEpis(dto.getEpis());
        workPost.setTrainings(dto.getTrainings());

        workPost.setPgr(dto.getPgr() != null ? dto.getPgr() : false);
        workPost.setPcmso(dto.getPcmso() != null ? dto.getPcmso() : false);

        workPost.setImplementationDate(dto.getImplementationDate());
        workPost.setImplementationTime(dto.getImplementationTime());
        workPost.setObservations(dto.getObservations());
    }
} 