package br.com.fleetmanager.repository;

import br.com.fleetmanager.model.JobVacancy;
import br.com.fleetmanager.model.enums.VacancyStatus;
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
    
    // Buscar vagas por posição
    List<JobVacancy> findByPositionContainingIgnoreCase(String position);
    
    // Buscar vagas por localização
    List<JobVacancy> findByLocationContainingIgnoreCase(String location);
    
    // Buscar vagas por status e posição
    List<JobVacancy> findByStatusAndPositionContainingIgnoreCase(VacancyStatus status, String position);
    
    // Buscar vagas por status e localização
    List<JobVacancy> findByStatusAndLocationContainingIgnoreCase(VacancyStatus status, String location);
    
    // Buscar vagas abertas com prazo válido
    @Query("SELECT jv FROM JobVacancy jv WHERE jv.status = 'OPEN' AND jv.deadline > :now ORDER BY jv.createdAt DESC")
    List<JobVacancy> findOpenVacanciesWithValidDeadline(@Param("now") LocalDateTime now);
    
    // Buscar vagas por título (busca fuzzy)
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