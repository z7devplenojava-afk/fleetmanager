package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.ProposalDTO;
import br.com.fleetmanager.dto.ProposalItemDTO;
import br.com.fleetmanager.model.Proposal;
import br.com.fleetmanager.model.ProposalItem;
import br.com.fleetmanager.model.enums.ProposalStatus;
import br.com.fleetmanager.repository.ProposalRepository;
import br.com.fleetmanager.repository.ProposalItemRepository;
import br.com.fleetmanager.repository.ClientRepository;
import br.com.fleetmanager.repository.LeadRepository;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.exception.ResourceNotFoundException;
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

    public List<Proposal> findAll() {
        return proposalRepository.findAll();
    }

    public Page<Proposal> findAll(Pageable pageable) {
        return proposalRepository.findAll(pageable);
    }

    public Proposal findById(UUID id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposta não encontrada com ID: " + id));
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
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado")));
        
        if (proposalDTO.getClientId() != null) {
            proposal.setClient(clientRepository.findById(proposalDTO.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado")));
        }
        
        if (proposalDTO.getLeadId() != null) {
            proposal.setLead(leadRepository.findById(proposalDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead não encontrado")));
        }
        
        if (proposalDTO.getAssignedToId() != null) {
            proposal.setAssignedTo(userRepository.findById(UUID.fromString(proposalDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário responsável não encontrado")));
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
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado")));
        } else {
            proposal.setClient(null);
        }
        
        if (proposalDTO.getLeadId() != null) {
            proposal.setLead(leadRepository.findById(proposalDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead não encontrado")));
        } else {
            proposal.setLead(null);
        }
        
        if (proposalDTO.getAssignedToId() != null) {
            proposal.setAssignedTo(userRepository.findById(UUID.fromString(proposalDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário responsável não encontrado")));
        } else {
            proposal.setAssignedTo(null);
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
        return proposalRepository.getTotalValueByStatus(status);
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