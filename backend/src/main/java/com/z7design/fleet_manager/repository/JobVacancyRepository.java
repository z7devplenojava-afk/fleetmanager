package com.z7design.fleet_manager.repository;

import com.z7design.fleet_manager.model.JobVacancy;
import com.z7design.fleet_manager.model.enums.VacancyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobVacancyRepository extends JpaRepository<JobVacancy, UUID> {
    
    // Buscar vagas por status
    List<JobVacancy> findByStatus(VacancyStatus status);
    
    // Buscar vagas por posiÃ§Ã£o
    List<JobVacancy> findByPositionContainingIgnoreCase(String position);
    
    // Buscar vagas por localizaÃ§Ã£o
    List<JobVacancy> findByLocationContainingIgnoreCase(String location);
    
    // Buscar vagas por status e posiÃ§Ã£o
    List<JobVacancy> findByStatusAndPositionContainingIgnoreCase(VacancyStatus status, String position);
    
    // Buscar vagas por status e localizaÃ§Ã£o
    List<JobVacancy> findByStatusAndLocationContainingIgnoreCase(VacancyStatus status, String location);
    
    // Buscar vagas abertas com prazo vÃ¡lido
    @Query("SELECT jv FROM JobVacancy jv WHERE jv.status = 'OPEN' AND jv.deadline > :now ORDER BY jv.createdAt DESC")
    List<JobVacancy> findOpenVacanciesWithValidDeadline(@Param("now") LocalDateTime now);
    
    // Buscar vagas por tÃ­tulo (busca fuzzy)
    List<JobVacancy> findByTitleContainingIgnoreCase(String title);
    
    // Buscar vagas com prazo vencendo em X dias
    @Query("SELECT jv FROM JobVacancy jv WHERE jv.status = 'OPEN' AND jv.deadline BETWEEN :now AND :deadline ORDER BY jv.deadline ASC")
    List<JobVacancy> findVacanciesExpiringSoon(@Param("now") LocalDateTime now, @Param("deadline") LocalDateTime deadline);
    
    // Buscar vagas abertas (sem filtrar deadline)
    List<JobVacancy> findByStatusOrderByCreatedAtDesc(VacancyStatus status);
    
    // Contar vagas por status
    long countByStatus(VacancyStatus status);
    
    // Contar vagas abertas
    @Query("SELECT COUNT(jv) FROM JobVacancy jv WHERE jv.status = 'OPEN' AND jv.deadline > :now")
    long countOpenVacancies(@Param("now") LocalDateTime now);
} 
