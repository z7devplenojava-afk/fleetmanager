package com.z7design.fleet_manager.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.model.Occurrence;
import com.z7design.fleet_manager.model.OccurrenceType;
import com.z7design.fleet_manager.repository.OccurrenceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OccurrenceService {
    
    private final OccurrenceRepository occurrenceRepository;
    
    @Transactional
    public Occurrence create(Occurrence occurrence) {
        return occurrenceRepository.save(occurrence);
    }
    
    @Transactional
    public Occurrence update(UUID id, Occurrence occurrence) {
        Occurrence existingOccurrence = findById(id);
        occurrence.setId(id);
        return occurrenceRepository.save(occurrence);
    }
    
    @Transactional
    public void delete(UUID id) {
        Occurrence occurrence = findById(id);
        occurrenceRepository.delete(occurrence);
    }
    
    public Occurrence findById(UUID id) {
        return occurrenceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("OcorrÃªncia nÃ£o encontrada"));
    }
    
    public List<Occurrence> findByEmployeeId(UUID employeeId) {
        return occurrenceRepository.findByEmployeeId(employeeId);
    }
    
    public List<Occurrence> findByType(OccurrenceType type) {
        return occurrenceRepository.findByType(type);
    }
    
    public List<Occurrence> findByStatus(String status) {
        return occurrenceRepository.findByStatus(status);
    }
    
    public List<Occurrence> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return occurrenceRepository.findByOccurrenceDateBetween(startDate, endDate);
    }
    
    public List<Occurrence> findByEmployeeIdAndType(UUID employeeId, OccurrenceType type) {
        return occurrenceRepository.findByEmployeeIdAndType(employeeId, type);
    }
    
    public List<Occurrence> findByEmployeeIdAndDateRange(UUID employeeId, LocalDateTime startDate, LocalDateTime endDate) {
        return occurrenceRepository.findByEmployeeIdAndOccurrenceDateBetween(employeeId, startDate, endDate);
    }
    
    public List<Occurrence> findAll() {
        return occurrenceRepository.findAll();
    }
} 
