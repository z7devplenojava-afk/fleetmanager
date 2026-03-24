package com.z7design.fleet_manager.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.z7design.fleet_manager.model.Benefit;
import com.z7design.fleet_manager.repository.BenefitRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BenefitService {
    
    private final BenefitRepository benefitRepository;
    
    @Transactional
    public Benefit create(Benefit benefit) {
        if (benefit.getStartDate() == null) {
            benefit.setStartDate(LocalDate.now());
        }
        if (benefit.getIsActive() == null) {
            benefit.setIsActive(Boolean.TRUE);
        }
        return benefitRepository.save(benefit);
    }
    
    @Transactional
    public Benefit update(UUID id, Benefit benefit) {
        // Ensure exists; then merge id and defaults
        findById(id);
        benefit.setId(id);
        if (benefit.getStartDate() == null) {
            benefit.setStartDate(java.time.LocalDate.now());
        }
        if (benefit.getIsActive() == null) {
            benefit.setIsActive(Boolean.TRUE);
        }
        return benefitRepository.save(benefit);
    }
    
    @Transactional
    public void delete(UUID id) {
        Benefit benefit = findById(id);
        benefitRepository.delete(benefit);
    }
    
    public Benefit findById(UUID id) {
        return benefitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("BenefÃ­cio nÃ£o encontrado"));
    }
    
    public List<Benefit> findByEmployeeId(UUID employeeId) {
        return benefitRepository.findByEmployeeId(employeeId);
    }
    
    public List<Benefit> findByPositionId(UUID positionId) {
        return benefitRepository.findByPositionId(positionId);
    }
    
    public List<Benefit> findExpiredBenefits() {
        return benefitRepository.findByEndDateBefore(LocalDateTime.now());
    }
    
    public List<Benefit> findByEmployeeIdAndPositionId(UUID employeeId, UUID positionId) {
        return benefitRepository.findByEmployeeIdAndPositionId(employeeId, positionId);
    }
    
    public List<Benefit> findActiveBenefits() {
        return benefitRepository.findByEndDateIsNull();
    }
    
    public List<Benefit> findAll() {
        return benefitRepository.findAll();
    }
} 
