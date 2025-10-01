package br.com.fleetmanager.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.fleetmanager.exception.ResourceNotFoundException;
import br.com.fleetmanager.model.PerformanceEvaluation;
import br.com.fleetmanager.model.enums.EvaluationStatus;
import br.com.fleetmanager.repository.PerformanceEvaluationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PerformanceEvaluationService {
    
    private final PerformanceEvaluationRepository evaluationRepository;
    
    @Transactional
    public PerformanceEvaluation create(PerformanceEvaluation evaluation) {
        validateEvaluation(evaluation);
        evaluation.setStatus(EvaluationStatus.PENDING);
        return evaluationRepository.save(evaluation);
    }
    
    @Transactional
    public PerformanceEvaluation update(UUID id, PerformanceEvaluation evaluation) {
        PerformanceEvaluation existingEvaluation = findById(id);
        validateEvaluation(evaluation);
        
        existingEvaluation.setEvaluationType(evaluation.getEvaluationType());
        existingEvaluation.setScore(evaluation.getScore());
        existingEvaluation.setComments(evaluation.getComments());
        
        return evaluationRepository.save(existingEvaluation);
    }
    
    @Transactional
    public PerformanceEvaluation startEvaluation(UUID id) {
        PerformanceEvaluation evaluation = findById(id);
        evaluation.setStatus(EvaluationStatus.IN_PROGRESS);
        return evaluationRepository.save(evaluation);
    }
    
    @Transactional
    public PerformanceEvaluation completeEvaluation(UUID id) {
        PerformanceEvaluation evaluation = findById(id);
        evaluation.setStatus(EvaluationStatus.COMPLETED);
        return evaluationRepository.save(evaluation);
    }
    
    @Transactional
    public PerformanceEvaluation reviewEvaluation(UUID id) {
        PerformanceEvaluation evaluation = findById(id);
        evaluation.setStatus(EvaluationStatus.IN_PROGRESS);
        return evaluationRepository.save(evaluation);
    }
    
    @Transactional
    public PerformanceEvaluation approveEvaluation(UUID id) {
        PerformanceEvaluation evaluation = findById(id);
        evaluation.setStatus(EvaluationStatus.COMPLETED);
        return evaluationRepository.save(evaluation);
    }
    
    public PerformanceEvaluation findById(UUID id) {
        return evaluationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Performance evaluation not found"));
    }
    
    public List<PerformanceEvaluation> findByEmployeeId(UUID employeeId) {
        return evaluationRepository.findByEmployeeId(employeeId);
    }
    
    public List<PerformanceEvaluation> findByEvaluatorId(UUID evaluatorId) {
        return evaluationRepository.findByEvaluatorId(evaluatorId);
    }
    
    public List<PerformanceEvaluation> findByEmployeeIdAndStatus(UUID employeeId, EvaluationStatus status) {
        return evaluationRepository.findByEmployeeIdAndStatus(employeeId, status);
    }
    
    public List<PerformanceEvaluation> findByEvaluationDateBetween(LocalDate startDate, LocalDate endDate) {
        return evaluationRepository.findByEvaluationDateBetween(startDate, endDate);
    }
    
    private void validateEvaluation(PerformanceEvaluation evaluation) {
        if (evaluation.getEvaluationDate() == null) {
            throw new IllegalArgumentException("Evaluation date is required");
        }
        
        if (evaluation.getScore() != null && (evaluation.getScore() < 0 || evaluation.getScore() > 10)) {
            throw new IllegalArgumentException("Score must be between 0 and 10");
        }
        
        if (evaluation.getEvaluationType() == null) {
            throw new IllegalArgumentException("Evaluation type is required");
        }
    }
} 