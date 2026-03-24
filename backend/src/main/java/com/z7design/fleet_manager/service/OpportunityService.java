package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.Opportunity;
import com.z7design.fleet_manager.model.KanbanStatus;
import com.z7design.fleet_manager.model.Lead;
import com.z7design.fleet_manager.model.Client;
import com.z7design.fleet_manager.model.User;
import com.z7design.fleet_manager.repository.OpportunityRepository;
import com.z7design.fleet_manager.repository.KanbanStatusRepository;
import com.z7design.fleet_manager.repository.LeadRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class OpportunityService {
    @Autowired
    private OpportunityRepository opportunityRepository;
    
    @Autowired
    private KanbanStatusRepository kanbanStatusRepository;
    
    @Autowired
    private LeadRepository leadRepository;
    
    @Autowired
    private ClientRepository clientRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Opportunity> findAll() {
        try {
            List<Opportunity> opportunities = opportunityRepository.findAllWithRelationships();
            // Inicializar objetos necessÃ¡rios dentro da transaÃ§Ã£o para evitar LazyInitializationException
            for (Opportunity opportunity : opportunities) {
                if (opportunity.getLead() != null) {
                    // ForÃ§ar inicializaÃ§Ã£o de campos bÃ¡sicos do Lead dentro da transaÃ§Ã£o
                    opportunity.getLead().getId();
                    opportunity.getLead().getName();
                    opportunity.getLead().getCompany();
                    opportunity.getLead().getEmail();
                    opportunity.getLead().getPhone();
                    opportunity.getLead().getStatus();
                    opportunity.getLead().getSource();
                    opportunity.getLead().getCreatedAt();
                }
                if (opportunity.getStatus() != null) {
                    opportunity.getStatus().getId();
                    opportunity.getStatus().getName();
                }
                if (opportunity.getAssignedTo() != null) {
                    opportunity.getAssignedTo().getId();
                    opportunity.getAssignedTo().getName();
                }
                if (opportunity.getClient() != null) {
                    opportunity.getClient().getId();
                    opportunity.getClient().getName();
                }
            }
            return opportunities;
        } catch (Exception e) {
            // Fallback para mÃ©todo padrÃ£o
            return opportunityRepository.findAll();
        }
    }

    @Transactional(readOnly = true)
    public Optional<Opportunity> findById(UUID id) {
        try {
            // Buscar oportunidade e tentar inicializar relacionamentos
            Optional<Opportunity> opportunityOpt = opportunityRepository.findById(id);
            if (opportunityOpt.isPresent()) {
                Opportunity opportunity = opportunityOpt.get();
                // Inicializar objetos necessÃ¡rios dentro da transaÃ§Ã£o
                if (opportunity.getLead() != null) {
                    opportunity.getLead().getId();
                    opportunity.getLead().getName();
                    opportunity.getLead().getCompany();
                    opportunity.getLead().getEmail();
                    opportunity.getLead().getPhone();
                    opportunity.getLead().getStatus();
                    opportunity.getLead().getSource();
                    opportunity.getLead().getCreatedAt();
                }
                if (opportunity.getStatus() != null) {
                    opportunity.getStatus().getId();
                    opportunity.getStatus().getName();
                }
                if (opportunity.getAssignedTo() != null) {
                    opportunity.getAssignedTo().getId();
                    opportunity.getAssignedTo().getName();
                }
                if (opportunity.getClient() != null) {
                    opportunity.getClient().getId();
                    opportunity.getClient().getName();
                }
            }
            return opportunityOpt;
        } catch (Exception e) {
            // Fallback para mÃ©todo padrÃ£o
            return opportunityRepository.findById(id);
        }
    }

    public Opportunity save(Opportunity opportunity) {
        // Resolver relacionamentos se os IDs estiverem presentes
        if (opportunity.getStatus() != null && opportunity.getStatus().getId() != null) {
            KanbanStatus status = kanbanStatusRepository.findById(opportunity.getStatus().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Status nÃ£o encontrado com ID: " + opportunity.getStatus().getId()));
            opportunity.setStatus(status);
        }
        
        // Se a oportunidade tem apenas o ID do status (vindo do DTO), buscar a entidade
        // Isso serÃ¡ tratado no controller antes de chamar o service
        
        return opportunityRepository.save(opportunity);
    }
    
    public Opportunity create(Opportunity opportunity, UUID statusId, UUID leadId, UUID clientId, UUID assignedToId) {
        if (statusId == null) {
            throw new IllegalArgumentException("StatusId Ã© obrigatÃ³rio para criar uma oportunidade");
        }
        
        KanbanStatus status = kanbanStatusRepository.findById(statusId)
            .orElseThrow(() -> new ResourceNotFoundException("Status nÃ£o encontrado com ID: " + statusId));
        opportunity.setStatus(status);
        
        if (leadId != null) {
            Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead nÃ£o encontrado com ID: " + leadId));
            opportunity.setLead(lead);
        }
        
        if (clientId != null) {
            Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado com ID: " + clientId));
            opportunity.setClient(client);
        }
        
        if (assignedToId != null) {
            User user = userRepository.findById(assignedToId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio nÃ£o encontrado com ID: " + assignedToId));
            opportunity.setAssignedTo(user);
        }
        
        return opportunityRepository.save(opportunity);
    }
    
    public Opportunity update(UUID id, Opportunity opportunity, UUID statusId, UUID leadId, UUID clientId, UUID assignedToId) {
        Opportunity existing = findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Oportunidade nÃ£o encontrada com ID: " + id));
        
        existing.setTitle(opportunity.getTitle());
        existing.setDescription(opportunity.getDescription());
        existing.setEstimatedValue(opportunity.getEstimatedValue());
        existing.setCloseDate(opportunity.getCloseDate());
        
        if (statusId != null) {
            KanbanStatus status = kanbanStatusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status nÃ£o encontrado com ID: " + statusId));
            existing.setStatus(status);
        } else {
            // Se statusId for null na atualizaÃ§Ã£o, manter o status atual
            // NÃ£o alterar o status se nÃ£o for fornecido
        }
        
        if (leadId != null) {
            Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead nÃ£o encontrado com ID: " + leadId));
            existing.setLead(lead);
        } else {
            existing.setLead(null);
        }
        
        if (clientId != null) {
            Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado com ID: " + clientId));
            existing.setClient(client);
        } else {
            existing.setClient(null);
        }
        
        if (assignedToId != null) {
            User user = userRepository.findById(assignedToId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio nÃ£o encontrado com ID: " + assignedToId));
            existing.setAssignedTo(user);
        } else {
            existing.setAssignedTo(null);
        }
        
        return opportunityRepository.save(existing);
    }

    public void delete(UUID id) {
        opportunityRepository.deleteById(id);
    }
} 
