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
import com.z7design.fleet_manager.model.AccountsReceivable;
import com.z7design.fleet_manager.repository.WorkPostRepository;
import com.z7design.fleet_manager.repository.VehicleRepository;
import com.z7design.fleet_manager.repository.AccountsReceivableRepository;
import com.z7design.fleet_manager.security.TenantSecurityValidator;

@Service
@Transactional
@Slf4j
@lombok.RequiredArgsConstructor
public class ClientService {
    
    private final ClientRepository clientRepository;
    private final WorkPostRepository workPostRepository;
    private final VehicleRepository vehicleRepository;
    private final AccountsReceivableRepository accountsReceivableRepository;
    private final UserCompanyResolver userCompanyResolver;
    private final TenantSecurityValidator tenantSecurityValidator;
    
    private UUID resolveCurrentTenantId() {
        UUID tenantId = com.z7design.fleet_manager.tenant.TenantContext.get();
        if (tenantId == null && userCompanyResolver != null) {
            tenantId = userCompanyResolver.resolveCurrentCompanyId();
        }
        return tenantId;
    }

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
            UUID effectiveCompanyId = tenantSecurityValidator.getEffectiveCompanyId(clientDTO.getCompanyId());

            log.info("[DEBUG] Verificando se CNPJ já existe na empresa [{}]: {}", effectiveCompanyId, normalizedCnpj);
            boolean cnpjExists = effectiveCompanyId != null 
                    ? clientRepository.existsByCnpjAndCompanyId(normalizedCnpj, effectiveCompanyId)
                    : clientRepository.existsByCnpj(normalizedCnpj);
            log.info("[DEBUG] CNPJ existe: {}", cnpjExists);
            
            if (cnpjExists) {
                log.error("[ERROR] CNPJ já existe para esta empresa: {}", normalizedCnpj);
                throw new BusinessException("Já existe um cliente cadastrado com este CNPJ nesta empresa: " + normalizedCnpj);
            }
            
            log.info("[DEBUG] CNPJ válido, criando cliente");
            Client client = new Client();
            BeanUtils.copyProperties(clientDTO, client);

            client.setCompanyId(effectiveCompanyId);

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
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        tenantSecurityValidator.validateTenantAccess(existingClient.getCompanyId());
        
        // Normalizar CNPJ
        String normalizedCnpj = clientDTO.getCnpj() != null ? clientDTO.getCnpj().replaceAll("\\D", "") : null;

        // Verificar se o CNPJ foi alterado e se já existe outro cliente com o novo CNPJ na mesma empresa
        if (normalizedCnpj != null && !normalizedCnpj.equals(existingClient.getCnpj())) {
            boolean exists = existingClient.getCompanyId() != null
                    ? clientRepository.existsByCnpjAndCompanyId(normalizedCnpj, existingClient.getCompanyId())
                    : clientRepository.existsByCnpj(normalizedCnpj);
            if (exists) {
                throw new BusinessException("Já existe um cliente cadastrado com este CNPJ: " + clientDTO.getCnpj());
            }
        }
        
        BeanUtils.copyProperties(clientDTO, existingClient, "id", "createdAt", "companyId");
        if (normalizedCnpj != null) {
            existingClient.setCnpj(normalizedCnpj);
        }
        
        Client updatedClient = clientRepository.save(existingClient);
        
        ClientDTO updatedClientDTO = new ClientDTO();
        BeanUtils.copyProperties(updatedClient, updatedClientDTO);
        
