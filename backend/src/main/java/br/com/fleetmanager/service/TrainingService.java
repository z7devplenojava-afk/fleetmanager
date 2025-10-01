package br.com.fleetmanager.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.Training;
import br.com.fleetmanager.repository.TrainingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TrainingService {
    
    private final TrainingRepository trainingRepository;
    
    @Transactional
    public Training create(Training training) {
        validateTraining(training);
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
        
        return trainingRepository.save(existingTraining);
    }
    
    @Transactional
    public void delete(UUID id) {
        Training training = findById(id);
        trainingRepository.delete(training);
    }
    
    public Training findById(UUID id) {
        return trainingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Treinamento não encontrado"));
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
            throw new IllegalArgumentException("Nome do treinamento é obrigatório");
        }
        
        if (training.getDuration() != null && training.getDuration() <= 0) {
            throw new IllegalArgumentException("Duração do treinamento deve ser maior que zero");
        }
    }
} 