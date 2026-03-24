package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.LeadDTO;
import com.z7design.fleet_manager.model.Lead;
import com.z7design.fleet_manager.model.enums.LeadStatus;
import com.z7design.fleet_manager.model.enums.LeadSource;
import com.z7design.fleet_manager.repository.LeadRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.User;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.Hibernate;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
public class LeadService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Inicializa relacionamentos lazy de um Lead, tratando casos onde o User foi deletado
     */
    private void initializeLeadRelationships(Lead lead) {
        // Inicializar createdBy
        if (lead.getCreatedBy() != null) {
            try {
                // Verificar se Ã© um proxy Hibernate
                if (lead.getCreatedBy() instanceof HibernateProxy) {
                    HibernateProxy proxy = (HibernateProxy) lead.getCreatedBy();
                    UUID userId = (UUID) proxy.getHibernateLazyInitializer().getIdentifier();
                    
                    // Verificar se o User existe antes de inicializar
                    if (userId != null && !userRepository.existsById(userId)) {
                        // User nÃ£o existe mais, definir como null
                        lead.setCreatedBy(null);
                    } else {
                        // User existe, inicializar normalmente
                        Hibernate.initialize(lead.getCreatedBy());
                        lead.getCreatedBy().getUsername(); // ForÃ§a inicializaÃ§Ã£o completa
                    }
                } else {
                    // JÃ¡ estÃ¡ inicializado, apenas verificar se existe
                    UUID userId = lead.getCreatedBy().getId();
                    if (userId != null && !userRepository.existsById(userId)) {
                        lead.setCreatedBy(null);
                    }
                }
            } catch (EntityNotFoundException | org.hibernate.LazyInitializationException e) {
                // User foi deletado ou nÃ£o pode ser inicializado, definir como null
                lead.setCreatedBy(null);
            } catch (Exception e) {
                // Outros erros tambÃ©m resultam em null para evitar problemas
                lead.setCreatedBy(null);
            }
        }
        
        // Inicializar assignedTo
        if (lead.getAssignedTo() != null) {
            try {
                // Verificar se Ã© um proxy Hibernate
                if (lead.getAssignedTo() instanceof HibernateProxy) {
                    HibernateProxy proxy = (HibernateProxy) lead.getAssignedTo();
                    UUID userId = (UUID) proxy.getHibernateLazyInitializer().getIdentifier();
                    
                    // Verificar se o User existe antes de inicializar
                    if (userId != null && !userRepository.existsById(userId)) {
                        // User nÃ£o existe mais, definir como null
                        log.warn("UsuÃ¡rio assignedTo nÃ£o encontrado com ID: {}. Definindo como null.", userId);
                        lead.setAssignedTo(null);
                    } else {
                        // User existe, inicializar normalmente
                        Hibernate.initialize(lead.getAssignedTo());
                        // ForÃ§a inicializaÃ§Ã£o completa acessando vÃ¡rios campos
                        User assignedUser = lead.getAssignedTo();
                        // Acessar TODOS os campos para garantir que o objeto seja totalmente carregado
                        // Isso Ã© necessÃ¡rio para que o Jackson possa serializar corretamente
                        UUID assignedUserId = assignedUser.getId();
                        String userName = assignedUser.getName();
                        String userUsername = assignedUser.getUsername();
                        String userEmail = assignedUser.getEmail();
                        // Acessar mais campos para garantir inicializaÃ§Ã£o completa
                        assignedUser.isEnabled();
                        assignedUser.isAccountNonExpired();
                        // Popular assignedToName para facilitar serializaÃ§Ã£o
                        lead.setAssignedToName(userName != null ? userName : userUsername);
                        log.info("âœ… AssignedTo inicializado: ID={}, Name={}, Username={}, Email={}, AssignedToName={}", 
                            assignedUserId, userName, userUsername, userEmail, lead.getAssignedToName());
                    }
                } else {
                    // JÃ¡ estÃ¡ inicializado, apenas verificar se existe
                    UUID assignedUserId = lead.getAssignedTo().getId();
                    if (assignedUserId != null && !userRepository.existsById(assignedUserId)) {
                        log.warn("UsuÃ¡rio assignedTo nÃ£o encontrado com ID: {}. Definindo como null.", assignedUserId);
                        lead.setAssignedTo(null);
                    } else {
                        // Garantir que os campos estÃ£o acessÃ­veis e totalmente inicializados
                        User assignedUser = lead.getAssignedTo();
                        UUID userId = assignedUser.getId();
                        String userName = assignedUser.getName();
                        String userUsername = assignedUser.getUsername();
                        String userEmail = assignedUser.getEmail();
                        assignedUser.isEnabled();
                        assignedUser.isAccountNonExpired();
                        // Popular assignedToName para facilitar serializaÃ§Ã£o
                        lead.setAssignedToName(userName != null ? userName : userUsername);
                        log.info("âœ… AssignedTo jÃ¡ inicializado: ID={}, Name={}, Username={}, Email={}, AssignedToName={}", 
                            userId, userName, userUsername, userEmail, lead.getAssignedToName());
                    }
                }
            } catch (EntityNotFoundException | org.hibernate.LazyInitializationException e) {
                // User foi deletado ou nÃ£o pode ser inicializado, definir como null
                log.warn("Erro ao inicializar assignedTo: {}. Definindo como null.", e.getMessage());
                lead.setAssignedTo(null);
                lead.setAssignedToName(null);
            } catch (Exception e) {
                // Outros erros tambÃ©m resultam em null para evitar problemas
                log.error("Erro inesperado ao inicializar assignedTo: {}", e.getMessage(), e);
                lead.setAssignedTo(null);
                lead.setAssignedToName(null);
            }
        } else {
            log.debug("Lead {} nÃ£o tem assignedTo", lead.getId());
            lead.setAssignedToName(null);
        }
    }

    @Transactional(readOnly = true)
    public List<Lead> findAll() {
        List<Lead> leads = leadRepository.findAll();
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        for (Lead lead : leads) {
            initializeLeadRelationships(lead);
            // ForÃ§ar serializaÃ§Ã£o do assignedTo acessando seus campos ANTES da serializaÃ§Ã£o JSON
            if (lead.getAssignedTo() != null) {
                try {
                    User assignedUser = lead.getAssignedTo();
                    // Acessar todos os campos necessÃ¡rios para forÃ§ar inicializaÃ§Ã£o completa
                    // Isso garante que o Jackson possa serializar o objeto
                    UUID id = assignedUser.getId();
                    String name = assignedUser.getName();
                    String username = assignedUser.getUsername();
                    // Acessar outros campos para garantir inicializaÃ§Ã£o completa
                    assignedUser.getEmail();
                    // Popular assignedToName para facilitar serializaÃ§Ã£o
                    lead.setAssignedToName(name != null ? name : username);
                    log.info("âœ… Lead {} - AssignedTo inicializado: ID={}, Name={}, Username={}, AssignedToName={}", 
                        lead.getId(), id, name, username, lead.getAssignedToName());
                } catch (Exception e) {
                    log.warn("âŒ Erro ao acessar assignedTo do lead {}: {}", lead.getId(), e.getMessage(), e);
                    lead.setAssignedTo(null);
                    lead.setAssignedToName(null);
                }
            } else {
                log.debug("âš ï¸ Lead {} - AssignedTo Ã© null", lead.getId());
                lead.setAssignedToName(null);
            }
        }
        return leads;
    }

    @Transactional(readOnly = true)
    public Page<Lead> findAll(Pageable pageable) {
        Page<Lead> leads = leadRepository.findAll(pageable);
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        for (Lead lead : leads.getContent()) {
            initializeLeadRelationships(lead);
            // Popular assignedToName para facilitar serializaÃ§Ã£o
            if (lead.getAssignedTo() != null) {
                try {
                    User assignedUser = lead.getAssignedTo();
                    String name = assignedUser.getName();
                    String username = assignedUser.getUsername();
                    lead.setAssignedToName(name != null ? name : username);
                } catch (Exception e) {
                    log.warn("Erro ao popular assignedToName do lead {}: {}", lead.getId(), e.getMessage());
                    lead.setAssignedToName(null);
                }
            } else {
                lead.setAssignedToName(null);
            }
        }
        return leads;
    }

    @Transactional(readOnly = true)
    public Lead findById(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead nÃ£o encontrado com ID: " + id));
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        initializeLeadRelationships(lead);
        
        // ForÃ§ar acesso ao assignedTo antes de retornar para garantir serializaÃ§Ã£o
        // IMPORTANTE: Popular assignedToName para facilitar serializaÃ§Ã£o
        if (lead.getAssignedTo() != null) {
            try {
                User assignedUser = lead.getAssignedTo();
                UUID assignedToId = assignedUser.getId();
                String name = assignedUser.getName();
                String username = assignedUser.getUsername();
                assignedUser.getEmail();
                // Popular assignedToName para facilitar serializaÃ§Ã£o
                lead.setAssignedToName(name != null ? name : username);
                log.info("âœ… Lead {} encontrado - AssignedTo: ID={}, Name={}, AssignedToName={}", 
                    lead.getId(), assignedToId, name, lead.getAssignedToName());
            } catch (Exception e) {
                log.warn("âŒ Erro ao acessar assignedTo do lead {}: {}", lead.getId(), e.getMessage());
                lead.setAssignedToName(null);
            }
        } else {
            log.debug("âš ï¸ Lead {} encontrado - AssignedTo Ã© null", lead.getId());
            lead.setAssignedToName(null);
        }
        
        return lead;
    }

    public Lead create(LeadDTO leadDTO, String currentUserIdentifier) {
        Lead lead = new Lead();
        lead.setName(leadDTO.getName());
        lead.setEmail(leadDTO.getEmail());
        lead.setPhone(leadDTO.getPhone());
        lead.setCompany(leadDTO.getCompany());
        lead.setPosition(leadDTO.getPosition());
        lead.setSource(leadDTO.getSource());
        lead.setStatus(LeadStatus.NEW);
        // Mapear description para notes se notes estiver vazio
        if (leadDTO.getNotes() != null && !leadDTO.getNotes().isEmpty()) {
            lead.setNotes(leadDTO.getNotes());
        } else if (leadDTO.getDescription() != null && !leadDTO.getDescription().isEmpty()) {
            lead.setNotes(leadDTO.getDescription());
        }
        lead.setEstimatedValue(leadDTO.getEstimatedValue());
        lead.setNextFollowUp(leadDTO.getNextFollowUp());
        
        // Tentar buscar usuÃ¡rio por username primeiro, depois por email
        var userOptional = userRepository.findByUsername(currentUserIdentifier);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByEmail(currentUserIdentifier);
        }
        
        if (userOptional.isEmpty()) {
            throw new ResourceNotFoundException("UsuÃ¡rio nÃ£o encontrado com username/email: " + currentUserIdentifier);
        }
        
        lead.setCreatedBy(userOptional.get());
        
        // Atualizar assignedTo apenas se assignedToId for fornecido e vÃ¡lido
        if (leadDTO.getAssignedToId() != null) {
            try {
                String assignedToIdStr = leadDTO.getAssignedToId().toString().trim();
                // Verificar se nÃ£o Ã© uma string vazia ou "null"
                if (!assignedToIdStr.isEmpty() && !assignedToIdStr.equalsIgnoreCase("null") && !assignedToIdStr.equalsIgnoreCase("undefined")) {
                    UUID assignedToUUID = UUID.fromString(assignedToIdStr);
                    var assignedUserOptional = userRepository.findById(assignedToUUID);
                    if (assignedUserOptional.isPresent()) {
                        lead.setAssignedTo(assignedUserOptional.get());
                    } else {
                        // Se o usuÃ¡rio nÃ£o existir, definir como null em vez de lanÃ§ar exceÃ§Ã£o
                        log.warn("UsuÃ¡rio responsÃ¡vel nÃ£o encontrado com ID: {}. Criando lead sem responsÃ¡vel.", assignedToIdStr);
                        lead.setAssignedTo(null);
                    }
                } else {
                    lead.setAssignedTo(null);
                }
            } catch (IllegalArgumentException e) {
                log.warn("ID do usuÃ¡rio responsÃ¡vel invÃ¡lido: {}. Criando lead sem responsÃ¡vel.", leadDTO.getAssignedToId());
                lead.setAssignedTo(null);
            }
        } else {
            lead.setAssignedTo(null);
        }

        return leadRepository.save(lead);
    }

    @Transactional
    public Lead update(UUID id, LeadDTO leadDTO) {
        log.info("ðŸ”„ Iniciando atualizaÃ§Ã£o do lead ID: {}", id);
        log.info("ðŸ“¦ DTO recebido: Name={}, Status={}, AssignedToId={}", 
                 leadDTO.getName(), leadDTO.getStatus(), leadDTO.getAssignedToId());
        
        Lead lead = findById(id);
        lead.setName(leadDTO.getName());
        lead.setEmail(leadDTO.getEmail());
        lead.setPhone(leadDTO.getPhone());
        lead.setCompany(leadDTO.getCompany());
        lead.setPosition(leadDTO.getPosition());
        lead.setSource(leadDTO.getSource());
        lead.setNextFollowUp(leadDTO.getNextFollowUp());
        
        // Atualizar notes se description foi fornecido
        if (leadDTO.getNotes() != null && !leadDTO.getNotes().isEmpty()) {
            lead.setNotes(leadDTO.getNotes());
        } else if (leadDTO.getDescription() != null && !leadDTO.getDescription().isEmpty()) {
            lead.setNotes(leadDTO.getDescription());
        }
        
        // Atualizar estimatedValue se fornecido
        if (leadDTO.getEstimatedValue() != null) {
            lead.setEstimatedValue(leadDTO.getEstimatedValue());
        }
        
        // Atualizar status se fornecido
        if (leadDTO.getStatus() != null) {
            log.info("ðŸ”„ Atualizando status de {} para {}", lead.getStatus(), leadDTO.getStatus());
            lead.setStatus(leadDTO.getStatus());
            log.info("âœ… Status atualizado para: {}", lead.getStatus());
        } else {
            log.warn("âš ï¸ Status nÃ£o fornecido no DTO - mantendo status existente: {}", lead.getStatus());
        }
        
        // Atualizar assignedTo baseado no assignedToId fornecido
        // IMPORTANTE: 
        // - Se assignedToId for fornecido e vÃ¡lido (UUID), atualizar
        // - Se assignedToId for null (enviado explicitamente), remover assignedTo
        // - Se assignedToId nÃ£o for fornecido (campo ausente no JSON), manter o valor existente
        // 
        // Como o Jackson nÃ£o distingue facilmente entre "campo ausente" e "campo null",
        // vamos processar sempre que o campo estiver presente no JSON.
        // O frontend sempre envia assignedToId no updateData, entÃ£o vamos processar sempre.
        
        // Verificar se assignedToId foi fornecido
        // Se for null, significa que o frontend enviou explicitamente null para remover
        // Se for um UUID vÃ¡lido, atualizar
        // Se for string vazia (nÃ£o deve acontecer com UUID, mas vamos tratar), remover
        
        UUID assignedToIdFromDTO = leadDTO.getAssignedToId();
        
        if (assignedToIdFromDTO != null) {
            // assignedToId foi fornecido e nÃ£o Ã© null - tentar atualizar
            try {
                var userOptional = userRepository.findById(assignedToIdFromDTO);
                if (userOptional.isPresent()) {
                    lead.setAssignedTo(userOptional.get());
                    log.info("âœ… AssignedTo ATUALIZADO para: ID={}, Name={}", 
                        userOptional.get().getId(), userOptional.get().getName());
                } else {
                    // Se o usuÃ¡rio nÃ£o existir, definir como null em vez de lanÃ§ar exceÃ§Ã£o
                    log.error("âŒ FALHA AO ATUALIZAR: UsuÃ¡rio nÃ£o encontrado com ID: {}", assignedToIdFromDTO);
                    log.warn("UsuÃ¡rio responsÃ¡vel nÃ£o encontrado com ID: {}. Definindo como null.", assignedToIdFromDTO);
                    lead.setAssignedTo(null);
                }
            } catch (Exception e) {
                log.warn("Erro ao processar assignedToId {}: {}. Mantendo assignedTo existente.", assignedToIdFromDTO, e.getMessage());
                // NÃ£o alterar o assignedTo se houver erro
            }
        } else {
            // assignedToId Ã© null - pode ser que foi enviado explicitamente para remover
            // ou pode ser que nÃ£o foi enviado.
            // Como o frontend sempre envia assignedToId no updateData (mesmo que seja o valor existente),
            // se chegou aqui como null, significa que o frontend enviou null explicitamente para remover
            log.info("ðŸ”„ AssignedToId Ã© null - removendo assignedTo (enviado explicitamente)");
            lead.setAssignedTo(null);
        }

        Lead savedLead = leadRepository.save(lead);
        
        // Log para debug - verificar se o assignedTo foi salvo
        if (savedLead.getAssignedTo() != null) {
            log.info("âœ… Lead {} atualizado - AssignedTo: ID={}, Name={}", 
                savedLead.getId(), savedLead.getAssignedTo().getId(), savedLead.getAssignedTo().getName());
        } else {
            log.info("âš ï¸ Lead {} atualizado - AssignedTo Ã© null", savedLead.getId());
        }
        
        // Inicializar relacionamentos antes de retornar
        initializeLeadRelationships(savedLead);
        
        // IMPORTANTE: Popular assignedToName apÃ³s inicializar relacionamentos
        // Isso garante que o campo transiente seja populado corretamente para serializaÃ§Ã£o JSON
        if (savedLead.getAssignedTo() != null) {
            try {
                User assignedUser = savedLead.getAssignedTo();
                String name = assignedUser.getName();
                String username = assignedUser.getUsername();
                savedLead.setAssignedToName(name != null ? name : username);
                log.info("âœ… Lead {} - AssignedToName populado: {}", savedLead.getId(), savedLead.getAssignedToName());
            } catch (Exception e) {
                log.warn("âš ï¸ Erro ao popular assignedToName do lead {}: {}", savedLead.getId(), e.getMessage());
            }
        } else {
            // Se assignedTo for null, limpar assignedToName
            savedLead.setAssignedToName(null);
            log.debug("âš ï¸ Lead {} - AssignedToName limpo (assignedTo Ã© null)", savedLead.getId());
        }
        
        return savedLead;
    }

    public Lead updateStatus(UUID id, String status) {
        Lead lead = findById(id);
        lead.setStatus(LeadStatus.valueOf(status));
        return leadRepository.save(lead);
    }

    public void delete(UUID id) {
        Lead lead = findById(id);
        leadRepository.delete(lead);
    }

    @Transactional(readOnly = true)
    public List<Lead> findByStatus(LeadStatus status) {
        List<Lead> leads = leadRepository.findByStatus(status);
        for (Lead lead : leads) {
            initializeLeadRelationships(lead);
        }
        return leads;
    }

    @Transactional(readOnly = true)
    public List<Lead> findBySource(LeadSource source) {
        List<Lead> leads = leadRepository.findBySource(source);
        for (Lead lead : leads) {
            initializeLeadRelationships(lead);
        }
        return leads;
    }

    @Transactional(readOnly = true)
    public List<Lead> findByAssignedTo(UUID userId) {
        List<Lead> leads = leadRepository.findByAssignedToId(userId);
        for (Lead lead : leads) {
            initializeLeadRelationships(lead);
        }
        return leads;
    }

    @Transactional(readOnly = true)
    public List<Lead> findByCreatedBy(UUID userId) {
        List<Lead> leads = leadRepository.findByCreatedById(userId);
        for (Lead lead : leads) {
            initializeLeadRelationships(lead);
        }
        return leads;
    }

    @Transactional(readOnly = true)
    public List<Lead> findByCompany(String company) {
        List<Lead> leads = leadRepository.findByCompanyContainingIgnoreCase(company);
        for (Lead lead : leads) {
            initializeLeadRelationships(lead);
        }
        return leads;
    }

    @Transactional(readOnly = true)
    public List<Lead> findRecentLeads(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Lead> leads = leadRepository.findByCreatedAtAfter(since);
        for (Lead lead : leads) {
            initializeLeadRelationships(lead);
        }
        return leads;
    }

    public long countByStatus(LeadStatus status) {
        return leadRepository.countByStatus(status);
    }

    public long countBySource(LeadSource source) {
        return leadRepository.countBySource(source);
    }

    @Transactional(readOnly = true)
    public List<Lead> searchLeads(String searchTerm) {
        List<Lead> leads = leadRepository.searchLeads(searchTerm);
        for (Lead lead : leads) {
            initializeLeadRelationships(lead);
        }
        return leads;
    }
} 
