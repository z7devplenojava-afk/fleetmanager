package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.dto.ProposalDTO;
import com.z7design.fleet_manager.dto.ProposalItemDTO;
import com.z7design.fleet_manager.model.Proposal;
import com.z7design.fleet_manager.model.ProposalItem;
import com.z7design.fleet_manager.model.enums.ProposalStatus;
import com.z7design.fleet_manager.repository.ProposalRepository;
import com.z7design.fleet_manager.repository.ProposalItemRepository;
import com.z7design.fleet_manager.repository.ClientRepository;
import com.z7design.fleet_manager.repository.LeadRepository;
import com.z7design.fleet_manager.repository.UserRepository;
import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ProposalService {

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private ProposalItemRepository proposalItemRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.z7design.fleet_manager.repository.CostSimulationRepository costSimulationRepository;

    public List<Proposal> findAll() {
        List<Proposal> proposals = proposalRepository.findAll();
        
        // Inicializar relacionamentos lazy dentro da transaÃ§Ã£o
        for (Proposal proposal : proposals) {
            // Inicializar client (obrigatÃ³rio)
            if (proposal.getClient() != null) {
                try {
                    org.hibernate.Hibernate.initialize(proposal.getClient());
                    proposal.getClient().getId();
                    proposal.getClient().getName();
                } catch (Exception e) {
                    // Ignorar erros de lazy loading
                }
            }
            
            // Inicializar createdBy (obrigatÃ³rio)
            if (proposal.getCreatedBy() != null) {
                try {
                    org.hibernate.Hibernate.initialize(proposal.getCreatedBy());
                    proposal.getCreatedBy().getId();
                    proposal.getCreatedBy().getName();
                } catch (Exception e) {
                    // Ignorar erros de lazy loading
                }
            }
            
            // Inicializar assignedTo (opcional)
            if (proposal.getAssignedTo() != null) {
                try {
                    org.hibernate.Hibernate.initialize(proposal.getAssignedTo());
                    proposal.getAssignedTo().getId();
                    proposal.getAssignedTo().getName();
                } catch (Exception e) {
                    // Ignorar erros de lazy loading
                }
            }
            
            // Inicializar items
            if (proposal.getItems() != null) {
                try {
                    org.hibernate.Hibernate.initialize(proposal.getItems());
                    proposal.getItems().size();
                } catch (Exception e) {
                    // Ignorar erros de lazy loading
                }
            }
            
            // Limpar referÃªncias Ã³rfÃ£s de Lead
            if (proposal.getLead() != null) {
                try {
                    org.hibernate.Hibernate.initialize(proposal.getLead());
                    proposal.getLead().getId();
                } catch (jakarta.persistence.EntityNotFoundException e) {
                    // Lead foi deletado, limpar referÃªncia
                    proposal.setLead(null);
                } catch (Exception e) {
                    // Outro erro, limpar referÃªncia para evitar problemas na serializaÃ§Ã£o
                    proposal.setLead(null);
                }
            }
        }
        return proposals;
    }

    public Page<Proposal> findAll(Pageable pageable) {
        Page<Proposal> proposals = proposalRepository.findAll(pageable);
        // Limpar referÃªncias Ã³rfÃ£s de Lead
        proposals.getContent().forEach(proposal -> {
            if (proposal.getLead() != null) {
                try {
                    // Tentar acessar o Lead para verificar se ainda existe
                    proposal.getLead().getId();
                } catch (jakarta.persistence.EntityNotFoundException e) {
                    // Lead foi deletado, limpar referÃªncia
                    proposal.setLead(null);
                } catch (Exception e) {
                    // Outro erro, limpar referÃªncia para evitar problemas na serializaÃ§Ã£o
                    proposal.setLead(null);
                }
            }
        });
        return proposals;
    }

    public Proposal findById(UUID id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposta nÃ£o encontrada com ID: " + id));
    }

    public Proposal create(ProposalDTO proposalDTO, UUID createdById) {
        Proposal proposal = new Proposal();
        proposal.setTitle(proposalDTO.getTitle());
        proposal.setProposalNumber(generateProposalNumber());
        proposal.setStatus(ProposalStatus.DRAFT);
        proposal.setTotalValue(proposalDTO.getTotalValue());
        proposal.setValidUntil(proposalDTO.getValidUntil());
        proposal.setDescription(proposalDTO.getDescription());
        proposal.setCreatedBy(userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio nÃ£o encontrado")));
        
        if (proposalDTO.getClientId() != null) {
            proposal.setClient(clientRepository.findById(proposalDTO.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado")));
        }
        
        if (proposalDTO.getLeadId() != null) {
            proposal.setLead(leadRepository.findById(proposalDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead nÃ£o encontrado")));
        }
        
        if (proposalDTO.getAssignedToId() != null) {
            proposal.setAssignedTo(userRepository.findById(UUID.fromString(proposalDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio responsÃ¡vel nÃ£o encontrado")));
        }

        // PRD MÃ³dulo 2 (M1âM2): vincula a simulaÃ§Ã£o de custos aprovada e copia os valores econÃ´micos
        if (proposalDTO.getCostSimulationId() != null) {
            com.z7design.fleet_manager.model.CostSimulation simulation = costSimulationRepository
                    .findById(proposalDTO.getCostSimulationId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "SimulaÃ§Ã£o de custos nÃ£o encontrada com ID: " + proposalDTO.getCostSimulationId()));
            if (simulation.getStatus() != com.z7design.fleet_manager.model.enums.CostSimulationStatus.APPROVED) {
                throw new IllegalArgumentException(
                        "Somente simulaÃ§Ãµes APROVADAS podem alimentar propostas. Status atual: " + simulation.getStatus());
            }
            proposal.setCostSimulation(simulation);
            if (proposalDTO.getTotalValue() == null) {
                proposal.setTotalValue(simulation.getMonthlyPrice());
            }
            proposalDTO.setMonthlyPrice(simulation.getMonthlyPrice());
            proposalDTO.setDailyRate(simulation.getDailyRate());
            proposalDTO.setFranchiseKm(simulation.getFranchiseKm());
            proposalDTO.setExcessKmRate(simulation.getExcessKmRate());
            proposalDTO.setExtraTripRate(simulation.getExtraTripRate());
        }

        proposal = proposalRepository.save(proposal);

        // Salvar itens da proposta
        if (proposalDTO.getItems() != null) {
            for (ProposalItemDTO itemDTO : proposalDTO.getItems()) {
                ProposalItem item = new ProposalItem();
                item.setProposal(proposal);
                item.setDescription(itemDTO.getDescription());
                item.setQuantity(itemDTO.getQuantity());
                item.setUnitPrice(itemDTO.getUnitPrice());
                item.setTotalPrice(BigDecimal.valueOf(itemDTO.getQuantity()).multiply(itemDTO.getUnitPrice()));
                proposalItemRepository.save(item);
            }
        }

        return proposal;
    }

    public Proposal update(UUID id, ProposalDTO proposalDTO) {
        Proposal proposal = findById(id);
        proposal.setTitle(proposalDTO.getTitle());
        proposal.setTotalValue(proposalDTO.getTotalValue());
        proposal.setValidUntil(proposalDTO.getValidUntil());
        proposal.setDescription(proposalDTO.getDescription());
        
        if (proposalDTO.getClientId() != null) {
            proposal.setClient(clientRepository.findById(proposalDTO.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente nÃ£o encontrado")));
        } else {
            proposal.setClient(null);
        }
        
        if (proposalDTO.getLeadId() != null) {
            proposal.setLead(leadRepository.findById(proposalDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead nÃ£o encontrado")));
        } else {
            proposal.setLead(null);
        }
        
        if (proposalDTO.getAssignedToId() != null) {
            proposal.setAssignedTo(userRepository.findById(UUID.fromString(proposalDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("UsuÃ¡rio responsÃ¡vel nÃ£o encontrado")));
        } else {
            proposal.setAssignedTo(null);
        }

        // PRD MÃ³dulo 2 (M1âM2): atualiza vÃ­nculo com a simulaÃ§Ã£o aprovada
        if (proposalDTO.getCostSimulationId() != null) {
            com.z7design.fleet_manager.model.CostSimulation simulation = costSimulationRepository
                    .findById(proposalDTO.getCostSimulationId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "SimulaÃ§Ã£o de custos nÃ£o encontrada com ID: " + proposalDTO.getCostSimulationId()));
            if (simulation.getStatus() != com.z7design.fleet_manager.model.enums.CostSimulationStatus.APPROVED) {
                throw new IllegalArgumentException(
                        "Somente simulaÃ§Ãµes APROVADAS podem alimentar propostas. Status atual: " + simulation.getStatus());
            }
            proposal.setCostSimulation(simulation);
        }

        return proposalRepository.save(proposal);
    }

    public Proposal updateStatus(UUID id, String status) {
        Proposal proposal = findById(id);
        proposal.setStatus(ProposalStatus.valueOf(status));
        return proposalRepository.save(proposal);
    }

    public void delete(UUID id) {
        Proposal proposal = findById(id);
        proposalRepository.delete(proposal);
    }

    public List<Proposal> findByStatus(ProposalStatus status) {
        return proposalRepository.findByStatus(status);
    }

    public List<Proposal> findByClient(UUID clientId) {
        return proposalRepository.findByClientId(clientId);
    }

    public List<Proposal> findByLead(UUID leadId) {
        return proposalRepository.findByLeadId(leadId);
    }

    public List<Proposal> findByAssignedTo(UUID userId) {
        return proposalRepository.findByAssignedToId(userId);
    }

    public List<Proposal> findByCreatedBy(UUID userId) {
        return proposalRepository.findByCreatedById(userId);
    }

    public List<Proposal> findExpiredProposals() {
        return proposalRepository.findByValidUntilBefore(LocalDate.now());
    }

    public List<Proposal> findProposalsExpiringSoon(int days) {
        LocalDate expiryDate = LocalDate.now().plusDays(days);
        return proposalRepository.findByValidUntilBefore(expiryDate);
    }

    public long countByStatus(ProposalStatus status) {
        return proposalRepository.countByStatus(status);
    }

    public BigDecimal getTotalValueByStatus(ProposalStatus status) {
        BigDecimal value = proposalRepository.getTotalValueByStatus(status);
        return value != null ? value : BigDecimal.ZERO;
    }

    public List<Proposal> searchProposals(String searchTerm) {
        return proposalRepository.searchProposals(searchTerm);
    }

    private String generateProposalNumber() {
        String prefix = "PROP-" + LocalDateTime.now().getYear() + "-";
        long count = proposalRepository.countByYear(LocalDateTime.now().getYear());
        return prefix + String.format("%03d", count + 1);
    }
} 
