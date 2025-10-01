package br.com.fleetmanager.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.EmployeeCertification;
import br.com.fleetmanager.model.enums.CertificationStatus;
import br.com.fleetmanager.repository.EmployeeCertificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeCertificationService {
    
    private final EmployeeCertificationRepository certificationRepository;
    
    @Transactional
    public EmployeeCertification create(EmployeeCertification certification) {
        validateCertification(certification);
        certification.setStatus(CertificationStatus.ACTIVE);
        return certificationRepository.save(certification);
    }
    
    @Transactional
    public EmployeeCertification update(UUID id, EmployeeCertification certification) {
        EmployeeCertification existingCertification = findById(id);
        validateCertification(certification);
        
        existingCertification.setCertificationNumber(certification.getCertificationNumber());
        existingCertification.setIssueDate(certification.getIssueDate());
        existingCertification.setExpirationDate(certification.getExpirationDate());
        existingCertification.setDocumentUrl(certification.getDocumentUrl());
        
        return certificationRepository.save(existingCertification);
    }
    
    @Transactional
    public EmployeeCertification renew(UUID id, LocalDate newExpirationDate) {
        EmployeeCertification certification = findById(id);
        certification.setExpirationDate(newExpirationDate);
        certification.setStatus(CertificationStatus.RENEWED);
        return certificationRepository.save(certification);
    }
    
    @Transactional
    public EmployeeCertification cancel(UUID id) {
        EmployeeCertification certification = findById(id);
        certification.setStatus(CertificationStatus.CANCELLED);
        return certificationRepository.save(certification);
    }
    
    public EmployeeCertification findById(UUID id) {
        return certificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Certificação não encontrada"));
    }
    
    public List<EmployeeCertification> findByEmployeeId(UUID employeeId) {
        return certificationRepository.findByEmployeeId(employeeId);
    }
    
    public List<EmployeeCertification> findByEmployeeIdAndStatus(UUID employeeId, CertificationStatus status) {
        return certificationRepository.findByEmployeeIdAndStatus(employeeId, status);
    }
    
    public List<EmployeeCertification> findByTrainingId(UUID trainingId) {
        return certificationRepository.findByTrainingId(trainingId);
    }
    
    public List<EmployeeCertification> findExpiringSoon(LocalDate date) {
        return certificationRepository.findByExpirationDateBefore(date);
    }
    
    public List<EmployeeCertification> findExpiringBetween(LocalDate startDate, LocalDate endDate) {
        return certificationRepository.findByExpirationDateBetween(startDate, endDate);
    }
    
    private void validateCertification(EmployeeCertification certification) {
        if (certification.getIssueDate() == null) {
            throw new IllegalArgumentException("Data de emissão é obrigatória");
        }
        
        if (certification.getExpirationDate() != null && 
            certification.getIssueDate().isAfter(certification.getExpirationDate())) {
            throw new IllegalArgumentException("Data de emissão não pode ser posterior à data de expiração");
        }
    }
} 