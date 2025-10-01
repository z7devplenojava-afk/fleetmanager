package br.com.fleetmanager.service;

import br.com.fleetmanager.model.Opportunity;
import br.com.fleetmanager.repository.OpportunityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OpportunityService {
    @Autowired
    private OpportunityRepository opportunityRepository;

    public List<Opportunity> findAll() {
        return opportunityRepository.findAll();
    }

    public Optional<Opportunity> findById(UUID id) {
        return opportunityRepository.findById(id);
    }

    public Opportunity save(Opportunity opportunity) {
        return opportunityRepository.save(opportunity);
    }

    public void delete(UUID id) {
        opportunityRepository.deleteById(id);
    }
} 