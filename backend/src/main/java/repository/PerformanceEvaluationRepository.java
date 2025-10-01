package br.com.fleetmanager.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.fleetmanager.model.PerformanceEvaluation;
import br.com.fleetmanager.model.enums.EvaluationStatus;

@Repository
public interface PerformanceEvaluationRepository extends JpaRepository<PerformanceEvaluation, UUID> {
    List<PerformanceEvaluation> findByEmployeeId(UUID employeeId);
    List<PerformanceEvaluation> findByEvaluatorId(UUID evaluatorId);
    List<PerformanceEvaluation> findByEmployeeIdAndStatus(UUID employeeId, EvaluationStatus status);
    List<PerformanceEvaluation> findByEvaluationDateBetween(LocalDate startDate, LocalDate endDate);
    List<PerformanceEvaluation> findByEmployeeIdAndEvaluationDateBetween(UUID employeeId, LocalDate startDate, LocalDate endDate);
} 