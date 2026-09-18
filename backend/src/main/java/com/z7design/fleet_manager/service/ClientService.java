package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ClientDTO;
import com.z7design.fleet_manager.exception.BusinessException;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.enums.ClientStatus;
import com.z7design.fleet_manager.repository.ClientRepository;
import org.springframework.beans.BeanUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.z7design.fleet_manager.model.WorkPost;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;

@Service
@Transactional
@Slf4j
public class ClientService {
    
    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private WorkPostRepository workPostRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserCompanyResolver userCompanyResolver;
    
    public ClientDTO createClient(ClientDTO clientDTO) {
        try {
            log.info("[DEBUG] ClientService.createClient - Iniciando criação de cliente");
            log.info("[DEBUG] Nome: {}", clientDTO.getName());
            log.info("[DEBUG] CNPJ (original): {}", clientDTO.getCnpj());
            log.info("[DEBUG] Email: {}", clientDTO.getEmail());
            
            // Normalizar CNPJ para apenas dígitos
            String normalizedCnpj = clientDTO.getCnpj() != null ? clientDTO.getCnpj().replaceAll("\\D", "") : null;
            if (normalizedCnpj == null || normalizedCnpj.isBlank()) {
                throw new BusinessException("CNPJ é obrigatório");
            }
            UUID currentCompanyId = clientDTO.getCompanyId() != null 
                    ? clientDTO.getCompanyId() 
                    : userCompanyResolver.resolveCurrentCompanyId();

            log.info("[DEBUG] Verificando se CNPJ já existe na empresa [{}]: {}", currentCompanyId, normalizedCnpj);
            boolean cnpjExists = currentCompanyId != null 
                    ? clientRepository.existsByCnpjAndCompanyId(normalizedCnpj, currentCompanyId)
                    : clientRepository.existsByCnpj(normalizedCnpj);
            log.info("[DEBUG] CNPJ existe: {}", cnpjExists);
            
            if (cnpjExists) {
                log.error("[ERROR] CNPJ já existe para esta empresa: {}", normalizedCnpj);
                throw new BusinessException("Já existe um cliente cadastrado com este CNPJ nesta empresa: " + normalizedCnpj);
            }
            
            log.info("[DEBUG] CNPJ válido, criando cliente");
            Client client = new Client();
            BeanUtils.copyProperties(clientDTO, client);

            if (client.getCompanyId() == null) {
                client.setCompanyId(currentCompanyId);
            }

            // Forçar salvar CNPJ normalizado
            client.setCnpj(normalizedCnpj);
            
            // Limpar campos vazios para evitar problemas de validaÃ§Ã£o
            if (client.getEmail() != null && client.getEmail().trim().isEmpty()) {
                client.setEmail(null);
            }
            if (client.getContactEmail() != null && client.getContactEmail().trim().isEmpty()) {
                client.setContactEmail(null);
            }
            
            // Validar formato de email se fornecido
            if (client.getEmail() != null && !client.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                log.error("[ERROR] Email invÃ¡lido: {}", client.getEmail());
                throw new BusinessException("Formato de email invÃ¡lido: " + client.getEmail());
            }
            if (client.getContactEmail() != null && !client.getContactEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                log.error("[ERROR] Email de contato invÃ¡lido: {}", client.getContactEmail());
                throw new BusinessException("Formato de email de contato invÃ¡lido: " + client.getContactEmail());
            }
            
            // Definir status padrÃ£o se nÃ£o fornecido
            if (client.getStatus() == null) {
                client.setStatus(ClientStatus.ACTIVE);
                log.info("[DEBUG] Status definido como ACTIVE");
            }
            
            log.info("[DEBUG] Salvando cliente no banco");
            Client savedClient = clientRepository.save(client);
            log.info("[DEBUG] Cliente salvo com ID: {}", savedClient.getId());
            
            ClientDTO savedClientDTO = new ClientDTO();
            BeanUtils.copyProperties(savedClient, savedClientDTO);
            
            log.info("[DEBUG] Cliente criado com sucesso: {}", savedClientDTO.getId());
            return savedClientDTO;
        } catch (Exception e) {
            log.error("[ERROR] Erro ao criar cliente: {}", e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public ClientDTO updateClient(UUID id, ClientDTO clientDTO) {
        Client existingClient = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado com ID: " + id));
        
        // Verificar se o CNPJ foi alterado e se jÃ¡ existe outro cliente com o novo CNPJ
        if (!existingClient.getCnpj().equals(clientDTO.getCnpj()) && 
            clientRepository.existsByCnpj(clientDTO.getCnpj())) {
            throw new BusinessException("JÃ¡ existe um cliente cadastrado com este CNPJ: " + clientDTO.getCnpj());
        }
        
        BeanUtils.copyProperties(clientDTO, existingClient, "id", "createdAt");
        
        Client updatedClient = clientRepository.save(existingClient);
        
        ClientDTO updatedClientDTO = new ClientDTO();
        BeanUtils.copyProperties(updatedClient, updatedClientDTO);
        
        return updatedClientDTO;
    }
    
    public ClientDTO getClientById(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado com ID: " + id));
        
        ClientDTO clientDTO = new ClientDTO();
        BeanUtils.copyProperties(client, clientDTO);
        
        return clientDTO;
    }
    
    public ClientDTO getClientByCnpj(String cnpj) {
        Client client = clientRepository.findByCnpj(cnpj)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado com CNPJ: " + cnpj));
        
        ClientDTO clientDTO = new ClientDTO();
        BeanUtils.copyProperties(client, clientDTO);
        
        return clientDTO;
    }
    
    public Page<ClientDTO> getAllClients(Pageable pageable) {
        Page<Client> clients = clientRepository.findAll(pageable);
        return clients.map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        });
    }
    
    public Page<ClientDTO> searchClients(String searchTerm, Pageable pageable) {
        Page<Client> clients = clientRepository.findBySearchTerm(searchTerm, pageable);
        return clients.map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        });
    }
    
    public Page<ClientDTO> getClientsByStatus(ClientStatus status, Pageable pageable) {
        Page<Client> clients = clientRepository.findByStatus(status, pageable);
        return clients.map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        });
    }
    
    public Page<ClientDTO> getClientsByStatus(ClientStatus status, String searchTerm, Pageable pageable) {
        Page<Client> clients;
        
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            clients = clientRepository.findByStatusAndSearchTerm(status, searchTerm, pageable);
        } else {
            clients = clientRepository.findByStatus(status, pageable);
        }
        
        return clients.map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        });
    }
    
    public List<ClientDTO> getClientsByStatus(ClientStatus status) {
        List<Client> clients = clientRepository.findByStatus(status);
        return clients.stream().map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        }).collect(Collectors.toList());
    }
    
    public void deleteClient(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        log.info("🗑️ Excluindo cliente {} ({})", client.getName(), id);

        // 1. Desvincular veículos alocados às obras/postos deste cliente ou com nome deste cliente
        try {
            List<WorkPost> workPosts = workPostRepository.findByClientId(id);
            if (!workPosts.isEmpty()) {
                List<UUID> wpIds = workPosts.stream().map(WorkPost::getId).collect(Collectors.toList());
                vehicleRepository.clearWorkPostAllocation(wpIds);
            }
            if (client.getName() != null) {
                vehicleRepository.clearClientNameAllocation(client.getName());
            }
        } catch (Exception e) {
            log.warn("Aviso ao desvincular veículos do cliente {}: {}", id, e.getMessage());
        }

        // 2. Excluir postos de trabalho (obras) do cliente
        try {
            List<WorkPost> workPosts = workPostRepository.findByClientId(id);
            if (!workPosts.isEmpty()) {
                workPostRepository.deleteAll(workPosts);
            }
        } catch (Exception e) {
            log.warn("Aviso ao excluir postos do cliente {}: {}", id, e.getMessage());
        }

        // 3. Limpar unidades e contratos do cliente (serão removidos via orphanRemoval)
        try {
            if (client.getUnits() != null) {
                client.getUnits().clear();
            }
            if (client.getContracts() != null) {
                client.getContracts().clear();
            }
        } catch (Exception e) {
            log.warn("Aviso ao limpar unidades e contratos do cliente {}: {}", id, e.getMessage());
        }

        // 4. Excluir o registro do cliente
        try {
            clientRepository.delete(client);
            log.info("✅ Cliente {} ({}) excluído com sucesso!", client.getName(), id);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("Erro de integridade ao excluir cliente {}: {}", client.getName(), e.getMessage());
            throw new BusinessException("Não é possível excluir o cliente '" + client.getName() + 
                    "' porque ele possui registros vinculados (faturas, contas a receber, ordens de serviço ou partes diárias).");
        }
    }
    
    public void updateClientStatus(UUID id, ClientStatus status) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado com ID: " + id));
        
        client.setStatus(status);
        clientRepository.save(client);
    }
    
    public long countClientsByStatus(ClientStatus status) {
        return clientRepository.countByStatus(status);
    }
    
    public boolean existsByCnpj(String cnpj) {
        return clientRepository.existsByCnpj(cnpj);
    }
} 
