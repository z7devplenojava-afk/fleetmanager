package br.com.fleetmanager.service;

import br.com.fleetmanager.dto.LeadDTO;
import br.com.fleetmanager.model.Lead;
import br.com.fleetmanager.model.enums.LeadStatus;
import br.com.fleetmanager.model.enums.LeadSource;
import br.com.fleetmanager.repository.LeadRepository;
import br.com.fleetmanager.repository.UserRepository;
import br.com.fleetmanager.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class LeadService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Lead> findAll() {
        return leadRepository.findAll();
    }

    public Page<Lead> findAll(Pageable pageable) {
        return leadRepository.findAll(pageable);
    }

    public Lead findById(UUID id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead não encontrado com ID: " + id));
    }

    public Lead create(LeadDTO leadDTO, UUID createdById) {
        Lead lead = new Lead();
        lead.setName(leadDTO.getName());
        lead.setEmail(leadDTO.getEmail());
        lead.setPhone(leadDTO.getPhone());
        lead.setCompany(leadDTO.getCompany());
        lead.setPosition(leadDTO.getPosition());
        lead.setSource(leadDTO.getSource());
        lead.setStatus(LeadStatus.NEW);
        lead.setCreatedBy(userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado")));
        
        if (leadDTO.getAssignedToId() != null) {
            lead.setAssignedTo(userRepository.findById(UUID.fromString(leadDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário responsável não encontrado")));
        }

        return leadRepository.save(lead);
    }

    public Lead update(UUID id, LeadDTO leadDTO) {
        Lead lead = findById(id);
        lead.setName(leadDTO.getName());
        lead.setEmail(leadDTO.getEmail());
        lead.setPhone(leadDTO.getPhone());
        lead.setCompany(leadDTO.getCompany());
        lead.setPosition(leadDTO.getPosition());
        lead.setSource(leadDTO.getSource());
        
        if (leadDTO.getAssignedToId() != null) {
            lead.setAssignedTo(userRepository.findById(UUID.fromString(leadDTO.getAssignedToId().toString()))
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário responsável não encontrado")));
        } else {
            lead.setAssignedTo(null);
        }

        return leadRepository.save(lead);
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

    public List<Lead> findByStatus(LeadStatus status) {
        return leadRepository.findByStatus(status);
    }

    public List<Lead> findBySource(LeadSource source) {
        return leadRepository.findBySource(source);
    }

    public List<Lead> findByAssignedTo(UUID userId) {
        return leadRepository.findByAssignedToId(userId);
    }

    public List<Lead> findByCreatedBy(UUID userId) {
        return leadRepository.findByCreatedById(userId);
    }

    public List<Lead> findByCompany(String company) {
        return leadRepository.findByCompanyContainingIgnoreCase(company);
    }

    public List<Lead> findRecentLeads(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return leadRepository.findByCreatedAtAfter(since);
    }

    public long countByStatus(LeadStatus status) {
        return leadRepository.countByStatus(status);
    }

    public long countBySource(LeadSource source) {
        return leadRepository.countBySource(source);
    }

    public List<Lead> searchLeads(String searchTerm) {
        return leadRepository.searchLeads(searchTerm);
    }
} 