package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.JobCandidate;
import com.z7design.fleet_manager.model.enums.CandidateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobCandidateRepository extends JpaRepository<JobCandidate, UUID> {
    
    // Buscar candidatos por vaga
    @Query("SELECT jc FROM JobCandidate jc WHERE jc.jobVacancy.id = :jobVacancyId")
    List<JobCandidate> findByJobVacancyId(@Param("jobVacancyId") UUID jobVacancyId);
    
    // Buscar candidatos por status
    List<JobCandidate> findByStatus(CandidateStatus status);
    
    // Buscar candidatos por vaga e status
    @Query("SELECT jc FROM JobCandidate jc WHERE jc.jobVacancy.id = :jobVacancyId AND jc.status = :status")
    List<JobCandidate> findByJobVacancyIdAndStatus(@Param("jobVacancyId") UUID jobVacancyId, @Param("status") CandidateStatus status);
    
    // Buscar candidatos por email
    List<JobCandidate> findByEmail(String email);
    
    // Buscar candidatos por CPF
    List<JobCandidate> findByCpf(String cpf);
    
    // Verificar se existe candidato com CPF ou email
    @Query("SELECT COUNT(jc) > 0 FROM JobCandidate jc WHERE jc.cpf = :cpf OR jc.email = :email")
    boolean existsByCpfOrEmail(@Param("cpf") String cpf, @Param("email") String email);
    
    // Buscar candidatos por nome (busca fuzzy)
    List<JobCandidate> findByNameContainingIgnoreCase(String name);
    
    // Buscar candidatos por cidade
    List<JobCandidate> findByCityContainingIgnoreCase(String city);
    
    // Buscar candidatos por estado
    List<JobCandidate> findByState(String state);
    
    // Contar candidatos por vaga
    @Query("SELECT COUNT(jc) FROM JobCandidate jc WHERE jc.jobVacancy.id = :jobVacancyId")
    long countByJobVacancyId(@Param("jobVacancyId") UUID jobVacancyId);
    
    // Contar candidatos por status
    long countByStatus(CandidateStatus status);
    
    // Contar candidatos por vaga e status
    @Query("SELECT COUNT(jc) FROM JobCandidate jc WHERE jc.jobVacancy.id = :jobVacancyId AND jc.status = :status")
    long countByJobVacancyIdAndStatus(@Param("jobVacancyId") UUID jobVacancyId, @Param("status") CandidateStatus status);
    
    // Buscar candidatos com informaÃ§Ãµes da vaga
    //@Query("SELECT jc FROM JobCandidate jc JOIN FETCH jc.jobVacancy jv WHERE jv.id = :jobVacancyId ORDER BY jc.createdAt DESC")
    //@Query removida para evitar problemas de duplicidade e lazy loading
    List<JobCandidate> findByJobVacancyIdOrderByCreatedAtDesc(UUID jobVacancyId);
    
    // Buscar candidatos recentes
    @Query("SELECT jc FROM JobCandidate jc JOIN FETCH jc.jobVacancy jv ORDER BY jc.createdAt DESC")
    List<JobCandidate> findRecentCandidates();
    
    // Buscar candidatos por faixa salarial
    @Query("SELECT jc FROM JobCandidate jc WHERE jc.expectedSalary BETWEEN :minSalary AND :maxSalary")
    List<JobCandidate> findByExpectedSalaryRange(@Param("minSalary") java.math.BigDecimal minSalary, 
                                                @Param("maxSalary") java.math.BigDecimal maxSalary);
    
    // Buscar candidatos por anos de experiÃªncia
    @Query("SELECT jc FROM JobCandidate jc WHERE jc.experienceYears >= :minExperience")
    List<JobCandidate> findByMinimumExperience(@Param("minExperience") Integer minExperience);
} 
