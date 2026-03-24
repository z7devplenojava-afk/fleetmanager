package com.z7design.fleet_manager.service;

import com.z7design.fleet_manager.model.InteractionHistory;
import com.z7design.fleet_manager.repository.InteractionHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class InteractionHistoryService {
    @Autowired
    private InteractionHistoryRepository interactionHistoryRepository;

    public List<InteractionHistory> findAll() {
        return interactionHistoryRepository.findAll();
    }

    public Optional<InteractionHistory> findById(UUID id) {
        return interactionHistoryRepository.findById(id);
    }

    public InteractionHistory save(InteractionHistory history) {
        return interactionHistoryRepository.save(history);
    }

    public void delete(UUID id) {
        interactionHistoryRepository.deleteById(id);
    }
} 
