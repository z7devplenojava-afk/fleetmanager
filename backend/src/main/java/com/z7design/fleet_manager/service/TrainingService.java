package com.z7design.fleet_manager.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.exception.ResourceNotFoundException;
import com.z7design.fleet_manager.model.Training;
import com.z7design.fleet_manager.repository.TrainingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TrainingService {
    
    private final TrainingRepository trainingRepository;
    
    @Transactional
    public Training create(Training training) {
        validateTraining(training);
        applyDefaults(training);
        return trainingRepository.save(training);
    }
    
    @Transactional
    public Training update(UUID id, Training training) {
        Training existingTraining = findById(id);
        validateTraining(training);
        
        existingTraining.setName(training.getName());
        existingTraining.setDescription(training.getDescription());
        existingTraining.setProvider(training.getProvider());
        existingTraining.setDuration(training.getDuration());
        existingTraining.setRenewalPeriodMonths(training.getRenewalPeriodMonths());
        existingTraining.setMandatoryForGuards(training.getMandatoryForGuards());
        applyDefaults(existingTraining);
        
        return trainingRepository.save(existingTraining);
    }
    
    @Transactional
    public void delete(UUID id) {
        Training training = findById(id);
        trainingRepository.delete(training);
    }
    
    public Training findById(UUID id) {
        return trainingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Treinamento nÃ£o encontrado"));
    }
    
    public List<Training> findByNameContaining(String name) {
        return trainingRepository.findByNameContainingIgnoreCase(name);
    }
    
    public List<Training> findByProviderContaining(String provider) {
        return trainingRepository.findByProviderContainingIgnoreCase(provider);
    }
    
    public List<Training> findAll() {
        return trainingRepository.findAll();
    }
    
    private void validateTraining(Training training) {
        if (training.getName() == null || training.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do treinamento Ã© obrigatÃ³rio");
        }
        
        if (training.getDuration() != null && training.getDuration() <= 0) {
            throw new IllegalArgumentException("DuraÃ§Ã£o do treinamento deve ser maior que zero");
        }

        if (training.getRenewalPeriodMonths() != null && training.getRenewalPeriodMonths() <= 0) {
            throw new IllegalArgumentException("Periodicidade de renovaÃ§Ã£o deve ser maior que zero");
        }
    }

    private void applyDefaults(Training training) {
        if (training.getRenewalPeriodMonths() == null || training.getRenewalPeriodMonths() <= 0) {
            training.setRenewalPeriodMonths(12);
        }
        if (training.getMandatoryForGuards() == null) {
            training.setMandatoryForGuards(Boolean.TRUE);
        }
    }
} 