        return updatedClientDTO;
    }
    
    public ClientDTO getClientById(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        tenantSecurityValidator.validateTenantAccess(client.getCompanyId());
        
        ClientDTO clientDTO = new ClientDTO();
        BeanUtils.copyProperties(client, clientDTO);
        
        return clientDTO;
    }
    
    public ClientDTO getClientByCnpj(String cnpj) {
        String normalizedCnpj = cnpj != null ? cnpj.replaceAll("\\D", "") : "";
        UUID tenantId = resolveCurrentTenantId();
        
        Client client;
        if (tenantId != null) {
            client = clientRepository.findByCnpjAndCompanyId(normalizedCnpj, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com CNPJ: " + cnpj));
        } else if (tenantSecurityValidator.isSuperAdmin()) {
            client = clientRepository.findByCnpj(normalizedCnpj)
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com CNPJ: " + cnpj));
        } else {
            throw new ResourceNotFoundException("Cliente não encontrado com CNPJ: " + cnpj);
        }
        
        ClientDTO clientDTO = new ClientDTO();
        BeanUtils.copyProperties(client, clientDTO);
        
        return clientDTO;
    }
    
    public Page<ClientDTO> getAllClients(Pageable pageable) {
        UUID tenantId = resolveCurrentTenantId();
        Page<Client> clients;
        
        if (tenantId != null) {
            clients = clientRepository.findByCompanyIdOrCompanyIdIsNull(tenantId, pageable);
        } else if (tenantSecurityValidator.isSuperAdmin()) {
            clients = clientRepository.findAll(pageable);
        } else {
            clients = clientRepository.findByCompanyIdOrCompanyIdIsNull(null, pageable);
        }
        
        return clients.map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        });
    }
    
    public Page<ClientDTO> searchClients(String searchTerm, Pageable pageable) {
        UUID tenantId = resolveCurrentTenantId();
        Page<Client> clients;
        
        if (tenantId != null) {
            clients = clientRepository.findBySearchTermAndCompanyId(searchTerm, tenantId, pageable);
        } else if (tenantSecurityValidator.isSuperAdmin()) {
            clients = clientRepository.findBySearchTerm(searchTerm, pageable);
        } else {
            clients = clientRepository.findBySearchTerm(searchTerm, pageable);
        }
        
        return clients.map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        });
    }
    
    public Page<ClientDTO> getClientsByStatus(ClientStatus status, Pageable pageable) {
        UUID tenantId = resolveCurrentTenantId();
        Page<Client> clients;
        
        if (tenantId != null) {
            clients = clientRepository.findByStatusAndCompanyIdOrCompanyIdIsNull(status, tenantId, pageable);
        } else if (tenantSecurityValidator.isSuperAdmin()) {
            clients = clientRepository.findByStatus(status, pageable);
        } else {
            clients = clientRepository.findByStatus(status, pageable);
        }
        
        return clients.map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        });
    }
    
    public Page<ClientDTO> getClientsByStatus(ClientStatus status, String searchTerm, Pageable pageable) {
        UUID tenantId = resolveCurrentTenantId();
        Page<Client> clients;
        
        if (tenantId != null) {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                clients = clientRepository.findByStatusAndSearchTermAndCompanyId(status, searchTerm, tenantId, pageable);
            } else {
                clients = clientRepository.findByStatusAndCompanyIdOrCompanyIdIsNull(status, tenantId, pageable);
            }
        } else if (tenantSecurityValidator.isSuperAdmin()) {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                clients = clientRepository.findByStatusAndSearchTerm(status, searchTerm, pageable);
            } else {
                clients = clientRepository.findByStatus(status, pageable);
            }
        } else {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                clients = clientRepository.findByStatusAndSearchTerm(status, searchTerm, pageable);
            } else {
                clients = clientRepository.findByStatus(status, pageable);
            }
        }
        
        return clients.map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        });
    }
    
    public List<ClientDTO> getClientsByStatus(ClientStatus status) {
        UUID tenantId = resolveCurrentTenantId();
        List<Client> clients;
        
        if (tenantId != null) {
            clients = clientRepository.findByStatusAndCompanyIdOrCompanyIdIsNull(status, tenantId);
        } else if (tenantSecurityValidator.isSuperAdmin()) {
            clients = clientRepository.findByStatus(status);
        } else {
            clients = clientRepository.findByStatus(status);
        }
        
        return clients.stream().map(client -> {
            ClientDTO clientDTO = new ClientDTO();
            BeanUtils.copyProperties(client, clientDTO);
            return clientDTO;
        }).collect(Collectors.toList());
    }
    
    public void deleteClient(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        tenantSecurityValidator.validateTenantAccess(client.getCompanyId());
        
        log.info("🗑️ Excluindo cliente {} ({})", client.getName(), id);

        // 1. Verificar registros financeiros em Contas a Receber
        try {
            List<AccountsReceivable> receivables = accountsReceivableRepository.findByClientId(id);
            if (receivables != null && !receivables.isEmpty()) {
                throw new BusinessException("Não é possível excluir o cliente '" + client.getName() + 
                        "' porque ele possui " + receivables.size() + " lançamento(s) em Contas a Receber. Para manter a integridade fiscal e contábil, altere o status do cliente para INATIVO.");
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.warn("Aviso ao verificar contas a receber do cliente {}: {}", id, e.getMessage());
        }

        // 2. Desvincular veículos alocados às obras/postos deste cliente ou com nome deste cliente
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

        // 3. Excluir postos de trabalho (obras) do cliente
        try {
            List<WorkPost> workPosts = workPostRepository.findByClientId(id);
            if (!workPosts.isEmpty()) {
                workPostRepository.deleteAll(workPosts);
                workPostRepository.flush();
            }
        } catch (Exception e) {
            log.warn("Aviso ao excluir postos do cliente {}: {}", id, e.getMessage());
        }

        // 4. Limpar unidades e contratos do cliente (serão removidos via orphanRemoval)
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

        // 5. Excluir o registro do cliente com flush imediato
        try {
            clientRepository.delete(client);
            clientRepository.flush();
            log.info("✅ Cliente {} ({}) excluído com sucesso!", client.getName(), id);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("Erro de integridade ao excluir cliente {}: {}", client.getName(), e.getMessage());
            throw new BusinessException("Não é possível excluir o cliente '" + client.getName() + 
                    "' porque ele possui registros vinculados no sistema (faturas, ordens de serviço ou partes diárias). Altere seu status para INATIVO.");
        } catch (Exception e) {
            log.error("Erro ao excluir cliente {}: {}", client.getName(), e.getMessage());
            throw new BusinessException("Não é possível excluir o cliente '" + client.getName() + 
                    "'. Motivo: " + e.getMessage());
        }
    }
    
    public void updateClientStatus(UUID id, ClientStatus status) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        tenantSecurityValidator.validateTenantAccess(client.getCompanyId());

        client.setStatus(status);
        clientRepository.save(client);
    }
    
    public long countClientsByStatus(ClientStatus status) {
        UUID tenantId = resolveCurrentTenantId();
        if (tenantId != null) {
            return clientRepository.countByStatusAndCompanyId(status, tenantId);
        } else if (tenantSecurityValidator.isSuperAdmin()) {
            return clientRepository.countByStatus(status);
        }
        return 0L;
    }
    
    public boolean existsByCnpj(String cnpj) {
        String normalizedCnpj = cnpj != null ? cnpj.replaceAll("\\D", "") : "";
        UUID tenantId = resolveCurrentTenantId();
        if (tenantId != null) {
            return clientRepository.existsByCnpjAndCompanyId(normalizedCnpj, tenantId);
        }
        return clientRepository.existsByCnpj(normalizedCnpj);
    }
} 
