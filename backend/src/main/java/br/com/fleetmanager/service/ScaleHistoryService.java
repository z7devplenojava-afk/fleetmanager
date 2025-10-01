package br.com.fleetmanager.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.model.ScaleHistory;
import br.com.fleetmanager.repository.ScaleHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScaleHistoryService {
    
    private final ScaleHistoryRepository scaleHistoryRepository;
    
    @Transactional
    public ScaleHistory create(ScaleHistory scaleHistory) {
        return scaleHistoryRepository.save(scaleHistory);
    }
    
    @Transactional
    public ScaleHistory update(UUID id, ScaleHistory scaleHistory) {
        ScaleHistory existingScaleHistory = findById(id);
        scaleHistory.setId(existingScaleHistory.getId());
        return scaleHistoryRepository.save(scaleHistory);
    }
    
    @Transactional
    public void delete(UUID id) {
        scaleHistoryRepository.deleteById(id);
    }
    
    public ScaleHistory findById(UUID id) {
        return scaleHistoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ScaleHistory not found"));
    }
    
    public List<ScaleHistory> findByEmployeeId(UUID employeeId) {
        return scaleHistoryRepository.findByEmployeeId(employeeId);
    }
    
    public List<ScaleHistory> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return scaleHistoryRepository.findByDateBetween(startDate, endDate);
    }
    
    public List<ScaleHistory> findByEmployeeIdAndDateRange(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return scaleHistoryRepository.findByEmployeeIdAndDateBetween(employeeId, startDate, endDate);
    }
    
    public List<ScaleHistory> findAll() {
        return scaleHistoryRepository.findAll();
    }
} 