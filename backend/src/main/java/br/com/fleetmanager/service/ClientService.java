package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.ClientDTO;
import br.com.fleetmanager.exception.BusinessException;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Client;
import br.com.fleetmanager.model.enums.ClientStatus;
import br.com.fleetmanager.repository.ClientRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClientService {
    
    @Autowired
    private ClientRepository clientRepository;
    
    public ClientDTO createClient(ClientDTO clientDTO) {
        // Verificar se já existe um cliente com o mesmo CNPJ
        if (clientRepository.existsByCnpj(clientDTO.getCnpj())) {
            throw new BusinessException("Já existe um cliente cadastrado com este CNPJ: " + clientDTO.getCnpj());
        }
        
        Client client = new Client();
        BeanUtils.copyProperties(clientDTO, client);
        
        // Definir status padrão se não fornecido
        if (client.getStatus() == null) {
            client.setStatus(ClientStatus.ACTIVE);
        }
        
        Client savedClient = clientRepository.save(client);
        
        ClientDTO savedClientDTO = new ClientDTO();
        BeanUtils.copyProperties(savedClient, savedClientDTO);
        
        return savedClientDTO;
    }
    
    public ClientDTO updateClient(UUID id, ClientDTO clientDTO) {
        Client existingClient = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        // Verificar se o CNPJ foi alterado e se já existe outro cliente com o novo CNPJ
        if (!existingClient.getCnpj().equals(clientDTO.getCnpj()) && 
            clientRepository.existsByCnpj(clientDTO.getCnpj())) {
            throw new BusinessException("Já existe um cliente cadastrado com este CNPJ: " + clientDTO.getCnpj());
        }
        
        BeanUtils.copyProperties(clientDTO, existingClient, "id", "createdAt");
        
        Client updatedClient = clientRepository.save(existingClient);
        
        ClientDTO updatedClientDTO = new ClientDTO();
        BeanUtils.copyProperties(updatedClient, updatedClientDTO);
        
        return updatedClientDTO;
    }
    
    public ClientDTO getClientById(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        ClientDTO clientDTO = new ClientDTO();
        BeanUtils.copyProperties(client, clientDTO);
        
        return clientDTO;
    }
    
    public ClientDTO getClientByCnpj(String cnpj) {
        Client client = clientRepository.findByCnpj(cnpj)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com CNPJ: " + cnpj));
        
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
        
        // Verificar se o cliente tem unidades ou contratos ativos
        if (!client.getUnits().isEmpty()) {
            throw new BusinessException("Não é possível excluir o cliente pois existem unidades vinculadas");
        }
        
        if (!client.getContracts().isEmpty()) {
            throw new BusinessException("Não é possível excluir o cliente pois existem contratos vinculados");
        }
        
        clientRepository.delete(client);
    }
    
    public void updateClientStatus(UUID id, ClientStatus status) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
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